/**
 * Tool Calling Runtime
 * 
 * The main engine that coordinates tool execution based on execution plans.
 * Receives tasks, resolves tools, validates safety, executes, and streams events.
 */

import type { ExecutionPlan, Task } from "@/ide/intelligence/planning-engine";
import type { ContextAssemblyResult } from "@/ide/intelligence/context-engine";
import { ToolRegistry } from "./tool-registry";
import { ToolResolver } from "./tool-resolver";
import { SafetyLayer } from "./safety-layer";
import { ToolCache } from "./tool-cache";
import { ToolExecutor } from "./tool-executor";
import type {
  ToolExecutionRequest,
  ToolExecutionResult,
  ToolExecutionBatch,
  ToolExecutionStatus,
  UserPermissions,
  ToolRuntimeEvent,
  ToolRuntimeConfig,
  ToolExecutionStats,
} from "./types";

export interface ToolRuntimeExecuteOptions {
  plan: ExecutionPlan;
  task: Task;
  context?: ContextAssemblyResult;
  userPermissions?: UserPermissions;
  sessionId?: string;
  workspaceId?: string;
  userId?: string;
  modelType?: string;
}

export class ToolRuntime {
  private registry: ToolRegistry;
  private resolver: ToolResolver;
  private safety: SafetyLayer;
  private cache: ToolCache;
  private executor: ToolExecutor;
  private config: ToolRuntimeConfig;
  private executionHistory = new Map<string, ToolExecutionResult>();
  private executionStats: ToolExecutionStats = {
    totalExecutions: 0,
    successful: 0,
    failed: 0,
    retried: 0,
    cancelled: 0,
    cacheHits: 0,
    averageDuration: 0,
    totalTokens: 0,
  };

  constructor(config: Partial<ToolRuntimeConfig> = {}) {
    this.config = {
      defaultTimeout: 30000,
      maxParallelExecutions: 5,
      enableCaching: true,
      enableStreaming: true,
      enableSafety: true,
      workspaceRoot: process.cwd(),
      protectedPaths: ["node_modules", ".git", ".env"],
      protectedFiles: [".env", "secrets.json"],
      allowedCommands: ["npm", "npx", "node", "git", "tsc", "eslint", "prettier"],
      blockedCommands: ["rm -rf /"],
      maxRetries: 3,
      defaultRetryPolicy: {
        maxAttempts: 2,
        backoffMs: 500,
        backoffMultiplier: 2,
        retryableErrors: ["timeout", "network"],
      },
      ...config,
    };

    this.registry = new ToolRegistry();
    this.resolver = new ToolResolver(this.registry);
    this.safety = new SafetyLayer({
      workspaceRoot: this.config.workspaceRoot,
      protectedPaths: this.config.protectedPaths,
      protectedFiles: this.config.protectedFiles,
      allowedCommands: this.config.allowedCommands,
      blockedCommands: this.config.blockedCommands,
    });
    this.cache = new ToolCache();
    this.executor = new ToolExecutor(this.registry, this.safety, this.cache);
  }

  /**
   * Execute a single task
   */
  async executeTask(options: ToolRuntimeExecuteOptions): Promise<ToolExecutionResult> {
    const request = this.resolver.buildRequest(options.task, options.plan.planId);

    // Enrich request with context
    request.context = options.context;
    request.sessionId = options.sessionId;
    request.workspaceId = options.workspaceId;
    request.userId = options.userId;
    request.modelType = options.modelType;

    this.emitEvent("execution:started", request, "executing");

    try {
      const result = await this.executor.execute(request, options.userPermissions);
      this.updateStats(result);
      this.executionHistory.set(result.executionId, result);
      this.emitEvent("execution:completed", request, result.status, result);
      return result;
    } catch (error) {
      const failedResult = this.createUnknownErrorResult(request, error);
      this.updateStats(failedResult);
      this.emitEvent("execution:failed", request, "failed", failedResult);
      return failedResult;
    }
  }

