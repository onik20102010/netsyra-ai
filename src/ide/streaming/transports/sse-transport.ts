/**
 * Server-Sent Events (SSE) Transport
 * 
 * Streams runtime events via SSE protocol.
 */

import { BaseTransport } from "./base-transport";
import type { StreamedRuntimeEvent, StreamingSession, EventTransport } from "../types";

export class SSETransport extends BaseTransport {
  id = "sse-transport";
  type: EventTransport = "sse";
  private controllers = new Map<string, ReadableStreamDefaultController<Uint8Array>>();
  private sessions = new Set<string>();

  async connect(session: StreamingSession): Promise<void> {
    this.sessions.add(session.id);
  }

  async disconnect(session: StreamingSession): Promise<void> {
    this.sessions.delete(session.id);
    const controller = this.controllers.get(session.id);
    if (controller) {
      try {
        controller.close();
      } catch {
        // Controller already closed; cleanup is idempotent.
      }
      this.controllers.delete(session.id);
    }
  }

  isConnected(session: StreamingSession): boolean {
    return this.sessions.has(session.id);
  }

  async send(event: StreamedRuntimeEvent): Promise<boolean> {
    const payload = this.encode(event);
    const data = this.encodeSSE(event.type, payload);
    const encoder = new TextEncoder();

    for (const sessionId of this.sessions) {
      const controller = this.controllers.get(sessionId);
      if (controller) {
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          this.sessions.delete(sessionId);
          this.controllers.delete(sessionId);
        }
      }
    }

    return true;
  }

  /**
   * Register a controller for an SSE session
   */
  registerController(sessionId: string, controller: ReadableStreamDefaultController<Uint8Array>): void {
    this.controllers.set(sessionId, controller);
  }
}
