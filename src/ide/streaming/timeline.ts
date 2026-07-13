/**
 * Runtime Timeline
 * 
 * Maintains a chronological list of runtime events for a session.
 */

import type { RuntimeTimeline, StreamedRuntimeEvent, RuntimeStage, RuntimeSeverity } from "./types";

export class TimelineManager {
  private timelines = new Map<string, RuntimeTimeline>();
  private maxEvents = 1000;

  /**
   * Create or get a timeline
   */
  getTimeline(sessionId: string, pipelineId?: string): RuntimeTimeline {
    const key = `${sessionId}:${pipelineId || "default"}`;

    if (!this.timelines.has(key)) {
      this.timelines.set(key, {
        id: this.generateId(),
        sessionId,
        pipelineId: pipelineId || "default",
        startTime: Date.now(),
        events: [],
        currentStage: "waiting",
        progress: 0,
        status: "running",
      });
    }

    return this.timelines.get(key)!;
  }

  /**
   * Append event to timeline
   */
  appendEvent(sessionId: string, event: StreamedRuntimeEvent): RuntimeTimeline {
    const timeline = this.getTimeline(sessionId, event.pipelineId);
    timeline.events.push(event);

    if (event.stage) {
      timeline.currentStage = event.stage;
    }

    if (event.progress > timeline.progress) {
      timeline.progress = event.progress;
    }

    if (event.stage === "completed" || event.stage === "failed" || event.stage === "cancelled") {
      timeline.status = event.stage === "completed" ? "completed" : event.stage === "failed" ? "failed" : "cancelled";
      timeline.endTime = Date.now();
    }

    // Trim history if too large
    if (timeline.events.length > this.maxEvents) {
      timeline.events = timeline.events.slice(-this.maxEvents);
    }

    return timeline;
  }

  /**
   * Get timeline events
   */
  getEvents(sessionId: string, pipelineId?: string): StreamedRuntimeEvent[] {
    return this.getTimeline(sessionId, pipelineId).events;
  }

  /**
   * Update progress
   */
  updateProgress(sessionId: string, progress: number, pipelineId?: string): RuntimeTimeline {
    const timeline = this.getTimeline(sessionId, pipelineId);
    timeline.progress = Math.min(100, Math.max(0, progress));
    return timeline;
  }

  /**
   * Update stage
   */
  updateStage(sessionId: string, stage: RuntimeStage, pipelineId?: string): RuntimeTimeline {
    const timeline = this.getTimeline(sessionId, pipelineId);
    timeline.currentStage = stage;
    return timeline;
  }

  /**
   * Complete timeline
   */
  complete(sessionId: string, pipelineId?: string): RuntimeTimeline {
    const timeline = this.getTimeline(sessionId, pipelineId);
    timeline.status = "completed";
    timeline.progress = 100;
    timeline.endTime = Date.now();
    return timeline;
  }

  /**
   * Fail timeline
   */
  fail(sessionId: string, pipelineId?: string): RuntimeTimeline {
    const timeline = this.getTimeline(sessionId, pipelineId);
    timeline.status = "failed";
    timeline.endTime = Date.now();
    return timeline;
  }

  /**
   * Cancel timeline
   */
  cancel(sessionId: string, pipelineId?: string): RuntimeTimeline {
    const timeline = this.getTimeline(sessionId, pipelineId);
    timeline.status = "cancelled";
    timeline.endTime = Date.now();
    return timeline;
  }

  /**
   * Get all timelines
   */
  getAllTimelines(): RuntimeTimeline[] {
    return Array.from(this.timelines.values());
  }

  /**
   * Clear timeline history
   */
  clearTimeline(sessionId: string, pipelineId?: string): void {
    const key = `${sessionId}:${pipelineId || "default"}`;
    this.timelines.delete(key);
  }

  /**
   * Filter events by severity
   */
  filterEventsBySeverity(sessionId: string, severity: RuntimeSeverity, pipelineId?: string): StreamedRuntimeEvent[] {
    return this.getEvents(sessionId, pipelineId).filter(e => e.severity === severity);
  }

  /**
   * Filter events by category
   */
  filterEventsByCategory(sessionId: string, category: string, pipelineId?: string): StreamedRuntimeEvent[] {
    return this.getEvents(sessionId, pipelineId).filter(e => e.category === category);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
