import type { RuntimeEvent, EventCategory, EventPriority } from "@/ide/types";
import { createEvent } from "./event";

export interface Batch {
  key: string;
  type: string;
  category: EventCategory;
  source: string;
  priority: EventPriority;
  events: RuntimeEvent[];
}

export interface BatcherOptions {
  maxSize?: number;
  flushIntervalMs?: number;
}

export type BatchFlushHandler = (batch: RuntimeEvent) => void;

export class EventBatcher {
  private batches = new Map<string, Batch>();
  private timers = new Map<string, ReturnType<typeof setTimeout>>();
  private handlers = new Set<BatchFlushHandler>();

  constructor(
    private options: BatcherOptions = {
      maxSize: 50,
      flushIntervalMs: 50,
    }
  ) {}

  add(event: RuntimeEvent): void {
    if (!event.batchKey) return;

    let batch = this.batches.get(event.batchKey);
    if (!batch) {
      batch = {
        key: event.batchKey,
        type: event.type,
        category: event.category,
        source: event.source,
        priority: event.priority,
        events: [],
      };
      this.batches.set(event.batchKey, batch);
    }

    batch.events.push(event);

    if (batch.events.length >= (this.options.maxSize ?? 50)) {
      this.flush(event.batchKey);
      return;
    }

    if (!this.timers.has(event.batchKey)) {
      const timer = setTimeout(() => {
        this.flush(event.batchKey!);
      }, this.options.flushIntervalMs ?? 50);
      this.timers.set(event.batchKey, timer);
    }
  }

  flush(key?: string): RuntimeEvent[] {
    const keys = key ? [key] : Array.from(this.batches.keys());
    const flushed: RuntimeEvent[] = [];

    for (const k of keys) {
      const batch = this.batches.get(k);
      if (!batch || batch.events.length === 0) continue;

      const timer = this.timers.get(k);
      if (timer) {
        clearTimeout(timer);
        this.timers.delete(k);
      }

      const batchEvent = this.toBatchEvent(batch);
      flushed.push(batchEvent);

      for (const handler of this.handlers) {
        try {
          handler(batchEvent);
        } catch {
          // Handlers should not throw. Batcher continues.
        }
      }

      this.batches.delete(k);
    }

    return flushed;
  }

  onFlush(handler: BatchFlushHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  clear(): void {
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.batches.clear();
  }

  private toBatchEvent(batch: Batch): RuntimeEvent {
    return createEvent({
      type: `${batch.type}:batch`,
      source: batch.source,
      category: batch.category,
      priority: batch.priority,
      payload: { events: batch.events.map((e) => ({ ...e })) },
      metadata: { batched: true, batchKey: batch.key, count: batch.events.length },
    });
  }
}
