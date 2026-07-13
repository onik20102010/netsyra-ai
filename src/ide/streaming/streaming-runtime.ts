/**
 * Streaming Runtime
 * 
 * The main orchestration layer for runtime events, streaming, progress,
 * timeline, metrics, and UI state updates.
 */

import { TimelineManager } from "./timeline";
import { StreamingProgressTracker } from "./progress-tracker";
import { MetricsCollector } from "./metrics";
import { CancellationManager } from "./cancellation-manager";
import { SSETransport } from "./transports/sse-transport";
import { WebSocketTransport } from "./transports/websocket-transport";
import { EventBusTransport } from "./transports/eventbus-transport";
import { GlobalEventBus } from "./global-event-bus";
import type { RuntimeEvent } from "@/ide/types";
import type {
  StreamedRuntimeEvent,
  StreamingSession,
  StreamingTransport,
  EventTransport,
  RuntimeTimeline,
  LiveUIState,
  RuntimeStage,
  TokenStreamChunk,
  StreamingRuntimeConfig,
  StreamConsumer,
} from "./types";

export class StreamingRuntime {
  private eventBus = GlobalEventBus.getBus();
  private timelineManager: TimelineManager;
  private progressTracker: StreamingProgressTracker;
  private metricsCollector: MetricsCollector;
  private cancellationManager: CancellationManager;
  private transports = new Map<EventTransport, StreamingTransport>();
  private sessions = new Map<string, StreamingSession>();
  private config: StreamingRuntimeConfig;

  constructor(config?: Partial<StreamingRuntimeConfig>) {
    this.timelineManager = new TimelineManager();
    this.progressTracker = new StreamingProgressTracker();
    this.metricsCollector = new MetricsCollector();
    this.cancellationManager = new CancellationManager();

    this.config = {
      defaultTransport: "eventbus",
      enableTimeline: true,
      enableMetrics: true,
      enableTelemetry: true,
      enableNotifications: true,
      maxTimelineEvents: 1000,
      batchIntervalMs: 50,
      maxConsumersPerSession: 100,
      sessionTimeoutMs: 300000,
      transports: ["eventbus", "sse", "websocket"],
      ...config,
    };

    this.registerTransports();
    this.subscribeToEventBus();
  }

  /**
   * Register streaming transports
   */
  private registerTransports(): void {
    this.transports.set("sse", new SSETransport());
    this.transports.set("websocket", new WebSocketTransport());
    this.transports.set("eventbus", new EventBusTransport());
  }

  /**
   * Subscribe to event bus and route to timeline and transport
   */
  private subscribeToEventBus(): void {
    this.eventBus.subscribe({
      id: "streaming-runtime",
      onEvent: (event: StreamedRuntimeEvent) => {
        this.handleStreamedEvent(event);
      },
    });
  }

  /**
   * Handle a streamed event
   */
  private async handleStreamedEvent(event: StreamedRuntimeEvent): Promise<void> {
    // Update timeline
    if (this.config.enableTimeline) {
      this.timelineManager.appendEvent(event.sessionId, event);
    }

    // Update progress
    if (event.stage) {
      this.progressTracker.completeStage(event.sessionId, event.stage, event.pipelineId);
    }

    // Track metrics
    if (this.config.enableMetrics) {
      this.metricsCollector.trackEvent();
    }

    // Send through active transports
    for (const session of this.sessions.values()) {
      if (session.sessionId === event.sessionId) {
        const transport = this.transports.get(session.transport);
        if (transport) {
          await transport.send(event);
        }
      }
    }
  }

  /**
   * Publish a runtime event
   */
  publish(event: RuntimeEvent, overrides?: Partial<StreamedRuntimeEvent>): StreamedRuntimeEvent {
    const streamedEvent = this.eventBus.publish(event, overrides);
    this.metricsCollector.trackEvent();
    return streamedEvent;
  }

  /**
   * Publish a token stream chunk
   */
  publishToken(sessionId: string, chunk: TokenStreamChunk): void {
    this.metricsCollector.updateThroughputMetrics(1, 0);
    this.eventBus.publishStreamed({
      id: this.generateId(),
      sessionId,
      timestamp: Date.now(),
      subsystem: "streaming-runtime",
      type: "token_stream",
      category: "generation",
      severity: "info",
      progress: this.progressTracker.getProgress(sessionId),
      payload: { chunk },
      metadata: { chunkType: chunk.type },
    });
  }

  /**
   * Publish structured stream data
   */
  publishStructuredData(sessionId: string, data: Record<string, unknown>): void {
    this.eventBus.publishStreamed({
      id: this.generateId(),
      sessionId,
      timestamp: Date.now(),
      subsystem: "streaming-runtime",
      type: "structured_data",
      category: "ui",
      severity: "info",
      progress: this.progressTracker.getProgress(sessionId),
      payload: data,
      metadata: {},
    });
  }

  /**
   * Create a session
   */
  createSession(sessionId: string, transport: EventTransport = this.config.defaultTransport): StreamingSession {
    const session: StreamingSession = {
      id: this.generateId(),
      sessionId,
      transport,
      connected: true,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
    };

    this.sessions.set(session.id, session);
    const transportImpl = this.transports.get(transport);
    if (transportImpl) {
      transportImpl.connect(session);
    }

    return session;
  }

  /**
   * Connect a session with a transport-specific handler
   */
  connectSession(session: StreamingSession, handler?: (event: StreamedRuntimeEvent) => void): void {
    this.sessions.set(session.id, session);

    const transport = this.transports.get(session.transport);
    if (transport) {
      transport.connect(session);
    }

    if (handler && session.transport === "eventbus") {
      const eventBusTransport = this.transports.get("eventbus") as EventBusTransport;
      eventBusTransport.subscribe(session.sessionId, handler);
    }
  }

