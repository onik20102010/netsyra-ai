/**
 * Runtime Event Bus
 * 
 * A global event bus that every subsystem uses to communicate.
 * Subsystems publish events, and consumers (including streaming transport) subscribe.
 */

import type { RuntimeEvent } from "@/ide/types";
import type { StreamedRuntimeEvent, StreamConsumer, RuntimeEventCategory, RuntimeStage, RuntimeSeverity } from "./types";

export class RuntimeEventBus {
  private consumers = new Set<StreamConsumer>();
  private eventHistory = new Map<string, StreamedRuntimeEvent[]>();
  private lastEventId = 0;

  /**
   * Register a consumer
   */
  subscribe(consumer: StreamConsumer): () => void {
    this.consumers.add(consumer);
    return () => this.consumers.delete(consumer);
  }

  /**
   * Publish an event to the bus
   */
  publish(event: Partial<RuntimeEvent>, overrides?: Partial<StreamedRuntimeEvent>): StreamedRuntimeEvent {
    const normalizedEvent = this.normalizeEvent(event);
    const streamedEvent = this.toStreamedEvent(normalizedEvent, overrides);
    this.broadcast(streamedEvent);
    this.storeEvent(streamedEvent);
    return streamedEvent;
  }

  /**
   * Publish a custom streamed event
   */
  publishStreamed(event: StreamedRuntimeEvent): StreamedRuntimeEvent {
    this.broadcast(event);
    this.storeEvent(event);
    return event;
  }

  /**
   * Broadcast event to all consumers
   */
  private broadcast(event: StreamedRuntimeEvent): void {
    for (const consumer of this.consumers) {
      try {
        if (!consumer.filter || consumer.filter(event)) {
          consumer.onEvent(event);
        }
      } catch (error) {
        console.error("[Runtime Event Bus] Consumer error:", error);
      }
    }
  }

  /**
   * Store event in history
   */
  private storeEvent(event: StreamedRuntimeEvent): void {
    const sessionEvents = this.eventHistory.get(event.sessionId) || [];
    sessionEvents.push(event);
    this.eventHistory.set(event.sessionId, sessionEvents);
  }

  /**
   * Normalize a partial RuntimeEvent to a full RuntimeEvent
   */
  private normalizeEvent(event: Partial<RuntimeEvent>): RuntimeEvent {
    const now = Date.now();
    this.lastEventId++;

    return {
      id: event.id || `evt-${this.lastEventId}`,
      type: event.type || "unknown",
      category: event.category || "ui",
      priority: event.priority || "normal",
      source: event.source || "unknown",
      target: event.target,
      payload: event.payload || {},
      timestamp: event.timestamp || now,
      correlationId: event.correlationId,
      sessionId: event.sessionId || "default",
      workspaceId: event.workspaceId,
      metadata: event.metadata || {},
      version: event.version || 1,
      status: event.status || "success",
      lifecycle: event.lifecycle || "completed",
      traceId: event.traceId,
      duration: event.duration,
      retryCount: event.retryCount || 0,
      securityContext: event.securityContext,
      batchable: event.batchable,
      batchKey: event.batchKey,
    };
  }

  /**
   * Convert a RuntimeEvent to a StreamedRuntimeEvent
   */
  private toStreamedEvent(event: RuntimeEvent, overrides?: Partial<StreamedRuntimeEvent>): StreamedRuntimeEvent {
    this.lastEventId++;

    const payload = (event.payload as Record<string, unknown>) || {};

    return {
      id: overrides?.id || `evt-${this.lastEventId}`,
      sessionId: event.sessionId || "default",
      conversationId: event.correlationId,
      requestId: event.correlationId,
      pipelineId: event.correlationId,
      correlationId: event.correlationId,
      traceId: event.correlationId,
      timestamp: event.timestamp || Date.now(),
      subsystem: event.source || "unknown",
      type: event.type,
      category: this.mapEventCategory(event.type),
      severity: this.mapSeverity(event.priority),
      stage: this.mapStage(event.type),
      progress: this.inferProgress(event.type),
      currentStage: this.mapStage(event.type),
      payload,
      metadata: {
        priority: event.priority,
        category: event.category,
        ...payload,
      },
      duration: 0,
      ...overrides,
    };
  }

  /**
   * Map event type to category
   */
  private mapEventCategory(type: string): RuntimeEventCategory {
    const prefixes: Record<string, RuntimeEventCategory> = {
      "workspace:": "workspace",
      "plan:": "planning",
      "task:": "task_graph",
      "intent:": "intent",
      "context:": "context",
      "generation:": "generation",
      "code:": "generation",
      "verification:": "verification",
      "integration:": "patch",
      "patch:": "patch",
      "tool:": "provider",
      "file:": "file",
      "diagnostic:": "diagnostics",
      "error:": "error",
      "complete": "completion",
      "cancel": "cancellation",
      "notification:": "notification",
    };

    for (const [prefix, category] of Object.entries(prefixes)) {
      if (type.startsWith(prefix)) return category;
    }

    return "ui";
  }

  /**
   * Map priority to severity
   */
  private mapSeverity(priority?: string): RuntimeSeverity {
    switch (priority) {
      case "critical": return "critical";
      case "high": return "error";
      case "normal": return "info";
      case "low": return "debug";
      default: return "info";
    }
  }

  /**
   * Map event type to stage
   */
  private mapStage(type: string): RuntimeStage | undefined {
    const map: Record<string, RuntimeStage> = {
      "intent:analysis_complete": "understanding_request",
      "plan:complete": "planning",
      "task:ready": "scheduling",
      "context:ready": "building_context",
      "code:generated": "generating_files",
      "verification:passed": "running_verification",
      "verification:failed": "running_verification",
      "integration:completed": "applying_patch",
      "integration:failed": "applying_patch",
      "tool:completed": "calling_model",
      "complete": "completed",
      "cancel": "cancelled",
      "error": "failed",
    };

    return map[type];
  }

  /**
   * Infer progress from event type
   */
  private inferProgress(type: string): number {
    const progressMap: Record<string, number> = {
      "intent:analysis_complete": 5,
      "plan:complete": 15,
      "task:ready": 20,
      "context:ready": 35,
      "tool:completed": 50,
      "code:generated": 65,
      "verification:passed": 85,
      "integration:completed": 100,
      "complete": 100,
    };
    return progressMap[type] || 0;
  }

  /**
   * Get events for a session
   */
  getSessionEvents(sessionId: string, afterEventId?: string): StreamedRuntimeEvent[] {
    const events = this.eventHistory.get(sessionId) || [];
    if (!afterEventId) return events;
    const index = events.findIndex(e => e.id === afterEventId);
    return index === -1 ? events : events.slice(index + 1);
  }

  /**
   * Replay missed events for a session
   */
  replay(sessionId: string, afterEventId?: string): StreamedRuntimeEvent[] {
    return this.getSessionEvents(sessionId, afterEventId);
  }

  /**
   * Clear session history
   */
  clearSession(sessionId: string): void {
    this.eventHistory.delete(sessionId);
  }
}
