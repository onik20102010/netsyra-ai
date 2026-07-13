/**
 * Base Transport
 * 
 * Abstract base class for streaming transports (SSE, WebSocket, EventBus).
 */

import type { StreamingTransport, StreamedRuntimeEvent, StreamingSession } from "../types";

export abstract class BaseTransport implements StreamingTransport {
  abstract id: string;
  abstract type: import("../types").EventTransport;

  abstract send(event: StreamedRuntimeEvent): Promise<boolean>;
  abstract connect(session: StreamingSession): Promise<void>;
  abstract disconnect(session: StreamingSession): Promise<void>;
  abstract isConnected(session: StreamingSession): boolean;

  /**
   * Encode event for transport
   */
  protected encode(event: StreamedRuntimeEvent): string {
    return JSON.stringify(event);
  }

  /**
   * Format SSE payload
   */
  protected encodeSSE(event: string, data: string): string {
    return `event: ${event}\ndata: ${data}\n\n`;
  }
}
