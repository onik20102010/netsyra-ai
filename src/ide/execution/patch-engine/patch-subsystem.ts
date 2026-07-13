/**
 * Patch & File Integration Engine Subsystem
 * 
 * Wraps the Patch Engine and integrates it with the IDE runtime.
 * Receives verified artifacts and applies them to the workspace.
 */

import { BaseSubsystem } from "@/ide/kernel/subsystem";
import type { RuntimeEvent } from "@/ide/types";
import type { VerificationResult } from "@/ide/execution/verification-engine";
import { VerificationEngine } from "@/ide/execution/verification-engine";
import { GlobalEventBus } from "@/ide/streaming";
import { PatchEngine } from "./patch-engine";
import { PatchParser } from "./patch-parser";
import type { IntegrationRequest, IntegrationResult, FilePatch } from "./types";

export class PatchEngineSubsystem extends BaseSubsystem {
  private patchEngine: PatchEngine;
  private recentResults = new Map<string, IntegrationResult>();

  constructor() {
    super({
      id: "patch-engine",
      name: "Patch & File Integration Engine",
      version: "1.0.0",
      capabilities: ["patch-integration", "file-integration", "rollback", "workspace-sync"],
      dependencies: ["verification-engine", "workspace-engine", "knowledge-graph"],
    });

    this.patchEngine = new PatchEngine(process.cwd());
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
    if (event.type === "verification:passed" || event.type === "verification:repaired") {
      await this.handleVerifiedEvent(event);
    }

    if (event.type === "rollback:request") {
      await this.handleRollbackRequest(event);
    }
  }

  /**
   * Handle verified artifacts
   */
  private async handleVerifiedEvent(event: RuntimeEvent): Promise<void> {
    const payload = (event.payload as Record<string, unknown>) || {};
    const verificationResult = payload.result as VerificationResult | undefined;

    if (!verificationResult) {
      this.setError(new Error("Patch Engine received event without verification result"));
      return;
    }

    try {
      const patches = this.buildPatchesFromVerification(verificationResult);
      const request = this.buildIntegrationRequest(event, verificationResult, patches);
      const result = await this.patchEngine.integrate(request);

      this.recentResults.set(result.id, result);
      this.emitIntegrationResult(result, event.correlationId);
    } catch (error) {
      this.setError(error);
      this.emitError(error, event.correlationId);
    }
  }

  /**
   * Handle rollback requests
   */
  private async handleRollbackRequest(event: RuntimeEvent): Promise<void> {
    const payload = (event.payload as Record<string, unknown>) || {};
    const checkpointId = payload.checkpointId as string | undefined;

    if (checkpointId) {
      this.patchEngine.getRollbackManager().rollback(checkpointId);
      this.emitRollbackEvent(checkpointId, event.correlationId);
    }
  }

  /**
   * Build patches from verification result
   */
  private buildPatchesFromVerification(verificationResult: VerificationResult): FilePatch[] {
    const parser = new PatchParser();
    const patches: FilePatch[] = [];

    for (const artifact of verificationResult.artifacts) {
      const operation = this.mapArtifactTypeToOperation(artifact.type);
      const patch = parser.parseFromGenerated(
        artifact.content || artifact.patch || "",
        artifact.path || "generated-file",
        operation,
        verificationResult.requestId,
        verificationResult.taskId,
        artifact.metadata?.reasoning as string || "Verified change"
      );
      patches.push(patch);
    }

    return patches;
  }

  /**
   * Map artifact type to patch operation
   */
  private mapArtifactTypeToOperation(type: string): FilePatch["operation"] {
    const map: Record<string, FilePatch["operation"]> = {
      file: "update",
      patch: "update",
      command: "update",
      config: "update_config",
      migration: "update",
      dependency: "update_dependencies",
      unknown: "update",
    };
    return map[type] || "update";
  }

  /**
   * Build integration request
   */
  private buildIntegrationRequest(
    event: RuntimeEvent,
    verificationResult: VerificationResult,
    patches: FilePatch[]
  ): IntegrationRequest {
    return {
      id: this.generateId(),
      taskId: verificationResult.taskId,
      executionId: verificationResult.requestId,
      verificationResult,
      patches,
      workspacePath: process.cwd(),
      workspaceVersion: "1.0.0",
      sessionId: event.sessionId,
      workspaceId: event.workspaceId,
      correlationId: event.correlationId,
      streaming: true,
    };
  }

  /**
   * Emit integration result event
   */
  private emitIntegrationResult(result: IntegrationResult, correlationId?: string): void {
    const event = {
      type: result.success ? "integration:completed" : "integration:failed",
      category: "integration" as const,
      priority: result.success ? "high" as const : "critical" as const,
      source: "patch-engine",
      payload: { result },
      correlationId,
      timestamp: Date.now(),
    };

    console.log(`[Patch Engine] ${result.success ? "Integrated" : "Failed"}:`, {
      resultId: result.id,
      taskId: result.taskId,
      updatedFiles: result.updatedFiles.length,
      createdFiles: result.createdFiles.length,
      conflicts: result.conflicts.length,
    });

    this.forwardEvent(event);
  }

  /**
   * Emit rollback event
   */
  private emitRollbackEvent(checkpointId: string, correlationId?: string): void {
    const event = {
      type: "integration:rolled_back",
      category: "integration" as const,
      priority: "high" as const,
      source: "patch-engine",
      payload: { checkpointId },
      correlationId,
      timestamp: Date.now(),
    };

    console.log("[Patch Engine] Rolled back:", checkpointId);
    this.forwardEvent(event);
  }

  /**
   * Emit error event
   */
  private emitError(error: unknown, correlationId?: string): void {
    console.error("[Patch Engine] Error:", error);
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
  getRecentResults(): IntegrationResult[] {
    return Array.from(this.recentResults.values()).slice(-10);
  }

  /**
   * Get metrics
   */
  getMetrics(): Record<string, unknown> {
    const results = Array.from(this.recentResults.values());
    const successCount = results.filter(r => r.success).length;

    return {
      ...super.getMetrics(),
      totalIntegrations: results.length,
      successRate: results.length > 0 ? successCount / results.length : 0,
      totalFilesModified: results.reduce((sum, r) => sum + r.updatedFiles.length + r.createdFiles.length + r.deletedFiles.length, 0),
      averageDuration: results.length > 0 ? results.reduce((sum, r) => sum + r.duration, 0) / results.length : 0,
      rollbackHistory: this.patchEngine.getRollbackManager().getAllCheckpoints().length,
    };
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): Record<string, unknown> {
    const recent = this.getRecentResults();
    return {
      ...super.getDiagnostics(),
      recentIntegrations: recent.map(r => ({
        id: r.id,
        taskId: r.taskId,
        success: r.success,
        status: r.status,
        files: r.updatedFiles.length + r.createdFiles.length + r.deletedFiles.length,
      })),
      rollbackCheckpoints: this.patchEngine.getRollbackManager().getAllCheckpoints().length,
      integrationHistory: this.patchEngine.getHistory().length,
    };
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
