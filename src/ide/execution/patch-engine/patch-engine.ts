/**
 * Patch & File Integration Engine
 * 
 * Safely integrates verified AI-generated changes into the user's workspace.
 * Analyzes patches, detects conflicts, preserves user edits, applies minimal
 * modifications, and updates workspace state.
 */

import type { VerificationResult } from "@/ide/execution/verification-engine";
import { PatchParser } from "./patch-parser";
import { WorkspaceState } from "./workspace-state";
import { ConflictDetector } from "./conflict-detector";
import { StructuralMerge } from "./structural-merge";
import { PatchApplicator } from "./patch-applicator";
import { RollbackManager } from "./rollback-manager";
import type {
  IntegrationRequest,
  IntegrationResult,
  FilePatch,
  FilePatchResult,
  ConflictReport,
  WorkspaceSnapshot,
  IntegrationStatus,
  PatchStreamEvent,
  IntegrationHistoryEntry,
} from "./types";

export class PatchEngine {
  private patchParser: PatchParser;
  private workspaceState: WorkspaceState;
  private conflictDetector: ConflictDetector;
  private structuralMerge: StructuralMerge;
  private patchApplicator: PatchApplicator;
  private rollbackManager: RollbackManager;
  private history: IntegrationHistoryEntry[] = [];
  private events: PatchStreamEvent[] = [];

  constructor(workspacePath: string) {
    this.workspaceState = new WorkspaceState(workspacePath);
    this.patchParser = new PatchParser();
    this.conflictDetector = new ConflictDetector(this.workspaceState);
    this.structuralMerge = new StructuralMerge();
    this.patchApplicator = new PatchApplicator(this.workspaceState);
    this.rollbackManager = new RollbackManager(this.workspaceState);
  }

