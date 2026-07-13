/**
 * Code Generation Engine Subsystem
 * 
 * Wraps the Code Generation Engine and integrates it with the IDE runtime.
 * Receives tool results and context, then generates code using AI providers.
 */

import { BaseSubsystem } from "@/ide/kernel/subsystem";
import type { RuntimeEvent } from "@/ide/types";
import type { ContextAssemblyResult } from "@/ide/intelligence/context-engine";
import type { Task } from "@/ide/intelligence/planning-engine";
import type { ToolExecutionResult } from "@/ide/execution/tool-runtime";
import { GlobalEventBus } from "@/ide/streaming";
import { CodeGeneratorEngine } from "./code-generator-engine";
import type { CodeGenerationRequest, CodeGenerationResult, GenerationType } from "./types";

export class CodeGeneratorSubsystem extends BaseSubsystem {
  private codeGenerator: CodeGeneratorEngine;
  private recentResults = new Map<string, CodeGenerationResult>();

  constructor() {
    super({
      id: "code-generator",
      name: "Code Generation Engine",
      version: "1.0.0",
      capabilities: ["code-generation", "code-editing", "code-review", "autocomplete"],
      dependencies: ["context-engine", "tool-runtime", "ai-router"],
    });

    this.codeGenerator = new CodeGeneratorEngine();
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
    this.recentResults.clear();
    await super.stop();
  }

  /**
   * Handle incoming events
   */
  async onEvent(event: RuntimeEvent): Promise<void> {
    if (event.type === "context:ready" || event.type === "tool:completed") {
      await this.handleGenerationRequest(event);
    }
  }

  /**
   * Handle generation requests
   */
  private async handleGenerationRequest(event: RuntimeEvent): Promise<void> {
    const payload = (event.payload as Record<string, unknown>) || {};
    const context = payload.context as ContextAssemblyResult | undefined;
    const task = payload.task as Task | undefined;
    const toolResult = payload.result as ToolExecutionResult | undefined;

    if (!context || !task) {
      this.setError(new Error("Code Generator received event without context or task"));
      return;
    }

    try {
      const request = this.buildRequest(task, context, toolResult, event);
      const result = await this.codeGenerator.generate(request);

      this.recentResults.set(result.id, result);
      this.emitGenerationResult(result, event.correlationId);
    } catch (error) {
      this.setError(error);
      this.emitError(error, event.correlationId);
    }
  }

  /**
   * Build a code generation request from task and context
   */
  private buildRequest(
    task: Task,
    context: ContextAssemblyResult,
    toolResult: ToolExecutionResult | undefined,
    event: RuntimeEvent
  ): CodeGenerationRequest {
    return {
      id: this.generateId(),
      taskId: task.id,
      generationType: this.mapTaskCategoryToGenerationType(task.category),
      task,
      context,
      userMessage: toolResult?.output ? `Tool result: ${JSON.stringify(toolResult.output)}` : undefined,
      existingCode: context.relevantFiles.find(f => f.name === context.currentTask?.title)?.content,
      targetFiles: task.requiredContext.files,
      language: this.detectLanguage(task),
      framework: this.detectFramework(task),
      complexity: this.mapComplexity(task.complexity),
      subscription: "free",
      userId: event.sessionId,
      workspaceId: event.workspaceId,
      sessionId: event.sessionId,
      correlationId: event.correlationId,
      streaming: true,
    };
  }

  /**
   * Map task category to generation type
   */
  private mapTaskCategoryToGenerationType(category: string): GenerationType {
    const map: Record<string, GenerationType> = {
      create_file: "create_file",
      write_file: "create_file",
      edit_file: "edit_file",
      delete_file: "edit_file",
      rename_file: "rename_symbols",
      move_file: "edit_file",
      patch: "edit_file",
      generate: "create_file",
      verify: "generate_tests",
      review: "review",
      research: "explain",
      testing: "generate_tests",
      documentation: "generate_docs",
      database: "generate_sql",
      api: "generate_api",
      frontend: "generate_ui",
      backend: "generate_backend",
      configuration: "update_dependencies",
      refactoring: "refactor",
      fix: "fix_bug",
      optimize: "optimize",
    };

    return map[category] || "create_file";
  }

