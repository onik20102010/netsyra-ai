/**
 * Planning & Task Decomposition Subsystem
 * 
 * Wraps the Planning Engine and integrates it with the IDE runtime.
 * Receives intent analysis events and emits execution plans.
 */

import { BaseSubsystem } from "@/ide/kernel/subsystem";
import type { RuntimeEvent } from "@/ide/types";
import type { IntentAnalysisResult } from "@/ide/intelligence/intent-engine";
import { GlobalEventBus } from "@/ide/streaming";
import { PlanningEngine } from "./planning-engine";
import type { PlanningEngineInput, ExecutionPlan } from "./types";

export class PlanningEngineSubsystem extends BaseSubsystem {
  private planningEngine: PlanningEngine;
  private currentPlan?: ExecutionPlan;

  constructor() {
    super({
      id: "planning-engine",
      name: "Planning & Task Decomposition Engine",
      version: "1.0.0",
      capabilities: ["planning", "task-decomposition", "execution-strategy"],
      dependencies: ["intent-engine", "knowledge-graph", "memory-engine"],
    });

    this.planningEngine = new PlanningEngine();
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
    this.currentPlan = undefined;
    await super.stop();
  }

  /**
   * Handle incoming events
   */
  async onEvent(event: RuntimeEvent): Promise<void> {
    if (event.type === "intent:analysis_complete" || event.type === "intent:analysis") {
      await this.handleIntentAnalysis(event);
    }

    if (event.type === "workspace:updated") {
      // Existing plans may need incremental replanning
      if (this.currentPlan) {
        await this.replan(event);
      }
    }
  }

  /**
   * Handle intent analysis completion
   */
  private async handleIntentAnalysis(event: RuntimeEvent): Promise<void> {
    const payload = event.payload as {
      intentAnalysis?: IntentAnalysisResult;
      [key: string]: unknown;
    };

    if (!payload.intentAnalysis) {
      this.setError(new Error("Planning Engine received event without intent analysis"));
      return;
    }

    try {
      const input: PlanningEngineInput = {
        intentAnalysis: payload.intentAnalysis,
        previousPlan: this.currentPlan,
        userId: event.sessionId,
        workspaceId: event.workspaceId,
      };

      const plan = await this.planningEngine.plan(input);
      this.currentPlan = plan;

      this.emitPlanComplete(plan, event.correlationId);
    } catch (error) {
      this.setError(error);
      this.emitError(error, event.correlationId);
    }
  }

  /**
   * Replan when workspace changes
   */
  private async replan(event: RuntimeEvent): Promise<void> {
    if (!this.currentPlan) return;

    // Replan incrementally only if the current plan is active
    if (this.currentPlan.blockers.some(b => b.severity === "critical")) {
      return;
    }

    // Replanning occurs when workspace changes affect current plan
    const input: PlanningEngineInput = {
      intentAnalysis: this.reconstructIntentAnalysis(this.currentPlan),
      previousPlan: this.currentPlan,
    };

    const plan = await this.planningEngine.plan(input);
    this.currentPlan = plan;

    this.emitPlanComplete(plan, event.correlationId);
  }

  /**
   * Reconstruct a minimal intent analysis from an existing plan
   */
  private reconstructIntentAnalysis(plan: ExecutionPlan): IntentAnalysisResult {
    return {
      analysisId: plan.planId,
      primaryGoal: plan.projectGoal,
      secondaryGoals: [],
      intentTypes: [],
      overallConfidence: "medium",
      requirements: [],
      hiddenRequirements: [],
      constraints: [],
      affectedScope: "multiple_files",
      estimatedAffectedFiles: [],
      affectedFeatures: [],
      architecturalImpact: plan.architectureNotes[0] || "low",
      dependencies: { dependsOn: [], affected: [], chainReactions: [], breakingChanges: [], circularRisks: [] },
      risks: [],
      clarificationNeeded: false,
      clarificationQuestions: [],
      complexity: "medium",
      tokenEstimation: { planning: 0, context: 0, generation: 0, verification: 0, total: plan.tokenBudget.total },
      recommendedContext: plan.contextRequirements,
      recommendedModels: ["reasoning"],
      executionStrategy: plan.executionStrategy,
      planningMetadata: { priority: "medium", prerequisites: [] },
      timestamp: Date.now(),
    };
  }

  /**
   * Emit plan completion event
   */
  private emitPlanComplete(plan: ExecutionPlan, correlationId?: string): void {
    console.log("[Planning Engine] Plan complete:", {
      planId: plan.planId,
      taskCount: plan.tasks.length,
      confidence: plan.planningConfidence,
      blockers: plan.blockers.length,
    });

    // Emit for Context Engine and Task Graph
    for (const task of plan.tasks) {
      const event = {
        type: "task:ready",
        category: "execution" as const,
        priority: task.priority === "critical" ? "critical" as const : "high" as const,
        source: "planning-engine",
        payload: { task, plan },
        correlationId,
        timestamp: Date.now(),
      };
      this.forwardEvent(event);
    }
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
    console.error("[Planning Engine] Error:", error);
  }

  /**
   * Get current plan
   */
  getCurrentPlan(): ExecutionPlan | undefined {
    return this.currentPlan;
  }

  /**
   * Get subsystem metrics
   */
  getMetrics(): Record<string, unknown> {
    return {
      ...super.getMetrics(),
      currentPlanId: this.currentPlan?.planId,
      planHistory: this.planningEngine.getRecentPlans().length,
    };
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): Record<string, unknown> {
    return {
      ...super.getDiagnostics(),
      currentPlan: this.currentPlan ? {
        planId: this.currentPlan.planId,
        taskCount: this.currentPlan.tasks.length,
        parallelGroups: this.currentPlan.parallelGroups.length,
        blockers: this.currentPlan.blockers.length,
        risks: this.currentPlan.risks.length,
      } : null,
    };
  }
}