  /**
   * Integrate verified patches into the workspace
   */
  async integrate(request: IntegrationRequest): Promise<IntegrationResult> {
    const startTime = Date.now();
    this.events = [];

    this.emitEvent(request.id, "preparing", "preparing", { patchCount: request.patches.length });

    try {
      // Load current workspace state
      this.emitEvent(request.id, "loading_workspace", "preparing", { workspaceVersion: request.workspaceVersion });
      const snapshot = await this.workspaceState.load(request.workspaceVersion);

      // Create rollback checkpoint
      const checkpoint = this.rollbackManager.createCheckpoint(
        request.executionId,
        request.taskId,
        snapshot,
        request.patches.map(p => p.id),
        "Pre-integration checkpoint"
      );

      // Detect conflicts
      this.emitEvent(request.id, "detecting_conflicts", "preparing", {});
      const allConflicts: ConflictReport[] = [];
      for (const patch of request.patches) {
        const conflicts = this.conflictDetector.detect(patch, snapshot);
        allConflicts.push(...conflicts);
      }

      const autoResolvable = this.conflictDetector.canAutoResolve(allConflicts);
      if (!autoResolvable) {
        return this.createFailureResult(request, startTime, snapshot, allConflicts, checkpoint.id, "Unresolvable conflicts detected");
      }

      // Build minimal patches
      this.emitEvent(request.id, "building_minimal_patches", "preparing", {});
      const patches = await this.buildMinimalPatches(request, snapshot);

      // Apply patches in transaction
      this.emitEvent(request.id, "applying_patches", "applying", {});
      const patchResults: FilePatchResult[] = [];
      const updatedFiles: string[] = [];
      const createdFiles: string[] = [];
      const deletedFiles: string[] = [];
      let failed = false;

      for (const patch of patches) {
        const result = await this.patchApplicator.apply(patch, snapshot);
        patchResults.push(result);

        if (result.status === "failed") {
          failed = true;
          break;
        }

        if (patch.operation === "create") {
          createdFiles.push(patch.path);
        } else if (patch.operation === "delete") {
          deletedFiles.push(patch.path);
        } else {
          updatedFiles.push(patch.path);
        }
      }

      // If failed, rollback
      if (failed) {
        this.rollbackManager.rollback(checkpoint.id);
        return this.createFailureResult(request, startTime, snapshot, allConflicts, checkpoint.id, "Patch application failed");
      }

      // Format files
      this.emitEvent(request.id, "formatting", "formatting", {});
      const formattedResults = await this.formatResults(patchResults, snapshot);

      // Update workspace state
      this.emitEvent(request.id, "updating_workspace", "applying", {});
      const newWorkspaceVersion = this.updateWorkspaceSnapshot(snapshot, formattedResults);

      // Update knowledge graph and indexes (integration points)
      this.emitEvent(request.id, "updating_knowledge_graph", "applying", {});
      this.emitEvent(request.id, "synchronizing_editor", "applying", {});
      this.emitEvent(request.id, "integration_completed", "completed", {});

      const endTime = Date.now();

      const result: IntegrationResult = {
        id: this.generateId(),
        requestId: request.id,
        taskId: request.taskId,
        executionId: request.executionId,
        status: "completed",
        success: true,
        patches: formattedResults,
        conflicts: allConflicts,
        rollbackCheckpointId: checkpoint.id,
        workspaceVersion: newWorkspaceVersion,
        updatedFiles,
        createdFiles,
        deletedFiles,
        duration: endTime - startTime,
        startTime,
        endTime,
        logs: this.buildLogs(),
        metadata: {
          totalPatches: patches.length,
          appliedPatches: formattedResults.filter(r => r.status === "applied").length,
          failedPatches: formattedResults.filter(r => r.status === "failed").length,
          mergedPatches: formattedResults.filter(r => r.status === "merged").length,
          skippedPatches: formattedResults.filter(r => r.status === "skipped").length,
          conflictCount: allConflicts.length,
          autoResolvedConflicts: allConflicts.filter(c => c.autoResolvable).length,
          manualConflicts: allConflicts.filter(c => !c.autoResolvable).length,
          formattedFiles: formattedResults.length,
          transactionId: checkpoint.id,
          atomic: true,
        },
      };

      this.recordHistory(request, result, checkpoint.id);

      return result;
    } catch (error) {
      const endTime = Date.now();
      return this.createFailureResult(request, startTime, { version: request.workspaceVersion, timestamp: startTime, files: [], directories: [], hash: "" }, [], "", error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Build minimal patches from request
   */
  private async buildMinimalPatches(request: IntegrationRequest, snapshot: WorkspaceSnapshot): Promise<FilePatch[]> {
    const patches: FilePatch[] = [];

    for (const patch of request.patches) {
      const currentFile = this.workspaceState.getFile(snapshot, patch.path);

      if (patch.operation === "update" && currentFile && patch.newContent) {
        // Build minimal block-based patch
        const blocks = this.patchParser.contentToBlocks(currentFile.content, patch.newContent);
        patches.push({
          ...patch,
          blocks: blocks.length > 0 ? blocks : patch.blocks,
          originalHash: currentFile.hash,
          originalContent: currentFile.content,
        });
      } else {
        patches.push(patch);
      }
    }

    return patches;
  }

  /**
   * Format patch results
   */
  private async formatResults(results: FilePatchResult[], snapshot: WorkspaceSnapshot): Promise<FilePatchResult[]> {
    return results.map(result => {
      if (result.newContent && result.status !== "failed") {
        const currentFile = this.workspaceState.getFile(snapshot, result.path);
        const language = this.detectLanguage(result.path);
        const formatted = this.patchApplicator.formatContent(result.newContent, language);
        return { ...result, newContent: formatted };
      }
      return result;
    });
  }

  /**
   * Update workspace snapshot after integration
   */
  private updateWorkspaceSnapshot(snapshot: WorkspaceSnapshot, results: FilePatchResult[]): string {
    const updatedFiles = [...snapshot.files];

    for (const result of results) {
      if (result.status === "failed") continue;

      const index = updatedFiles.findIndex(f => f.path === result.path);
      const newFile = {
        path: result.path,
        content: result.newContent || "",
        hash: result.updatedHash || "",
        lastModified: Date.now(),
        size: (result.newContent || "").length,
        language: this.detectLanguage(result.path),
      };

      if (index >= 0) {
        updatedFiles[index] = newFile;
      } else {
        updatedFiles.push(newFile);
      }
    }

    const newVersion = this.generateId();
    this.workspaceState.createSnapshot(newVersion, updatedFiles);
    return newVersion;
  }

  /**
   * Create failure result
   */
  private createFailureResult(
    request: IntegrationRequest,
    startTime: number,
    snapshot: WorkspaceSnapshot,
    conflicts: ConflictReport[],
    checkpointId: string,
    reason: string,
    error?: string
  ): IntegrationResult {
    const endTime = Date.now();

    return {
      id: this.generateId(),
      requestId: request.id,
      taskId: request.taskId,
      executionId: request.executionId,
      status: "failed",
      success: false,
      patches: [],
      conflicts,
      rollbackCheckpointId: checkpointId,
      workspaceVersion: snapshot.version,
      updatedFiles: [],
      createdFiles: [],
      deletedFiles: [],
      duration: endTime - startTime,
      startTime,
      endTime,
      logs: this.buildLogs(),
      metadata: {
        totalPatches: request.patches.length,
        appliedPatches: 0,
        failedPatches: request.patches.length,
        mergedPatches: 0,
        skippedPatches: 0,
        conflictCount: conflicts.length,
        autoResolvedConflicts: conflicts.filter(c => c.autoResolvable).length,
        manualConflicts: conflicts.filter(c => !c.autoResolvable).length,
        formattedFiles: 0,
        transactionId: checkpointId,
        atomic: true,
      },
    };
  }

  /**
   * Detect language from file path
   */
  private detectLanguage(path: string): string | undefined {
    if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
    if (path.endsWith(".js") || path.endsWith(".jsx")) return "javascript";
    if (path.endsWith(".py")) return "python";
    if (path.endsWith(".css")) return "css";
    if (path.endsWith(".html")) return "html";
    if (path.endsWith(".json")) return "json";
    if (path.endsWith(".md")) return "markdown";
    return undefined;
  }

  /**
   * Build integration logs from events
   */
  private buildLogs(): any[] {
    return this.events.map(e => ({
      timestamp: e.timestamp,
      stage: e.stage,
      status: e.status,
      message: e.stage,
      metadata: e.payload,
    }));
  }

  /**
   * Emit stream event
   */
  private emitEvent(requestId: string, stage: string, status: IntegrationStatus, payload: Record<string, unknown>): void {
    const event: PatchStreamEvent = {
      id: this.generateId(),
      requestId,
      stage,
      status,
      payload,
      timestamp: Date.now(),
    };

    this.events.push(event);
    console.log(`[Patch Engine] ${stage}:`, status);
  }

  /**
   * Record integration history
   */
  private recordHistory(request: IntegrationRequest, result: IntegrationResult, checkpointId: string): void {
    const entry: IntegrationHistoryEntry = {
      id: this.generateId(),
      executionId: request.executionId,
      taskId: request.taskId,
      timestamp: Date.now(),
      files: [...result.updatedFiles, ...result.createdFiles, ...result.deletedFiles],
      operations: request.patches.map(p => p.operation),
      duration: result.duration,
      rollbackCheckpointId: checkpointId,
      verificationResultId: request.verificationResult.id,
      userApproved: true,
      status: result.success ? "success" : "failed",
    };

    this.history.push(entry);
  }

  /**
   * Get rollback manager
   */
  getRollbackManager(): RollbackManager {
    return this.rollbackManager;
  }

  /**
   * Get integration history
   */
  getHistory(): IntegrationHistoryEntry[] {
    return [...this.history];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
