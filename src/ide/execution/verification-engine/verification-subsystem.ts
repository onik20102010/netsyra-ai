/**
 * Verification & Self-Correction Engine Subsystem
 * 
 * Wraps the Verification Engine and integrates it with the IDE runtime.
 * Receives generated code artifacts and validates them before patch integration.
 */

import { BaseSubsystem } from "@/ide/kernel/subsystem";
import type { RuntimeEvent } from "@/ide/types";
import type { CodeGenerationResult } from "@/ide/execution/code-generator";
import { GlobalEventBus } from "@/ide/streaming";
import { VerificationEngine } from "./verification-engine";
import type { VerificationRequest, VerificationResult } from "./types";

export class VerificationEngineSubsystem extends BaseSubsystem {
  private verificationEngine: VerificationEngine;
  private recentResults = new Map<string, VerificationResult>();

  constructor() {
    super({
      id: "verification-engine",
      name: "Verification & Self-Correction Engine",
      version: "1.0.0",
      capabilities: ["verification", "self-correction", "quality-gate"],
      dependencies: ["code-generator", "context-engine", "workspace-engine"],
    });

    this.verificationEngine = new VerificationEngine();
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
    if (event.type === "code:generated") {
      await this.handleGeneratedCode(event);
    }
  }

  /**
   * Handle generated code events
   */
  private async handleGeneratedCode(event: RuntimeEvent): Promise<void> {
    const payload = (event.payload as Record<string, unknown>) || {};
    const generationResult = payload.result as CodeGenerationResult | undefined;

    if (!generationResult) {
      this.setError(new Error("Verification Engine received event without generation result"));
      return;
    }

    try {
      const artifacts = VerificationEngine.fromGeneratedFiles(generationResult.files);

      const request: VerificationRequest = {
        id: generationResult.id,
        taskId: generationResult.taskId,
        task: {
          id: generationResult.taskId,
          title: "Verify generated code",
          description: "Verify and repair generated code artifacts",
          category: "verify",
          priority: "high",
          complexity: "medium",
          estimatedDuration: "5 minutes",
          estimatedTokens: 1000,
          dependencies: [],
          requiredContext: {
            files: generationResult.files.map(f => f.path),
            folders: [],
            components: [],
            apis: [],
            modules: [],
            symbols: [],
            reason: "Verification requires generated files",
          },
          expectedOutput: "Verified or repaired artifacts",
          possibleRisks: ["Verification may fail"],
          verification: ["syntax", "type", "security"],
          rollbackStrategy: "Reject generated changes",
          completionCriteria: ["All artifacts verified"],
          status: "pending",
          retryPolicy: {
            maxAttempts: 3,
            backoffMs: 500,
            retryableErrors: ["timeout"],
          },
          canParallelize: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        artifacts,
        subscription: "free",
        complexity: "medium",
        maxRepairAttempts: 3,
        streaming: true,
        sessionId: event.sessionId,
        workspaceId: event.workspaceId,
        correlationId: event.correlationId,
      };

      const result = await this.verificationEngine.verify(request);

      this.recentResults.set(result.id, result);
      this.emitVerificationResult(result, event.correlationId);
    } catch (error) {
      this.setError(error);
      this.emitError(error, event.correlationId);
    }
  }

  /**
   * Emit verification result event
   */
  private emitVerificationResult(result: VerificationResult, correlationId?: string): void {
    const event = {
      type: result.status === "passed" || result.status === "repaired" ? "verification:passed" : "verification:failed",
      category: "verification" as const,
      priority: result.status === "failed" ? "critical" as const : "high" as const,
      source: "verification-engine",
      payload: { result },
      correlationId,
      timestamp: Date.now(),
    };

    console.log(`[Verification Engine] ${result.status}:`, {
      resultId: result.id,
      taskId: result.taskId,
      issueCount: result.issues.length,
      warningCount: result.warnings.length,
      confidence: result.confidenceScore,
    });

    this.forwardEvent(event);
  }

  /**
   * Emit error event
   */
  private emitError(error: unknown, correlationId?: string): void {
    console.error("[Verification Engine] Error:", error);
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
  getRecentResults(): VerificationResult[] {
    return Array.from(this.recentResults.values()).slice(-10);
  }

  /**
   * Get metrics
   */
  getMetrics(): Record<string, unknown> {
    const results = Array.from(this.recentResults.values());
    const passed = results.filter(r => r.status === "passed" || r.status === "repaired").length;

    return {
      ...super.getMetrics(),
      totalVerifications: results.length,
      passRate: results.length > 0 ? passed / results.length : 0,
      averageConfidence: results.length > 0 ? results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length : 0,
      totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
      totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
      verificationHistory: this.verificationEngine.getHistory().length,
    };
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): Record<string, unknown> {
    const recent = this.getRecentResults();
    return {
      ...super.getDiagnostics(),
      recentVerifications: recent.map(r => ({
        id: r.id,
        taskId: r.taskId,
        status: r.status,
        confidence: r.confidenceScore,
        issues: r.issues.length,
        warnings: r.warnings.length,
      })),
    };
  }
}
