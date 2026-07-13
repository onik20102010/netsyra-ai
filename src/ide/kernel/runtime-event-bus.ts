import type { RuntimeEvent, EventCategory, EventPriority } from "@/ide/types";
import { BaseSubsystem } from "./subsystem";
import { EventBus } from "@/ide/events";
import type { IEventBus, EventHandler } from "./types";
import type { EventInit, SubscriptionOptions } from "@/ide/events";

function inferCategory(type: string): EventCategory {
  const prefix = type.split(":")[0];
  const categories = [
    "runtime",
    "workspace",
    "explorer",
    "editor",
    "memory",
    "knowledge",
    "planner",
    "task",
    "execution",
    "streaming",
    "verification",
    "router",
    "tool",
    "diagnostics",
    "telemetry",
    "plugin",
    "session",
    "user",
    "ui",
    "config",
  ] as const;
  const category = categories.find((c) => c === prefix);
  return (category as EventCategory) ?? "runtime";
}

function inferPriority(type: string): EventPriority {
  if (type.startsWith("error") || type.startsWith("critical")) return "critical";
  if (type.startsWith("kernel:")) return "high";
  if (type.startsWith("streaming:")) return "high";
  if (type.startsWith("execution:")) return "high";
  if (type.startsWith("planner:")) return "high";
  if (type.startsWith("diagnostics:")) return "low";
  if (type.startsWith("telemetry:")) return "background";
  return "normal";
}

export class RuntimeEventBus extends BaseSubsystem implements IEventBus {
  private bus: EventBus;

  constructor() {
    super({
      id: "runtime-event-bus",
      name: "Runtime Event Bus",
      version: "1.0.0",
      capabilities: ["events", "bus", "messaging", "streaming"],
    });
    this.bus = new EventBus({ maxHistory: 2000 });
  }

  async emit(event: RuntimeEvent): Promise<void> {
    await this.bus.publish(event);
  }

  subscribe(type: string, handler: EventHandler): () => void;
  subscribe(options: SubscriptionOptions): () => void;
  subscribe(
    typeOrOptions: string | SubscriptionOptions,
    handler?: EventHandler
  ): () => void {
    if (typeof typeOrOptions === "string") {
      if (!handler) throw new Error("Handler is required when subscribing by type.");
      return this.bus.subscribe(typeOrOptions, handler);
    }
    return this.bus.subscribe(typeOrOptions);
  }

  subscribeAll(handler: EventHandler): () => void {
    return this.bus.subscribeAll(handler);
  }

  getHistory(limit?: number): RuntimeEvent[] {
    return this.bus.getHistory(limit);
  }

  createEvent(type: string, source: string, payload?: unknown): RuntimeEvent;
  createEvent(init: EventInit): RuntimeEvent;
  createEvent(typeOrInit: string | EventInit, source?: string, payload?: unknown): RuntimeEvent {
    if (typeof typeOrInit === "string") {
      const type = typeOrInit;
      return this.bus.createEvent({
        type,
        source: source ?? "kernel",
        payload,
        category: inferCategory(type),
        priority: inferPriority(type),
      });
    }
    return this.bus.createEvent(typeOrInit);
  }

  onEvent(_event: RuntimeEvent): void {
    // The bus is a passive transport; it does not dispatch events itself.
  }

  getMetrics(): Record<string, unknown> {
    return this.bus.getMetrics();
  }

  getDiagnostics(): Record<string, unknown> {
    return {
      ...this.bus.getMetrics(),
      subscriptions: this.bus.getSubscriptions().map((s) => s.id),
    };
  }
}
