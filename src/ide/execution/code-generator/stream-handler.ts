/**
 * Stream Handler
 * 
 * Handles streaming responses from AI providers and emits progress events.
 */

import type { CodeGenerationStreamEvent, CodeGenerationRequest, ProviderStreamChunk } from "./types";

export class StreamHandler {
  private request: CodeGenerationRequest;
  private events: CodeGenerationStreamEvent[] = [];
  private stages: string[] = [
    "understanding_request",
    "collecting_context",
    "selecting_model",
    "generating_code",
    "verifying_output",
    "applying_edits",
    "updating_workspace",
    "completed",
  ];

  constructor(request: CodeGenerationRequest) {
    this.request = request;
  }

  /**
   * Emit a stream event
   */
  emitStage(stage: string, payload: Record<string, unknown> = {}): void {
    const event: CodeGenerationStreamEvent = {
      id: this.generateId(),
      requestId: this.request.id,
      type: "stage",
      stage,
      payload,
      timestamp: Date.now(),
    };

    this.events.push(event);
    this.streamEvent(event);
  }

  /**
   * Emit a content chunk
   */
  emitContentChunk(content: string, payload: Record<string, unknown> = {}): void {
    const event: CodeGenerationStreamEvent = {
      id: this.generateId(),
      requestId: this.request.id,
      type: "content",
      stage: "generating_code",
      payload: { content, ...payload },
      timestamp: Date.now(),
    };

    this.events.push(event);
    this.streamEvent(event);
  }

  /**
   * Emit a token usage event
   */
  emitTokenUsage(promptTokens: number, completionTokens: number, cost: number): void {
    const event: CodeGenerationStreamEvent = {
      id: this.generateId(),
      requestId: this.request.id,
      type: "token_usage",
      stage: "completed",
      payload: {
        promptTokens,
        completionTokens,
        totalTokens: promptTokens + completionTokens,
        cost,
      },
      timestamp: Date.now(),
    };

    this.events.push(event);
    this.streamEvent(event);
  }

  /**
   * Emit an error event
   */
  emitError(error: string, recoverable: boolean): void {
    const event: CodeGenerationStreamEvent = {
      id: this.generateId(),
      requestId: this.request.id,
      type: "error",
      stage: "error",
      payload: { error, recoverable },
      timestamp: Date.now(),
    };

    this.events.push(event);
    this.streamEvent(event);
  }

  /**
   * Process stream chunks from provider
   */
  async *processStream(stream: AsyncIterable<ProviderStreamChunk>): AsyncIterable<CodeGenerationStreamEvent> {
    this.emitStage("generating_code");

    for await (const chunk of stream) {
      if (chunk.content) {
        this.emitContentChunk(chunk.content);
      }

      if (chunk.finishReason) {
        this.emitStage("completed", { finishReason: chunk.finishReason });
      }

      const event = this.events[this.events.length - 1];
      if (event) yield event;
    }
  }

  /**
   * Get all events
   */
  getEvents(): CodeGenerationStreamEvent[] {
    return [...this.events];
  }

  /**
   * Get streaming stages
   */
  getStages(): string[] {
    return [...this.stages];
  }

  /**
   * Stream event to listeners
   */
  private streamEvent(event: CodeGenerationStreamEvent): void {
    // Allow external consumers (e.g. the /ide/api/agent SSE route) to observe progress
    this.request.onStreamEvent?.(event);

    // Integration with streaming engine
    if (event.type === "content") {
      // Don't log every content chunk to avoid noise
    } else {
      console.log(`[Code Generator Stream] ${event.stage}:`, event.payload);
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
