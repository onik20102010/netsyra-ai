/**
 * Tool Calling Runtime Subsystem
 * 
 * Wraps the Tool Runtime and integrates it with the IDE runtime.
 * Receives context-ready events and executes tasks using tools.
 */

import { BaseSubsystem } from "@/ide/kernel/subsystem";
import type { RuntimeEvent } from "@/ide/types";
import type { ExecutionPlan, Task } from "@/ide/intelligence/planning-engine";
import type { ContextAssemblyResult } from "@/ide/intelligence/context-engine";
import { GlobalEventBus } from "@/ide/streaming";
import { ToolRuntime } from "./tool-runtime";
import type { ToolExecutionResult, ToolRuntimeConfig } from "./types";

export class ToolRuntimeSubsystem extends BaseSubsystem {
  private toolRuntime: ToolRuntime;
  private activeExecutions = new Map<string, ToolExecutionResult>();

  constructor() {
    super({
      id: "tool-runtime",
      name: "Tool Calling Runtime",
      version: "1.0.0",
      capabilities: ["tool-execution", "task-execution", "workspace-operations"],
      dependencies: ["context-engine", "task-graph", "workspace-engine", "knowledge-graph"],
    });

    this.toolRuntime = new ToolRuntime();
  }

  async initialize(config?: import("@/ide/types").SubsystemConfig): Promise<void> {
    await super.initialize(config);
    this.toolRuntime = new ToolRuntime((config as unknown) as ToolRuntimeConfig);
    this.lifecycle = "initialized";
  }

  async start(): Promise<void> {
    this.lifecycle = "starting";
    this.lifecycle = "running";
  }

  async stop(): Promise<void> {
    this.lifecycle = "stopping";
    this.activeExecutions.clear();
    await super.stop();
  }

  /**
   * Handle incoming events
   */
  async onEvent(event: RuntimeEvent): Promise<void> {
    if (event.type === "context:ready") {
      await this.handleContextReady(event);
    }

    if (event.type === "task:execute") {
      await this.handleTaskExecute(event);
    }

    if (event.type === "file:changed") {
      const payload = (event.payload as Record<string, unknown>) || {};
      const filePath = payload.file as string | undefined;
      if (filePath) {
        this.toolRuntime.invalidateCacheByPath(filePath);
      }
    }
  }

  /**
   * Handle context ready events
   */
  private async handleContextReady(event: RuntimeEvent): Promise<void> {
    const payload = (event.payload as Record<string, unknown>) || {};
    const context = payload.context as ContextAssemblyResult | undefined;
    const task = payload.task as Task | undefined;
    const plan = payload.plan as ExecutionPlan | undefined;

    if (!task && !plan) {
      this.setError(new Error("Tool Runtime received context event without task or plan"));
      return;
    }

    try {
      if (task && plan) {
        const result = await this.toolRuntime.executeTask({
          plan,
          task,
          context,
          sessionId: event.sessionId,
          workspaceId: event.workspaceId,
        });

        this.activeExecutions.set(result.executionId, result);
        this.emitExecutionResult(result, event.correlationId);
      } else if (plan) {
        // Execute entire plan
        const batches = this.toolRuntime.buildExecutionBatches(plan, context);
        await this.toolRuntime.executeBatch(batches, {
          sessionId: event.sessionId,
          workspaceId: event.workspaceId,
        });
      }
    } catch (error) {
      this.setError(error);
      this.emitError(error, event.correlationId);
    }
  }

  /**
   * Handle explicit task execution requests
   */
  private async handleTaskExecute(event: RuntimeEvent): Promise<void> {
    const payload = (event.payload as Record<string, unknown>) || {};
    const task = payload.task as Task | undefined;
    const plan = payload.plan as ExecutionPlan | undefined;
    const context = payload.context as ContextAssemblyResult | undefined;

    if (!task) {
      this.setError(new Error("Tool Runtime received task execute event without task"));
      return;
    }

    if (!plan) {
      this.setError(new Error("Tool Runtime received task execute event without plan"));
      return;
    }

    try {
      const result = await this.toolRuntime.executeTask({
        plan,
        task,
        context,
        sessionId: event.sessionId,
        workspaceId: event.workspaceId,
      });

      this.activeExecutions.set(result.executionId, result);
      this.emitExecutionResult(result, event.correlationId);
    } catch (error) {
      this.setError(error);
      this.emitError(error, event.correlationId);
    }
  }

  /**
   * Emit execution result event
   */
  private emitExecutionResult(result: ToolExecutionResult, correlationId?: string): void {
    const event = {
      type: result.success ? "tool:completed" : "tool:failed",
      category: "execution" as const,
      priority: result.success ? "normal" as const : "high" as const,
      source: "tool-runtime",
      payload: { result },
      correlationId,
      timestamp: Date.now(),
    };

    console.log(`[Tool Runtime Subsystem] ${result.success ? "Completed" : "Failed"}:`, {
      executionId: result.executionId,
      taskId: result.taskId,
      toolId: result.toolId,
      duration: result.duration,
    });

    this.forwardEvent(event);
  }

  /**
   * Emit error event
   */
  private emitError(error: unknown, correlationId?: string): void {
    console.error("[Tool Runtime Subsystem] Error:", error);
  }

  /**
   * Forward event to runtime kernel and streaming engine
   */
  private forwardEvent(event: Record<string, unknown>): void {
    GlobalEventBus.publish(event as Partial<RuntimeEvent>);
  }

  /**
   * Get active executions
   */
  getActiveExecutions(): ToolExecutionResult[] {
    return Array.from(this.activeExecutions.values());
  }

  /**
   * Get metrics
   */
  getMetrics(): Record<string, unknown> {
    const stats = this.toolRuntime.getStats();
    const cacheStats = this.toolRuntime.getCacheStats();

    return {
      ...super.getMetrics(),
      ...stats,
      cacheSize: cacheStats.size,
      activeExecutions: this.activeExecutions.size,
      registeredTools: this.toolRuntime.getRegistry().getAllTools().length,
    };
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): Record<string, unknown> {
    const stats = this.toolRuntime.getStats();
    return {
      ...super.getDiagnostics(),
      stats,
      recentResults: Array.from(this.activeExecutions.values())
        .slice(-5)
        .map(r => ({
          executionId: r.executionId,
          taskId: r.taskId,
          toolId: r.toolId,
          success: r.success,
          duration: r.duration,
        })),
    };
  }
}
