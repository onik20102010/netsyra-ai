/**
 * Global Runtime Event Bus
 * 
 * Shared singleton event bus that all subsystems can use to publish
 * runtime events to the streaming engine and other consumers.
 */

import { RuntimeEventBus } from "./runtime-event-bus";
import type { RuntimeEvent } from "@/ide/types";
import type { StreamedRuntimeEvent, StreamConsumer } from "./types";

class GlobalEventBusManager {
  private bus: RuntimeEventBus;
  private static instance: GlobalEventBusManager;

  private constructor() {
    this.bus = new RuntimeEventBus();
  }

  static getInstance(): GlobalEventBusManager {
    if (!GlobalEventBusManager.instance) {
      GlobalEventBusManager.instance = new GlobalEventBusManager();
    }
    return GlobalEventBusManager.instance;
  }

  getBus(): RuntimeEventBus {
    return this.bus;
  }

  publish(event: Partial<RuntimeEvent>, overrides?: Partial<StreamedRuntimeEvent>): StreamedRuntimeEvent {
    return this.bus.publish(event, overrides);
  }

  subscribe(consumer: StreamConsumer): () => void {
    return this.bus.subscribe(consumer);
  }

  replay(sessionId: string, afterEventId?: string): StreamedRuntimeEvent[] {
    return this.bus.replay(sessionId, afterEventId);
  }
}

export const GlobalEventBus = GlobalEventBusManager.getInstance();