  /**
   * Execute multiple tasks in parallel batches
   */
  async executeBatch(batches: ToolExecutionBatch[], options: {
    userPermissions?: UserPermissions;
    sessionId?: string;
    workspaceId?: string;
    userId?: string;
  }): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];

    for (const batch of batches) {
      const executionPromises = batch.executions.map(request =>
        this.executeSingleRequest(request, options)
      );

      if (batch.canParallelize) {
        const batchResults = await Promise.all(executionPromises);
        results.push(...batchResults);
      } else {
        for (const promise of executionPromises) {
          const result = await promise;
          results.push(result);
        }
      }

      batch.status = "completed";
      batch.results = results.filter(r => batch.executions.some(e => e.executionId === r.executionId));
    }

    return results;
  }

  /**
   * Execute a single request
   */
  private async executeSingleRequest(
    request: ToolExecutionRequest,
    options: {
      userPermissions?: UserPermissions;
      sessionId?: string;
      workspaceId?: string;
      userId?: string;
    }
  ): Promise<ToolExecutionResult> {
    request.sessionId = options.sessionId;
    request.workspaceId = options.workspaceId;
    request.userId = options.userId;

    this.emitEvent("execution:started", request, "executing");

    try {
      const result = await this.executor.execute(request, options.userPermissions);
      this.updateStats(result);
      this.executionHistory.set(result.executionId, result);
      this.emitEvent("execution:completed", request, result.status, result);
      return result;
    } catch (error) {
      const failedResult = this.createUnknownErrorResult(request, error);
      this.updateStats(failedResult);
      this.emitEvent("execution:failed", request, "failed", failedResult);
      return failedResult;
    }
  }

  /**
   * Build execution batches from a plan
   */
  buildExecutionBatches(plan: ExecutionPlan, context?: ContextAssemblyResult): ToolExecutionBatch[] {
    const batches: ToolExecutionBatch[] = [];

    for (const group of plan.parallelGroups) {
      const executions: ToolExecutionRequest[] = [];

      for (const taskId of group.taskIds) {
        const task = plan.tasks.find(t => t.id === taskId);
        if (!task) continue;

        const request = this.resolver.buildRequest(task, plan.planId);
        request.context = context;
        executions.push(request);
      }

      batches.push({
        batchId: this.generateId(),
        batchNumber: group.batchNumber,
        executions,
        canParallelize: true,
        dependencies: [],
        status: "pending",
        results: [],
      });
    }

    return batches;
  }

  /**
   * Create execution batches from a single task
   */
  buildSingleTaskBatch(task: Task, planId?: string, context?: ContextAssemblyResult): ToolExecutionBatch {
    const request = this.resolver.buildRequest(task, planId);
    request.context = context;

    return {
      batchId: this.generateId(),
      batchNumber: 1,
      executions: [request],
      canParallelize: false,
      dependencies: [],
      status: "pending",
      results: [],
    };
  }

  /**
   * Register a new tool
   */
  registerTool(tool: { definition: { id: string }; execute: (request: ToolExecutionRequest) => Promise<ToolExecutionResult> }): void {
    this.registry.register(tool as any);
  }

  /**
   * Get tool registry
   */
  getRegistry(): ToolRegistry {
    return this.registry;
  }

  /**
   * Get execution result
   */
  getResult(executionId: string): ToolExecutionResult | undefined {
    return this.executionHistory.get(executionId);
  }

  /**
   * Get execution statistics
   */
  getStats(): ToolExecutionStats {
    return { ...this.executionStats };
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number } {
    return this.cache.getStats();
  }

  /**
   * Invalidate cache by file path
   */
  invalidateCacheByPath(filePath: string): void {
    this.cache.invalidateByPath(filePath);
  }

  /**
   * Clear all execution history
   */
  clearHistory(): void {
    this.executionHistory.clear();
  }

  /**
   * Update execution statistics
   */
  private updateStats(result: ToolExecutionResult): void {
    this.executionStats.totalExecutions++;
    if (result.success) this.executionStats.successful++;
    else this.executionStats.failed++;
    if (result.retryCount > 0) this.executionStats.retried++;
    if (result.status === "cancelled") this.executionStats.cancelled++;
    if (result.cached) this.executionStats.cacheHits++;

    const totalDuration = this.executionStats.averageDuration * (this.executionStats.totalExecutions - 1) + result.duration;
    this.executionStats.averageDuration = totalDuration / this.executionStats.totalExecutions;
  }

  /**
   * Emit runtime event
   */
  private emitEvent(
    type: string,
    request: ToolExecutionRequest,
    status: ToolExecutionStatus,
    result?: ToolExecutionResult
  ): void {
    if (!this.config.enableStreaming) return;

    const event: ToolRuntimeEvent = {
      id: this.generateId(),
      type,
      executionId: request.executionId,
      taskId: request.taskId,
      toolId: request.toolId,
      status,
      payload: {
        input: request.input,
        result: result || {},
      },
      timestamp: Date.now(),
      correlationId: request.correlationId,
      sessionId: request.sessionId,
      workspaceId: request.workspaceId,
    };

    // This would be sent to the streaming engine
    this.streamEvent(event);
  }

  /**
   * Stream event to any listeners
   */
  private streamEvent(event: ToolRuntimeEvent): void {
    // Integration point with streaming engine
    console.log(`[Tool Runtime] ${event.type}:`, {
      executionId: event.executionId,
      taskId: event.taskId,
      toolId: event.toolId,
      status: event.status,
    });
  }

  /**
   * Create an unknown error result
   */
  private createUnknownErrorResult(request: ToolExecutionRequest, error: unknown): ToolExecutionResult {
    const now = Date.now();
    return {
      executionId: request.executionId,
      taskId: request.taskId,
      toolId: request.toolId,
      status: "failed",
      success: false,
      output: {},
      error: {
        code: "runtime_error",
        message: error instanceof Error ? error.message : String(error),
        recoverable: false,
      },
      duration: 0,
      startTime: now,
      endTime: now,
      retryCount: 0,
      cached: false,
      logs: [],
      artifacts: [],
      metadata: {
        inputSize: JSON.stringify(request.input).length,
        outputSize: 0,
        cacheHit: false,
        permissionLevel: "safe",
      },
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
