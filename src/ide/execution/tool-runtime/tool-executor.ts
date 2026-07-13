/**
 * Tool Executor
 * 
 * Executes tools with retry, timeout, caching, and validation.
 * Handles error recovery and fallback tools.
 */

import { ToolRegistry } from "./tool-registry";
import { SafetyLayer } from "./safety-layer";
import { ToolCache } from "./tool-cache";
import type {
  Tool,
  ToolExecutionRequest,
  ToolExecutionResult,
  ToolExecutionStatus,
  ToolExecutionLog,
  UserPermissions,
  ToolExecutionMetadata,
} from "./types";

export class ToolExecutor {
  private registry: ToolRegistry;
  private safety: SafetyLayer;
  private cache: ToolCache;

  constructor(registry: ToolRegistry, safety: SafetyLayer, cache: ToolCache) {
    this.registry = registry;
    this.safety = safety;
    this.cache = cache;
  }

  /**
   * Execute a tool with full lifecycle management
   */
  async execute(request: ToolExecutionRequest, userPermissions?: UserPermissions): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const logs: ToolExecutionLog[] = [];

    // Resolve tool
    const tool = this.registry.get(request.toolId);
    if (!tool) {
      return this.createErrorResult(
        request,
        startTime,
        "tool_not_found",
        `Tool "${request.toolId}" not found in registry`,
        logs
      );
    }

    // Validate input schema
    logs.push({ timestamp: Date.now(), level: "info", message: `Validating input for tool ${tool.definition.id}` });
    const inputErrors = tool.validateInput ? tool.validateInput(request.input) : [];
    if (inputErrors.length > 0) {
      return this.createErrorResult(
        request,
        startTime,
        "input_validation",
        inputErrors.join("; "),
        logs
      );
    }

    // Safety validation
    logs.push({ timestamp: Date.now(), level: "info", message: "Running safety checks" });
    const safetyResult = this.safety.validate(request, tool, userPermissions);
    if (!safetyResult.allowed) {
      return this.createErrorResult(
        request,
        startTime,
        "safety_blocked",
        safetyResult.reason || "Safety validation failed",
        logs,
        safetyResult.alternatives?.join("; ")
      );
    }

    // Check cache
    if (tool.definition.cacheable) {
      const cached = this.cache.get(request);
      if (cached) {
        logs.push({ timestamp: Date.now(), level: "info", message: "Cache hit, returning cached result" });
        return {
          ...cached,
          executionId: request.executionId,
          taskId: request.taskId,
          startTime,
          endTime: Date.now(),
          duration: Date.now() - startTime,
          cached: true,
          logs: [...cached.logs, ...logs],
        };
      }
    }

    // Execute with retry
    const result = await this.executeWithRetry(request, tool, startTime, logs);

    // Cache successful results
    if (result.success && tool.definition.cacheable) {
      this.cache.set(request, result, tool.definition.timeout);
    }

    return result;
  }

  /**
   * Execute a tool with retry logic
   */
  private async executeWithRetry(
    request: ToolExecutionRequest,
    tool: Tool,
    startTime: number,
    logs: ToolExecutionLog[]
  ): Promise<ToolExecutionResult> {
    const policy = tool.definition.retryPolicy;
    let lastError: Error | undefined;
    let retryCount = 0;

    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      try {
        logs.push({ timestamp: Date.now(), level: "info", message: `Executing ${tool.definition.id} (attempt ${attempt})` });

        // Execute with timeout
        const timeoutPromise = this.createTimeout(tool.definition.timeout);
        const executionPromise = tool.execute(request);

        const result = await Promise.race([executionPromise, timeoutPromise]);

        // Validate output
        const outputErrors = tool.validateOutput ? tool.validateOutput(result.output) : [];
        if (outputErrors.length > 0) {
          throw new Error(`Output validation failed: ${outputErrors.join("; ")}`);
        }

        return this.normalizeResult(request, result, startTime, retryCount, logs);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logs.push({ timestamp: Date.now(), level: "warn", message: `Execution attempt ${attempt} failed: ${lastError.message}` });

        if (attempt < policy.maxAttempts && this.isRetryableError(lastError, policy)) {
          retryCount++;
          const backoff = policy.backoffMs * Math.pow(policy.backoffMultiplier, retryCount - 1);
          logs.push({ timestamp: Date.now(), level: "info", message: `Retrying in ${backoff}ms` });
          await this.delay(backoff);
        } else {
          break;
        }
      }
    }

    // Try fallback tool if available
    if (tool.definition.fallbackToolId) {
      logs.push({ timestamp: Date.now(), level: "info", message: `Trying fallback tool ${tool.definition.fallbackToolId}` });
      const fallback = this.registry.get(tool.definition.fallbackToolId);
      if (fallback) {
        try {
          const fallbackResult = await fallback.execute(request);
          return this.normalizeResult(request, fallbackResult, startTime, retryCount, logs, tool.definition.fallbackToolId);
        } catch (fallbackError) {
          logs.push({ timestamp: Date.now(), level: "error", message: `Fallback tool failed: ${fallbackError}` });
        }
      }
    }

    return this.createErrorResult(
      request,
      startTime,
      "execution_failed",
      lastError?.message || "Unknown execution error",
      logs,
      undefined,
      retryCount
    );
  }

  /**
   * Create a timeout promise
   */
  private createTimeout(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Tool execution timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
  }

  /**
   * Check if an error is retryable
   */
  private isRetryableError(error: Error, policy: ToolExecutionRequest["toolId"] extends string ? {
    maxAttempts: number;
    backoffMs: number;
    backoffMultiplier: number;
    retryableErrors: string[];
    retryableStatusCodes?: number[];
  } : never): boolean {
    const errorMessage = error.message.toLowerCase();
    for (const retryable of policy.retryableErrors) {
      if (errorMessage.includes(retryable.toLowerCase())) {
        return true;
      }
    }
    return false;
  }

  /**
   * Normalize a tool result
   */
  private normalizeResult(
    request: ToolExecutionRequest,
    result: ToolExecutionResult,
    startTime: number,
    retryCount: number,
    logs: ToolExecutionLog[],
    fallbackUsed?: string
  ): ToolExecutionResult {
    const endTime = Date.now();
    const inputSize = JSON.stringify(request.input).length;
    const outputSize = JSON.stringify(result.output).length;

    const metadata: ToolExecutionMetadata = {
      inputSize,
      outputSize,
      cacheHit: false,
      permissionLevel: "safe",
      fallbackUsed,
    };

    return {
      ...result,
      executionId: request.executionId,
      taskId: request.taskId,
      toolId: request.toolId,
      status: result.success ? "completed" : "failed",
      duration: endTime - startTime,
      startTime,
      endTime,
      retryCount,
      logs: [...logs, ...(result.logs || [])],
      metadata: {
        ...result.metadata,
        ...metadata,
      },
    };
  }

  /**
   * Create an error result
   */
  private createErrorResult(
    request: ToolExecutionRequest,
    startTime: number,
    code: string,
    message: string,
    logs: ToolExecutionLog[],
    suggestedAction?: string,
    retryCount = 0
  ): ToolExecutionResult {
    const endTime = Date.now();

    return {
      executionId: request.executionId,
      taskId: request.taskId,
      toolId: request.toolId,
      status: "failed",
      success: false,
      output: {},
      error: {
        code,
        message,
        recoverable: code === "safety_blocked" || code === "timeout",
        suggestedAction,
      },
      duration: endTime - startTime,
      startTime,
      endTime,
      retryCount,
      cached: false,
      logs,
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
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
