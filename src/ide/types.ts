/**
 * Shared runtime types for Netsyra IDE.
 */

export type RuntimeState =
  | "booting"
  | "initializing"
  | "ready"
  | "busy"
  | "paused"
  | "recovering"
  | "restarting"
  | "stopping"
  | "stopped"
  | "error";

export type SubsystemLifecycle =
  | "uninitialized"
  | "initialized"
  | "starting"
  | "running"
  | "paused"
  | "stopping"
  | "restarting"
  | "recovering"
  | "stopped"
  | "error";

export type EventCategory =
  | "runtime"
  | "workspace"
  | "explorer"
  | "editor"
  | "memory"
  | "knowledge"
  | "planner"
  | "task"
  | "execution"
  | "streaming"
  | "verification"
  | "router"
  | "tool"
  | "diagnostics"
  | "telemetry"
  | "plugin"
  | "session"
  | "user"
  | "ui"
  | "config";

export type EventPriority = "critical" | "high" | "normal" | "low" | "background";

export type EventLifecycle =
  | "created"
  | "queued"
  | "validated"
  | "dispatched"
  | "processing"
  | "completed"
  | "cancelled"
  | "failed"
  | "retried"
  | "archived";

export type EventStatus = "pending" | "success" | "failure";

export interface RuntimeEvent {
  id: string;
  type: string;
  category: EventCategory;
  priority: EventPriority;
  source: string;
  target?: string;
  payload: unknown;
  timestamp: number;
  correlationId?: string;
  sessionId?: string;
  workspaceId?: string;
  metadata?: Record<string, unknown>;
  version: number;
  status: EventStatus;
  lifecycle: EventLifecycle;
  traceId?: string;
  duration?: number;
  retryCount: number;
  securityContext?: Record<string, unknown>;
  batchable?: boolean;
  batchKey?: string;
}

export interface SubsystemConfig {
  [key: string]: unknown;
}

export interface RuntimeConfig {
  environment: "development" | "production" | "test";
  debug: boolean;
  maxRetries: number;
  retryDelayMs: number;
  healthCheckIntervalMs: number;
  maxConcurrentTasks: number;
  modelProvider?: string;
  freeTierProvider: string;
  paidTierProvider: string;
  sessionTtlMs: number;
  memoryLimitMb: number;
  [key: string]: unknown;
}

export interface RuntimeMetrics {
  bootTimeMs: number;
  lastStartTime: number;
  lastShutdownTime: number;
  restartCount: number;
  errorCount: number;
  eventCount: number;
  subsystemHealth: Record<string, boolean>;
  [key: string]: unknown;
}

export interface RuntimeStatus {
  state: RuntimeState;
  lifecycle: SubsystemLifecycle;
  startedAt: number;
  uptimeMs: number;
  subsystems: SubsystemStatus[];
  metrics: RuntimeMetrics;
  session: SessionSnapshot | null;
}

export interface SubsystemStatus {
  id: string;
  name: string;
  version: string;
  lifecycle: SubsystemLifecycle;
  healthy: boolean;
  dependencies: string[];
  capabilities: string[];
  lastError: string | null;
}

export interface SessionSnapshot {
  id: string;
  workspace: string | null;
  user: string | null;
  project: string | null;
  runtimeId: string;
  openFiles: string[];
  currentTask: string | null;
  currentModel: string | null;
  state: string;
}

export interface HealthReport {
  healthy: boolean;
  timestamp: number;
  details: Record<string, unknown>;
  errors: string[];
}

export interface DiagnosticsSnapshot {
  runtimeState: RuntimeState;
  subsystems: SubsystemStatus[];
  logs: RuntimeLog[];
  health: Record<string, HealthReport>;
  timestamp: number;
}

export interface RuntimeLog {
  id: string;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  source: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}
