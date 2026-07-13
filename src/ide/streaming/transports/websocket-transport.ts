/**
 * WebSocket Transport
 * 
 * Streams runtime events via WebSocket protocol.
 */

import { BaseTransport } from "./base-transport";
import type { StreamedRuntimeEvent, StreamingSession, EventTransport } from "../types";

export class WebSocketTransport extends BaseTransport {
  id = "websocket-transport";
  type: EventTransport = "websocket";
  private sockets = new Map<string, WebSocket>();

  async connect(session: StreamingSession): Promise<void> {
    // In production, WebSocket would be provided by the server
    // This is a stub for the transport layer
  }

  async disconnect(session: StreamingSession): Promise<void> {
    const socket = this.sockets.get(session.id);
    if (socket) {
      socket.close();
      this.sockets.delete(session.id);
    }
  }

  isConnected(session: StreamingSession): boolean {
    const socket = this.sockets.get(session.id);
    return socket?.readyState === WebSocket.OPEN;
  }

  async send(event: StreamedRuntimeEvent): Promise<boolean> {
    const payload = this.encode(event);

    for (const [sessionId, socket] of this.sockets.entries()) {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(payload);
        } catch {
          this.sockets.delete(sessionId);
        }
      }
    }

    return true;
  }

  /**
   * Register a WebSocket for a session
   */
  registerSocket(sessionId: string, socket: WebSocket): void {
    this.sockets.set(sessionId, socket);
  }
}
