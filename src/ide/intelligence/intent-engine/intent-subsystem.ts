/**
 * Intent Engine Subsystem
 * 
 * This subsystem wraps the Intent Engine and integrates it with the IDE runtime.
 * It listens for user messages and emits intent analysis results as events.
 */

import { BaseSubsystem } from "@/ide/kernel/subsystem";
import type { RuntimeEvent } from "@/ide/types";
import { GlobalEventBus } from "@/ide/streaming";
import { IntentEngine } from "./intent-engine";
import type {
  IntentAnalysisInput,
  IntentAnalysisResult,
  WorkspaceContext,
} from "./types";

export class IntentEngineSubsystem extends BaseSubsystem {
  private intentEngine: IntentEngine;
  private analysisHistory = new Map<string, IntentAnalysisResult>();

  constructor() {
    super({
      id: "intent-engine",
      name: "Intent & Objective Engine",
      version: "1.0.0",
      capabilities: ["intent-analysis", "objective-extraction", "requirement-detection"],
      dependencies: ["workspace-engine", "memory-engine"],
    });

    this.intentEngine = new IntentEngine();
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
    this.analysisHistory.clear();
    this.intentEngine.clearCache();
    await super.stop();
  }

  /**
   * Handle incoming events
   */
  async onEvent(event: RuntimeEvent): Promise<void> {
    // Listen for user message events
    if (event.type === "user:message") {
      await this.handleUserMessage(event);
    }

    // Listen for workspace context updates
    if (event.type === "workspace:updated") {
      await this.handleWorkspaceUpdate(event);
    }
  }

  /**
   * Handle user message events
   */
  private async handleUserMessage(event: RuntimeEvent): Promise<void> {
    const payload = (event.payload as Record<string, unknown>) || {};
    const message = String(payload.message || "");
    const workspaceContext = payload.workspaceContext as WorkspaceContext | undefined;
    const userId = payload.userId as string | undefined;
    const workspaceId = payload.workspaceId as string | undefined;

    if (!message) {
      return;
    }

    try {
      // Build the analysis input
      const input: IntentAnalysisInput = {
        userMessage: message,
        workspaceContext: workspaceContext || this.buildDefaultContext(),
        userId,
        workspaceId,
      };

      // Perform intent analysis
      const result = await this.intentEngine.analyze(input);

      // Store in history
      this.analysisHistory.set(result.analysisId, result);

      // Emit intent analysis result event
      this.emitIntentResult(result, event.correlationId);
    } catch (error) {
      this.setError(error);
      this.emitError(error, event.correlationId);
    }
  }

  /**
   * Handle workspace update events
   */
  private async handleWorkspaceUpdate(event: RuntimeEvent): Promise<void> {
    // Clear cache when workspace changes significantly
    this.intentEngine.clearCache();
  }

  /**
   * Build default workspace context
   */
  private buildDefaultContext(): WorkspaceContext {
    return {
      openTabs: [],
      cursorPosition: undefined,
      selection: undefined,
      workspaceSummary: undefined,
      knowledgeGraphSummary: undefined,
      recentEdits: undefined,
      conversationSummary: undefined,
      projectMemorySummary: undefined,
    };
  }

  /**
   * Emit intent analysis result event
   */
  private emitIntentResult(result: IntentAnalysisResult, correlationId?: string): void {
    const event = {
      type: "intent:analysis_complete",
      category: "planner",
      priority: "high" as const,
      source: "intent-engine",
      payload: { intentAnalysis: result },
      correlationId,
      timestamp: Date.now(),
    };

    // This would emit an event through the runtime kernel
    // For now, we'll log it
    console.log("[Intent Engine] Analysis complete:", {
      analysisId: result.analysisId,
      primaryGoal: result.primaryGoal,
      confidence: result.overallConfidence,
      complexity: result.complexity,
      clarificationNeeded: result.clarificationNeeded,
    });

    // Forward to any registered listeners
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
    console.error("[Intent Engine] Error:", error);
  }

  /**
   * Get analysis result by ID
   */
  getAnalysisResult(analysisId: string): IntentAnalysisResult | undefined {
    return this.analysisHistory.get(analysisId);
  }

  /**
   * Get recent analysis results
   */
  getRecentAnalyses(limit: number = 10): IntentAnalysisResult[] {
    const results = Array.from(this.analysisHistory.values());
    return results
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Get subsystem metrics
   */
  getMetrics(): Record<string, unknown> {
    return {
      ...super.getMetrics(),
      analysesPerformed: this.analysisHistory.size,
      cacheSize: (this.intentEngine as any).analysisCache?.size || 0,
    };
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): Record<string, unknown> {
    return {
      ...super.getDiagnostics(),
      recentAnalyses: this.getRecentAnalyses(5).map(a => ({
        analysisId: a.analysisId,
        primaryGoal: a.primaryGoal,
        confidence: a.overallConfidence,
        timestamp: a.timestamp,
      })),
    };
  }
}