  /**
   * Disconnect session
   */
  async disconnectSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const transport = this.transports.get(session.transport);
    if (transport) {
      try {
        await transport.disconnect(session);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[Streaming Runtime] Disconnect failed for session ${sessionId}: ${message}`);
      }
    }

    this.sessions.delete(sessionId);
  }

  /**
   * Get current timeline
   */
  getTimeline(sessionId: string, pipelineId?: string): RuntimeTimeline {
    return this.timelineManager.getTimeline(sessionId, pipelineId);
  }

  /**
   * Update stage and progress
   */
  updateStage(sessionId: string, stage: RuntimeStage, pipelineId?: string): void {
    this.progressTracker.startStage(sessionId, stage, pipelineId);
    this.timelineManager.updateStage(sessionId, stage, pipelineId);

    this.eventBus.publishStreamed({
      id: this.generateId(),
      sessionId,
      pipelineId,
      timestamp: Date.now(),
      subsystem: "streaming-runtime",
      type: "stage_update",
      category: "ui",
      severity: "info",
      stage,
      progress: this.progressTracker.getProgress(sessionId, pipelineId),
      currentStage: stage,
      payload: { stage },
      metadata: {},
    });
  }

  /**
   * Complete pipeline
   */
  complete(sessionId: string, pipelineId?: string): void {
    this.timelineManager.complete(sessionId, pipelineId);
    this.progressTracker.completeStage(sessionId, "completed", pipelineId);

    this.eventBus.publishStreamed({
      id: this.generateId(),
      sessionId,
      pipelineId,
      timestamp: Date.now(),
      subsystem: "streaming-runtime",
      type: "complete",
      category: "completion",
      severity: "info",
      stage: "completed",
      progress: 100,
      currentStage: "completed",
      payload: {},
      metadata: {},
    });
  }

  /**
   * Fail pipeline
   */
  fail(sessionId: string, error: string, pipelineId?: string): void {
    this.timelineManager.fail(sessionId, pipelineId);

    this.eventBus.publishStreamed({
      id: this.generateId(),
      sessionId,
      pipelineId,
      timestamp: Date.now(),
      subsystem: "streaming-runtime",
      type: "error",
      category: "error",
      severity: "error",
      stage: "failed",
      progress: this.progressTracker.getProgress(sessionId, pipelineId),
      payload: { error },
      metadata: {},
    });
  }

  /**
   * Cancel pipeline
   */
  cancel(sessionId: string, reason?: string, pipelineId?: string): void {
    this.cancellationManager.cancelSession(sessionId, reason);
    this.timelineManager.cancel(sessionId, pipelineId);

    this.eventBus.publishStreamed({
      id: this.generateId(),
      sessionId,
      pipelineId,
      timestamp: Date.now(),
      subsystem: "streaming-runtime",
      type: "cancel",
      category: "cancellation",
      severity: "warning",
      stage: "cancelled",
      progress: this.progressTracker.getProgress(sessionId, pipelineId),
      payload: { reason },
      metadata: {},
    });
  }

  /**
   * Get live UI state
   */
  getLiveUIState(sessionId: string, pipelineId?: string): LiveUIState {
    const timeline = this.timelineManager.getTimeline(sessionId, pipelineId);
    const progress = this.progressTracker.getProgress(sessionId, pipelineId);
    const events = this.eventBus.getSessionEvents(sessionId);
    const lastEvent = events[events.length - 1];

    const errors = events.filter((e: StreamedRuntimeEvent) => e.severity === "error" || e.severity === "critical").map((e: StreamedRuntimeEvent) => e.type);
    const warnings = events.filter((e: StreamedRuntimeEvent) => e.severity === "warning").map((e: StreamedRuntimeEvent) => e.type);

    return {
      currentStage: timeline.currentStage,
      activeSubsystem: lastEvent?.subsystem || "streaming-runtime",
      progress,
      timeline,
      activeModel: lastEvent?.payload?.modelId as string,
      activeProvider: lastEvent?.payload?.provider as string,
      activeTask: lastEvent?.payload?.taskId as string,
      currentFile: lastEvent?.payload?.path as string,
      filesChanged: timeline.events.filter(e => e.category === "patch").map(e => e.payload?.path as string).filter(Boolean),
      verificationStatus: timeline.events.find(e => e.category === "verification")?.status || "pending",
      patchStatus: timeline.events.find(e => e.category === "patch")?.status || "pending",
      diagnostics: [],
      warnings,
      errors,
      elapsedTime: this.progressTracker.getElapsedTime(sessionId, pipelineId),
      estimatedRemainingTime: progress > 0 ? (progress / 100) * this.progressTracker.getElapsedTime(sessionId, pipelineId) : undefined,
      canCancel: timeline.status === "running",
      canRetry: timeline.status === "failed",
    };
  }

  /**
   * Replay events for a session
   */
  replay(sessionId: string, afterEventId?: string): StreamedRuntimeEvent[] {
    return this.eventBus.replay(sessionId, afterEventId);
  }

  /**
   * Subscribe to events
   */
  subscribe(consumer: StreamConsumer): () => void {
    return this.eventBus.subscribe(consumer);
  }

  /**
   * Get metrics
   */
  getMetrics(): Record<string, unknown> {
    return {
      ...this.metricsCollector.getMetrics(),
      activeSessions: this.sessions.size,
      activeTimelines: this.timelineManager.getAllTimelines().length,
      totalEvents: this.eventBus.getSessionEvents("default").length,
    };
  }

  /**
   * Get transports
   */
  getTransports(): StreamingTransport[] {
    return Array.from(this.transports.values());
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
