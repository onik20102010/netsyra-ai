import type { EventCategory, EventPriority, RuntimeEvent } from "@/ide/types";
import type { EventHandler } from "@/ide/kernel/types";

export interface SubscriptionOptions {
  id?: string;
  types?: string[];
  categories?: EventCategory[];
  priorities?: EventPriority[];
  sources?: string[];
  target?: string;
  filter?: (event: RuntimeEvent) => boolean;
  handler: EventHandler;
  active?: boolean;
}

export class Subscription {
  id: string;
  types?: string[];
  categories?: EventCategory[];
  priorities?: EventPriority[];
  sources?: string[];
  target?: string;
  filter?: (event: RuntimeEvent) => boolean;
  handler: EventHandler;
  active: boolean;

  constructor(options: SubscriptionOptions) {
    this.id = options.id ?? `sub-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    this.types = options.types;
    this.categories = options.categories;
    this.priorities = options.priorities;
    this.sources = options.sources;
    this.target = options.target;
    this.filter = options.filter;
    this.handler = options.handler;
    this.active = options.active ?? true;
  }

  matches(event: RuntimeEvent): boolean {
    if (!this.active) return false;

    if (this.types && !this.types.includes("*") && !this.types.includes(event.type)) {
      return false;
    }

    if (this.categories && !this.categories.includes(event.category)) {
      return false;
    }

    if (this.priorities && !this.priorities.includes(event.priority)) {
      return false;
    }

    if (this.sources && !this.sources.includes(event.source)) {
      return false;
    }

    if (this.target && this.target !== event.target && event.target !== undefined) {
      return false;
    }

    if (this.filter && !this.filter(event)) {
      return false;
    }

    return true;
  }
}
