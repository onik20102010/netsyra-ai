import type {
  RuntimeEvent,
  EventCategory,
  EventPriority,
  EventLifecycle,
  EventStatus,
} from "@/ide/types";

function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export interface EventInit {
  type: string;
  source: string;
  category?: EventCategory;
  priority?: EventPriority;
  target?: string;
  payload?: unknown;
  correlationId?: string;
  sessionId?: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
  version?: number;
  traceId?: string;
  duration?: number;
  retryCount?: number;
  securityContext?: Record<string, unknown>;
  batchable?: boolean;
  batchKey?: string;
}

const DEFAULT_PRIORITY: EventPriority = "normal";
const DEFAULT_CATEGORY: EventCategory = "runtime";
const DEFAULT_VERSION = 1;

export function createEvent(init: EventInit): RuntimeEvent {
  return {
    id: generateId(),
    timestamp: Date.now(),
    type: init.type,
    source: init.source,
    category: init.category ?? DEFAULT_CATEGORY,
    priority: init.priority ?? DEFAULT_PRIORITY,
    target: init.target,
    payload: init.payload ?? null,
    correlationId: init.correlationId,
    sessionId: init.sessionId,
    workspaceId: init.workspaceId,
    metadata: init.metadata ?? {},
    version: init.version ?? DEFAULT_VERSION,
    status: "pending",
    lifecycle: "created",
    traceId: init.traceId,
    duration: init.duration,
    retryCount: init.retryCount ?? 0,
    securityContext: init.securityContext,
    batchable: init.batchable,
    batchKey: init.batchKey,
  };
}

export function updateLifecycle(event: RuntimeEvent, lifecycle: EventLifecycle): void {
  event.lifecycle = lifecycle;
}

export function updateStatus(event: RuntimeEvent, status: EventStatus): void {
  event.status = status;
}

export const priorityOrder: Record<EventPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
  background: 4,
};

export function compareEventPriority(a: RuntimeEvent, b: RuntimeEvent): number {
  const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
  if (priorityDiff !== 0) return priorityDiff;
  return a.timestamp - b.timestamp;
}
