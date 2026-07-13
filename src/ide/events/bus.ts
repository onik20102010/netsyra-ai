import type { RuntimeEvent, EventCategory, EventPriority } from "@/ide/types";
import type { EventHandler } from "@/ide/kernel/types";
import { PriorityQueue } from "./priority-queue";
import { createEvent, updateLifecycle, updateStatus, compareEventPriority } from "./event";
import { Subscription, type SubscriptionOptions } from "./subscription";
import { EventValidator } from "./validator";
import { EventBatcher } from "./batcher";
import type { EventInit } from "./event";

export interface EventBusOptions {
  maxHistory?: number;
  batchMaxSize?: number;
  batchFlushMs?: number;
}

export interface EventBusMetrics {
  published: number;
  processed: number;
  dropped: number;
  failed: number;
  retried: number;
  activeSubscriptions: number;
  queueLength: number;
  historySize: number;
  averageLatencyMs: number;
  startTime: number;
  [key: string]: unknown;
}

export class EventBus {
  private queue: PriorityQueue<RuntimeEvent>;
  private subscriptions = new Map<string, Subscription>();
  private wildcardHandlers = new Set<EventHandler>();
  private history: RuntimeEvent[] = [];
  private validator: EventValidator;
  private batcher: EventBatcher;
  private metrics: EventBusMetrics;
  private processing = false;
  private processPromise: Promise<void> | null = null;
  private latencySamples: number[] = [];

  constructor(private options: EventBusOptions = {}) {
    this.queue = new PriorityQueue<RuntimeEvent>(compareEventPriority);
    this.validator = new EventValidator();
    this.batcher = new EventBatcher({
      maxSize: options.batchMaxSize ?? 50,
      flushIntervalMs: options.batchFlushMs ?? 50,
    });
    this.metrics = {
      published: 0,
      processed: 0,
      dropped: 0,
      failed: 0,
      retried: 0,
      activeSubscriptions: 0,
      queueLength: 0,
      historySize: 0,
      averageLatencyMs: 0,
      startTime: Date.now(),
    };

    this.batcher.onFlush((batchedEvent) => {
      this.publish(batchedEvent);
    });
  }

  publish(event: RuntimeEvent): Promise<void> {
    updateLifecycle(event, "queued");
    this.queue.push(event);
    this.metrics.published += 1;
    this.metrics.queueLength = this.queue.size();
    return this.process();
  }

  createEvent(init: EventInit): RuntimeEvent {
    return createEvent(init);
  }

  subscribe(type: string, handler: EventHandler): () => void;
  subscribe(options: SubscriptionOptions): () => void;
  subscribe(
    typeOrOptions: string | SubscriptionOptions,
    handler?: EventHandler
  ): () => void {
    if (typeof typeOrOptions === "string") {
      if (!handler) throw new Error("Handler is required when subscribing by type.");
      const subscription = new Subscription({
        types: [typeOrOptions],
        handler,
      });
      return this.addSubscription(subscription);
    }

    const subscription = new Subscription(typeOrOptions);
    return this.addSubscription(subscription);
  }

  subscribeAll(handler: EventHandler): () => void {
    this.wildcardHandlers.add(handler);
    this.updateSubscriptionMetrics();
    return () => {
      this.wildcardHandlers.delete(handler);
      this.updateSubscriptionMetrics();
    };
  }

  unsubscribe(id: string): void {
    this.subscriptions.delete(id);
    this.updateSubscriptionMetrics();
  }

  async replay(filter: (event: RuntimeEvent) => boolean, handler: EventHandler): Promise<void> {
    for (const event of this.history) {
      if (filter(event)) {
        await this.safeInvoke(handler, event);
      }
    }
  }

  getHistory(limit?: number): RuntimeEvent[] {
    if (!limit || limit >= this.history.length) return [...this.history];
    return this.history.slice(-limit);
  }

  getMetrics(): EventBusMetrics {
    this.metrics.queueLength = this.queue.size();
    this.metrics.historySize = this.history.length;
    this.metrics.activeSubscriptions = this.subscriptions.size + this.wildcardHandlers.size;
    this.metrics.averageLatencyMs = this.computeAverageLatency();
    return { ...this.metrics };
  }