  /**
   * Detect language from task context
   */
  private detectLanguage(task: Task): string | undefined {
    const files = task.requiredContext.files;
    for (const file of files) {
      if (file.endsWith(".ts") || file.endsWith(".tsx")) return "typescript";
      if (file.endsWith(".js") || file.endsWith(".jsx")) return "javascript";
      if (file.endsWith(".py")) return "python";
      if (file.endsWith(".sql")) return "sql";
      if (file.endsWith(".css")) return "css";
      if (file.endsWith(".html")) return "html";
    }
    return undefined;
  }

  /**
   * Detect framework from task context
   */
  private detectFramework(task: Task): string | undefined {
    const files = task.requiredContext.files;
    const components = task.requiredContext.components;
    for (const file of files) {
      if (file.includes("next.config") || file.includes("app/") || file.includes("pages/")) return "nextjs";
      if (file.includes("tailwind")) return "tailwind";
      if (file.includes("supabase")) return "supabase";
    }
    if (components.some(c => c.includes("React") || c.includes("react"))) return "react";
    return undefined;
  }

  /**
   * Map task complexity to generation complexity
   */
  private mapComplexity(complexity: "very_small" | "small" | "medium" | "large" | "enterprise"): "low" | "medium" | "high" | "enterprise" {
    const map: Record<string, "low" | "medium" | "high" | "enterprise"> = {
      very_small: "low",
      small: "low",
      medium: "medium",
      large: "high",
      enterprise: "enterprise",
    };
    return map[complexity] || "medium";
  }

  /**
   * Emit generation result event
   */
  private emitGenerationResult(result: CodeGenerationResult, correlationId?: string): void {
    const event = {
      type: result.success ? "code:generated" : "code:failed",
      category: "generation" as const,
      priority: result.success ? "high" as const : "critical" as const,
      source: "code-generator",
      payload: { result },
      correlationId,
      timestamp: Date.now(),
    };

    console.log(`[Code Generator] ${result.success ? "Generated" : "Failed"}:`, {
      resultId: result.id,
      taskId: result.taskId,
      modelId: result.modelId,
      fileCount: result.files.length,
      success: result.success,
    });

    this.forwardEvent(event);
  }

  /**
   * Emit error event
   */
  private emitError(error: unknown, correlationId?: string): void {
    console.error("[Code Generator] Error:", error);
  }

  /**
   * Forward event to runtime kernel and streaming engine
   */
  private forwardEvent(event: Record<string, unknown>): void {
    GlobalEventBus.publish(event as Partial<RuntimeEvent>);
  }

  /**
   * Get recent results
   */
  getRecentResults(): CodeGenerationResult[] {
    return Array.from(this.recentResults.values()).slice(-10);
  }

  /**
   * Get metrics
   */
  getMetrics(): Record<string, unknown> {
    const results = Array.from(this.recentResults.values());
    const successCount = results.filter(r => r.success).length;
    const totalTokens = results.reduce((sum, r) => sum + r.tokenUsage.totalTokens, 0);

    return {
      ...super.getMetrics(),
      totalGenerations: results.length,
      successRate: results.length > 0 ? successCount / results.length : 0,
      totalTokens,
      averageDuration: results.length > 0 ? results.reduce((sum, r) => sum + r.duration, 0) / results.length : 0,
      availableModels: this.codeGenerator.getModelRegistry().getAll().length,
      registeredProviders: Object.keys(this.codeGenerator.getProviderRegistry()).length,
    };
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): Record<string, unknown> {
    const recent = this.getRecentResults();
    return {
      ...super.getDiagnostics(),
      recentGenerations: recent.map(r => ({
        id: r.id,
        taskId: r.taskId,
        generationType: r.generationType,
        modelId: r.modelId,
        success: r.success,
        fileCount: r.files.length,
        status: r.status,
      })),
      modelRegistry: this.codeGenerator.getModelRegistry().getAll().length,
    };
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
