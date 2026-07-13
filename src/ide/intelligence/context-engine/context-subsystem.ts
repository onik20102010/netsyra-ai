/**
 * Context Assembly Engine Subsystem
 * 
 * Wraps the Context Engine and integrates it with the IDE runtime.
 * Listens for task-ready events and assembles context for AI models.
 */

import { BaseSubsystem } from "@/ide/kernel/subsystem";
import type { RuntimeEvent } from "@/ide/types";
import type { ExecutionPlan, Task } from "@/ide/intelligence/planning-engine";
import { GlobalEventBus } from "@/ide/streaming";
import { ContextEngine } from "./context-engine";
import type { ContextAssemblyRequest, ContextAssemblyResult } from "./types";

export class ContextEngineSubsystem extends BaseSubsystem {
  private contextEngine: ContextEngine;
  private currentResult?: ContextAssemblyResult;

  constructor() {
    super({
      id: "context-engine",
      name: "Context Assembly Engine",
      version: "1.0.0",
      capabilities: ["context-assembly", "context-optimization", "context-caching"],
      dependencies: ["planning-engine", "workspace-engine", "knowledge-graph", "memory-engine"],
    });

    this.contextEngine = new ContextEngine();
  }

  async initialize(): Promise<void> {
    await super.initialize();
    this.lifecycle = "initialized";
  }

  async start(): Promise<void> {
    this.lifecycle = "starting";
    this.lifecycle = "running";
  }

  async stop(): Promise<void> {
    this.lifecycle = "stopping";
    this.currentResult = undefined;
    await super.stop();
  }

  /**
   * Handle incoming events
   */
  async onEvent(event: RuntimeEvent): Promise<void> {
    if (event.type === "plan:complete" || event.type === "task:ready") {
      await this.handleTaskContextRequest(event);
    }

    if (event.type === "workspace:updated" || event.type === "file:changed") {
      // Incremental context updates for active task
      if (this.currentResult) {
        await this.handleIncrementalUpdate(event);
      }
    }
  }

  /**
   * Handle task context requests
   */
  private async handleTaskContextRequest(event: RuntimeEvent): Promise<void> {
    const payload = (event.payload as Record<string, unknown>) || {};
    const task = payload.task as Task | undefined;
    const plan = payload.plan as ExecutionPlan | undefined;

    if (!task && !plan) {
      this.setError(new Error("Context Engine received event without task or plan"));
      return;
    }

    try {
      const request: ContextAssemblyRequest = {
        taskId: task?.id,
        task,
        plan,
        currentFile: payload.currentFile as string | undefined,
        openTabs: payload.openTabs as string[] | undefined,
        cursorPosition: payload.cursorPosition as { line: number; column: number } | undefined,
        selection: payload.selection as { start: { line: number; column: number }; end: { line: number; column: number } } | undefined,
        recentEdits: payload.recentEdits as string[] | undefined,
        currentErrors: payload.currentErrors as string[] | undefined,
        modelType: payload.modelType as ContextAssemblyRequest["modelType"],
        maxTokens: payload.maxTokens as number | undefined,
        userId: event.sessionId,
        workspaceId: event.workspaceId,
        sessionId: event.sessionId,
      };

      const result = await this.contextEngine.assemble(request);
      this.currentResult = result;

      this.emitContextReady(result, event.correlationId);
    } catch (error) {
      this.setError(error);
      this.emitError(error, event.correlationId);
    }
  }

  /**
   * Handle incremental context updates
   */
  private async handleIncrementalUpdate(event: RuntimeEvent): Promise<void> {
    if (!this.currentResult) return;

    // Update only affected files in current context
    const payload = (event.payload as Record<string, unknown>) || {};
    const changedFile = payload.file as string | undefined;

    if (changedFile && this.currentResult.allItems.some(i => i.location === changedFile)) {
      // Re-assemble context incrementally
      const request: ContextAssemblyRequest = {
        currentFile: changedFile,
        modelType: "code_specialist",
        workspaceId: event.workspaceId,
        sessionId: event.sessionId,
      };

      const result = await this.contextEngine.assemble(request);
      this.currentResult = result;
      this.emitContextReady(result, event.correlationId);
    }
  }

  /**
   * Emit context ready event
   */
  private emitContextReady(result: ContextAssemblyResult, correlationId?: string): void {
    const event = {
      type: "context:ready",
      category: "execution" as const,
      priority: "high" as const,
      source: "context-engine",
      payload: {
        context: result,
        task: this.currentResult?.currentTask,
      },
      correlationId,
      timestamp: Date.now(),
    };

    console.log("[Context Engine] Context assembled:", {
      contextId: result.contextId,
      tokenCount: result.tokenCount,
      itemCount: result.allItems.length,
      cacheHitRate: result.cacheHitRate,
      relevanceScore: result.relevanceScore,
    });

    this.forwardEvent(event);
  }

  /**
   * Forward event to runtime kernel and streaming engine
   */
  private forwardEvent(event: Record<string, unknown>): void {
    GlobalEventBus.publish(event as Partial<RuntimeEvent>);
  }

  /**
   * Emit error event
   */
  private emitError(error: unknown, correlationId?: string): void {
    console.error("[Context Engine] Error:", error);
  }

  /**
   * Get current context
   */
  getCurrentContext(): ContextAssemblyResult | undefined {
    return this.currentResult;
  }

  /**
   * Get metrics
   */
  getMetrics(): Record<string, unknown> {
    const stats = this.contextEngine.getCacheStats();
    return {
      ...super.getMetrics(),
      currentContextId: this.currentResult?.contextId,
      cacheSize: stats.size,
      historySize: stats.historySize,
      lastTokenCount: this.currentResult?.tokenCount,
      lastRelevanceScore: this.currentResult?.relevanceScore,
    };
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): Record<string, unknown> {
    return {
      ...super.getDiagnostics(),
      currentContext: this.currentResult ? {
        contextId: this.currentResult.contextId,
        tokenCount: this.currentResult.tokenCount,
        originalTokenCount: this.currentResult.originalTokenCount,
        compressionRatio: this.currentResult.compressionRatio,
        cacheHitRate: this.currentResult.cacheHitRate,
        relevanceScore: this.currentResult.relevanceScore,
        valid: this.currentResult.validation.valid,
      } : null,
    };
  }
}
