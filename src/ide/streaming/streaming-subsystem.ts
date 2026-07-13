/**
 * Live Streaming & Runtime Events Subsystem
 * 
 * Wraps the Streaming Runtime and integrates it with the IDE runtime.
 * Receives events from all subsystems and streams them to the frontend.
 */

import { BaseSubsystem } from "@/ide/kernel/subsystem";
import type { RuntimeEvent } from "@/ide/types";
import { StreamingRuntime } from "./streaming-runtime";
import { SSETransport } from "./transports/sse-transport";
import type { StreamedRuntimeEvent, StreamingSession, StreamConsumer } from "./types";

export class StreamingRuntimeSubsystem extends BaseSubsystem {
  private streamingRuntime: StreamingRuntime;

  constructor() {
    super({
      id: "streaming-engine",
      name: "Live Streaming & Runtime Events",
      version: "1.0.0",
      capabilities: ["streaming", "events", "timeline", "progress", "notifications"],
      dependencies: ["workspace-engine", "ai-router", "code-generator", "verification-engine", "patch-engine"],
    });

    this.streamingRuntime = new StreamingRuntime();
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
    await super.stop();
  }

  /**
   * Handle all runtime events
   */
  onEvent(event: RuntimeEvent): void {
    try {
      // All events flow through the streaming runtime
      this.streamingRuntime.publish(event);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Streaming Engine] Failed to publish event: ${message}`);
    }
  }

  /**
   * Create a streaming session
   */
  createSession(sessionId: string, transport: import("./types").EventTransport): StreamingSession {
    return this.streamingRuntime.createSession(sessionId, transport);
  }

  /**
   * Connect a session with a handler
   */
  connectSession(session: StreamingSession, handler?: (event: StreamedRuntimeEvent) => void): void {
    this.streamingRuntime.connectSession(session, handler);
  }

  /**
   * Disconnect a session
   */
  async disconnectSession(sessionId: string): Promise<void> {
    try {
      await this.streamingRuntime.disconnectSession(sessionId);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[Streaming Engine] Disconnect session failed: ${message}`);
    }
  }

  /**
   * Subscribe to streamed events
   */
  subscribe(consumer: StreamConsumer): () => void {
    return this.streamingRuntime.subscribe(consumer);
  }

  /**
   * Subscribe to SSE stream
   */
  subscribeSSE(): ReadableStream<Uint8Array> {
    const session = this.streamingRuntime.createSession("default", "sse");
    const transport = this.streamingRuntime.getTransports().find(t => t.type === "sse") as SSETransport;

    let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
    const stream = new ReadableStream<Uint8Array>({
      start: (c) => {
        controller = c;
        if (transport) {
          transport.registerController(session.id, controller);
        }
      },
      cancel: async () => {
        try {
          await this.streamingRuntime.disconnectSession(session.id);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error(`[Streaming Engine] SSE cancel failed: ${message}`);
        }
      },
    });

    return stream;
  }

  /**
   * Publish a token stream chunk
   */
  publishToken(sessionId: string, chunk: import("./types").TokenStreamChunk): void {
    this.streamingRuntime.publishToken(sessionId, chunk);
  }

  /**
   * Update runtime stage
   */
  updateStage(sessionId: string, stage: import("./types").RuntimeStage, pipelineId?: string): void {
    this.streamingRuntime.updateStage(sessionId, stage, pipelineId);
  }

  /**
   * Complete pipeline
   */
  complete(sessionId: string, pipelineId?: string): void {
    this.streamingRuntime.complete(sessionId, pipelineId);
  }

  /**
   * Fail pipeline
   */
  fail(sessionId: string, error: string, pipelineId?: string): void {
    this.streamingRuntime.fail(sessionId, error, pipelineId);
  }

  /**
   * Cancel pipeline
   */
  cancel(sessionId: string, reason?: string, pipelineId?: string): void {
    this.streamingRuntime.cancel(sessionId, reason, pipelineId);
  }

  /**
   * Get live UI state
   */
  getLiveUIState(sessionId: string, pipelineId?: string): import("./types").LiveUIState {
    return this.streamingRuntime.getLiveUIState(sessionId, pipelineId);
  }

  /**
   * Replay events
   */
  replay(sessionId: string, afterEventId?: string): StreamedRuntimeEvent[] {
    return this.streamingRuntime.replay(sessionId, afterEventId);
  }

  /**
   * Get metrics
   */
  getMetrics(): Record<string, unknown> {
    return {
      ...super.getMetrics(),
      ...this.streamingRuntime.getMetrics(),
      activeTransports: this.streamingRuntime.getTransports().length,
    };
  }

  /**
   * Get diagnostics
   */
  getDiagnostics(): Record<string, unknown> {
    return {
      ...super.getDiagnostics(),
      streamingRuntime: "running",
      activeSessions: 0,
      activeTimelines: 0,
    };
  }
}
