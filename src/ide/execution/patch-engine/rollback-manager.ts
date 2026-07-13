/**
 * Rollback Manager
 * 
 * Manages checkpoints and rollback operations for patch integration.
 */

import type { WorkspaceSnapshot, RollbackCheckpoint, WorkspaceFile } from "./types";
import { WorkspaceState } from "./workspace-state";

export class RollbackManager {
  private checkpoints = new Map<string, RollbackCheckpoint>();
  private workspaceState: WorkspaceState;

  constructor(workspaceState: WorkspaceState) {
    this.workspaceState = workspaceState;
  }

  /**
   * Create a rollback checkpoint
   */
  createCheckpoint(
    executionId: string,
    taskId: string,
    snapshot: WorkspaceSnapshot,
    patchIds: string[],
    reason: string
  ): RollbackCheckpoint {
    const checkpoint: RollbackCheckpoint = {
      id: this.generateId(),
      executionId,
      taskId,
      timestamp: Date.now(),
      snapshot: { ...snapshot, timestamp: Date.now() },
      patchIds,
      reason,
    };

    this.checkpoints.set(checkpoint.id, checkpoint);
    return checkpoint;
  }

  /**
   * Get checkpoint by ID
   */
  getCheckpoint(checkpointId: string): RollbackCheckpoint | undefined {
    return this.checkpoints.get(checkpointId);
  }

  /**
   * Rollback to a checkpoint
   */
  rollback(checkpointId: string): WorkspaceSnapshot | null {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return null;

    // In production, this would restore files from the snapshot
    return checkpoint.snapshot;
  }

  /**
   * Rollback by execution ID
   */
  rollbackByExecution(executionId: string): WorkspaceSnapshot | null {
    const checkpoints = Array.from(this.checkpoints.values())
      .filter(c => c.executionId === executionId)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (checkpoints.length === 0) return null;
    return this.rollback(checkpoints[0].id);
  }

  /**
   * Rollback by task ID
   */
  rollbackByTask(taskId: string): WorkspaceSnapshot | null {
    const checkpoints = Array.from(this.checkpoints.values())
      .filter(c => c.taskId === taskId)
      .sort((a, b) => b.timestamp - a.timestamp);

    if (checkpoints.length === 0) return null;
    return this.rollback(checkpoints[0].id);
  }

  /**
   * Rollback to last checkpoint
   */
  rollbackLast(): WorkspaceSnapshot | null {
    const checkpoints = Array.from(this.checkpoints.values()).sort((a, b) => b.timestamp - a.timestamp);
    if (checkpoints.length === 0) return null;
    return this.rollback(checkpoints[0].id);
  }

  /**
   * Restore a specific file
   */
  restoreFile(checkpointId: string, path: string): WorkspaceFile | null {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return null;

    return checkpoint.snapshot.files.find(f => f.path === path) || null;
  }

  /**
   * Restore a folder
   */
  restoreFolder(checkpointId: string, path: string): WorkspaceSnapshot {
    const checkpoint = this.checkpoints.get(checkpointId);
    if (!checkpoint) return { version: "", timestamp: 0, files: [], directories: [], hash: "" };

    const files = checkpoint.snapshot.files.filter(f => f.path.startsWith(path));
    return {
      ...checkpoint.snapshot,
      files,
    };
  }

  /**
   * Restore entire workspace
   */
  restoreWorkspace(checkpointId: string): WorkspaceSnapshot | null {
    return this.rollback(checkpointId);
  }

  /**
   * Get all checkpoints
   */
  getAllCheckpoints(): RollbackCheckpoint[] {
    return Array.from(this.checkpoints.values()).sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Clean old checkpoints
   */
  cleanOldCheckpoints(maxAge: number): void {
    const cutoff = Date.now() - maxAge;
    for (const [id, checkpoint] of this.checkpoints.entries()) {
      if (checkpoint.timestamp < cutoff) {
        this.checkpoints.delete(id);
      }
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