  getSubscriptions(): Subscription[] {
    return Array.from(this.subscriptions.values());
  }

  getQueueLength(): number {
    return this.queue.size();
  }

  private addSubscription(subscription: Subscription): () => void {
    this.subscriptions.set(subscription.id, subscription);
    this.updateSubscriptionMetrics();
    return () => {
      this.subscriptions.delete(subscription.id);
      this.updateSubscriptionMetrics();
    };
  }

  private process(): Promise<void> {
    if (this.processPromise) return this.processPromise;

    this.processPromise = new Promise((resolve) => {
      const run = () => {
        this.processing = true;

        while (this.queue.size() > 0) {
          const event = this.queue.pop();
          if (!event) continue;
          this.processSingle(event);
        }

        this.batcher.flush();
        this.processing = false;
        this.processPromise = null;
        resolve();
      };

      // Defer to next tick to allow batching and synchronous publishes to settle.
      setTimeout(run, 0);
    });

    return this.processPromise;
  }

  private processSingle(event: RuntimeEvent): void {
    const start = Date.now();
    updateLifecycle(event, "validated");

    const validation = this.validator.validate(event);
    if (!validation.valid) {
      updateLifecycle(event, "failed");
      updateStatus(event, "failure");
      this.metrics.dropped += 1;
      this.recordLatency(start);
      return;
    }

    if (event.batchable && event.batchKey) {
      this.batcher.add(event);
      updateLifecycle(event, "completed");
      updateStatus(event, "success");
      this.metrics.processed += 1;
      this.recordLatency(start);
      this.archive(event);
      return;
    }

    updateLifecycle(event, "dispatched");
    this.dispatch(event);
    updateLifecycle(event, "completed");
    this.metrics.processed += 1;
    this.recordLatency(start);
    this.archive(event);
  }

  private dispatch(event: RuntimeEvent): void {
    const promises: Promise<void>[] = [];
    let anyFailed = false;

    for (const subscription of this.subscriptions.values()) {
      if (subscription.matches(event)) {
        updateLifecycle(event, "processing");
        const result = this.safeInvoke(subscription.handler, event);
        if (result instanceof Promise) {
          promises.push(
            result.catch(() => {
              anyFailed = true;
            })
          );
        }
      }
    }

    for (const handler of this.wildcardHandlers) {
      const result = this.safeInvoke(handler, event);
      if (result instanceof Promise) {
        promises.push(
          result.catch(() => {
            anyFailed = true;
          })
        );
      }
    }

    if (anyFailed) {
      updateStatus(event, "failure");
      this.metrics.failed += 1;
    } else {
      updateStatus(event, "success");
    }

    // Async handlers are allowed to complete in the background.
    if (promises.length > 0) {
      Promise.all(promises).catch(() => {
        this.metrics.failed += 1;
      });
    }
  }

  private safeInvoke(handler: EventHandler, event: RuntimeEvent): void | Promise<void> {
    try {
      return handler(event);
    } catch {
      return undefined;
    }
  }

  private archive(event: RuntimeEvent): void {
    updateLifecycle(event, "archived");
    this.history.push(event);
    const maxHistory = this.options.maxHistory ?? 1000;
    if (this.history.length > maxHistory) {
      this.history.shift();
    }
    this.metrics.historySize = this.history.length;
  }

  private recordLatency(start: number): void {
    const latency = Date.now() - start;
    this.latencySamples.push(latency);
    if (this.latencySamples.length > 100) {
      this.latencySamples.shift();
    }
    this.metrics.averageLatencyMs = this.computeAverageLatency();
  }

  private computeAverageLatency(): number {
    if (this.latencySamples.length === 0) return 0;
    const sum = this.latencySamples.reduce((a, b) => a + b, 0);
    return Math.round(sum / this.latencySamples.length);
  }

  private updateSubscriptionMetrics(): void {
    this.metrics.activeSubscriptions = this.subscriptions.size + this.wildcardHandlers.size;
  }
}
