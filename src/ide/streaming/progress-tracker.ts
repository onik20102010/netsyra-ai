/**
 * Progress Tracker
 * 
 * Calculates and tracks runtime progress across all stages.
 */

import type { RuntimeStage, ProgressTracker } from "./types";

export class StreamingProgressTracker {
  private stageProgress: Record<RuntimeStage, number> = {
    waiting: 0,
    starting: 2,
    understanding_request: 5,
    analyzing_workspace: 10,
    loading_memory: 12,
    building_context: 15,
    planning: 25,
    scheduling: 30,
    selecting_model: 35,
    calling_model: 40,
    receiving_tokens: 50,
    generating_files: 60,
    running_verification: 75,
    running_self_correction: 80,
    preparing_patch: 85,
    applying_patch: 90,
    updating_workspace: 95,
    refreshing_context: 98,
    completed: 100,
    cancelled: 0,
    failed: 0,
  };

  private trackers = new Map<string, ProgressTracker>();

  /**
   * Start a stage
   */
  startStage(sessionId: string, stage: RuntimeStage, pipelineId?: string): ProgressTracker {
    const key = this.key(sessionId, pipelineId);
    const tracker: ProgressTracker = {
      stage,
      percentage: this.stageProgress[stage],
      startedAt: Date.now(),
    };
    this.trackers.set(key, tracker);
    return tracker;
  }

  /**
   * Complete a stage
   */
  completeStage(sessionId: string, stage: RuntimeStage, pipelineId?: string): ProgressTracker {
    const key = this.key(sessionId, pipelineId);
    const tracker = this.trackers.get(key) || this.startStage(sessionId, stage, pipelineId);
    tracker.completedAt = Date.now();
    tracker.percentage = this.stageProgress[stage];
    tracker.estimatedRemaining = this.estimateRemaining(stage);
    this.trackers.set(key, tracker);
    return tracker;
  }

  /**
   * Get current progress
   */
  getProgress(sessionId: string, pipelineId?: string): number {
    const key = this.key(sessionId, pipelineId);
    const tracker = this.trackers.get(key);
    return tracker ? tracker.percentage : 0;
  }

  /**
   * Get current stage
   */
  getStage(sessionId: string, pipelineId?: string): RuntimeStage | undefined {
    const key = this.key(sessionId, pipelineId);
    return this.trackers.get(key)?.stage;
  }

  /**
   * Estimate remaining time
   */
  private estimateRemaining(stage: RuntimeStage): number | undefined {
    const estimates: Record<RuntimeStage, number> = {
      waiting: 0,
      starting: 1,
      understanding_request: 1,
      analyzing_workspace: 3,
      loading_memory: 1,
      building_context: 2,
      planning: 5,
      scheduling: 1,
      selecting_model: 2,
      calling_model: 10,
      receiving_tokens: 15,
      generating_files: 20,
      running_verification: 10,
      running_self_correction: 15,
      preparing_patch: 5,
      applying_patch: 5,
      updating_workspace: 3,
      refreshing_context: 2,
      completed: 0,
      cancelled: 0,
      failed: 0,
    };
    return estimates[stage];
  }

  /**
   * Calculate elapsed time
   */
  getElapsedTime(sessionId: string, pipelineId?: string): number {
    const key = this.key(sessionId, pipelineId);
    const tracker = this.trackers.get(key);
    if (!tracker) return 0;
    const end = tracker.completedAt || Date.now();
    return end - tracker.startedAt;
  }

  private key(sessionId: string, pipelineId?: string): string {
    return `${sessionId}:${pipelineId || "default"}`;
  }
}
