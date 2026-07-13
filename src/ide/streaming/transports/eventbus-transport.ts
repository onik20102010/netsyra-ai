/**
 * Internal Event Bus Transport
 * 
 * Streams runtime events to local consumers via the internal event bus.
 */

import { BaseTransport } from "./base-transport";
import type { StreamedRuntimeEvent, StreamingSession, EventTransport } from "../types";

export class EventBusTransport extends BaseTransport {
  id = "eventbus-transport";
  type: EventTransport = "eventbus";
  private callbacks = new Map<string, Set<(event: StreamedRuntimeEvent) => void>>();
  private sessions = new Set<string>();

  async connect(session: StreamingSession): Promise<void> {
    this.sessions.add(session.id);
    if (!this.callbacks.has(session.id)) {
      this.callbacks.set(session.id, new Set());
    }
  }

  async disconnect(session: StreamingSession): Promise<void> {
    this.sessions.delete(session.id);
    this.callbacks.delete(session.id);
  }

  isConnected(session: StreamingSession): boolean {
    return this.sessions.has(session.id);
  }

  async send(event: StreamedRuntimeEvent): Promise<boolean> {
    for (const sessionId of this.sessions) {
      const callbacks = this.callbacks.get(sessionId);
      if (callbacks) {
        for (const callback of callbacks) {
          try {
            callback(event);
          } catch (error) {
            console.error("[EventBus Transport] Callback error:", error);
          }
        }
      }
    }
    return true;
  }

  /**
   * Subscribe to events for a session
   */
  subscribe(sessionId: string, callback: (event: StreamedRuntimeEvent) => void): () => void {
    const callbacks = this.callbacks.get(sessionId) || new Set();
    callbacks.add(callback);
    this.callbacks.set(sessionId, callbacks);
    return () => callbacks.delete(callback);
  }
}
