/**
 * Live Streaming & Runtime Events Types
 * 
 * This subsystem streams every important action occurring inside the IDE
 * in real time. It is the communication layer between the backend runtime
 * and the frontend UI.
 */

import type { RuntimeEvent } from "@/ide/types";

/**
 * Event transport type
 */
export type EventTransport = "sse" | "websocket" | "eventbus" | "internal";

/**
 * Runtime event category
 */
export type RuntimeEventCategory =
  | "workspace"
  | "planning"
  | "intent"
  | "knowledge_graph"
  | "task_graph"
  | "scheduler"
  | "memory"
  | "context"
  | "router"
  | "provider"
  | "generation"
  | "verification"
  | "patch"
  | "file"
  | "diagnostics"
  | "ui"
  | "performance"
  | "telemetry"
  | "error"
  | "completion"
  | "cancellation"
  | "notification";

/**
 * Runtime stage
 */
export type RuntimeStage =
  | "waiting"
  | "starting"
  | "understanding_request"
  | "analyzing_workspace"
  | "loading_memory"
  | "building_context"
  | "planning"
  | "scheduling"
  | "selecting_model"
  | "calling_model"
  | "receiving_tokens"
  | "generating_files"
  | "running_verification"
  | "running_self_correction"
  | "preparing_patch"
  | "applying_patch"
  | "updating_workspace"
  | "refreshing_context"
  | "completed"
  | "cancelled"
  | "failed";

/**
 * Severity level
 */
export type RuntimeSeverity = "debug" | "info" | "warning" | "error" | "critical";

/**
 * Streamed runtime event
 */
export interface StreamedRuntimeEvent {
  id: string;
  sessionId: string;
  conversationId?: string;
  requestId?: string;
  pipelineId?: string;
  correlationId?: string;
  traceId?: string;
  timestamp: number;
  subsystem: string;
  type: string;
  category: RuntimeEventCategory;
  severity: RuntimeSeverity;
  stage?: RuntimeStage;
  status?: string;
  progress: number;
  currentStage?: string;
  payload: Record<string, unknown>;
  metadata: Record<string, unknown>;
  duration?: number;
}

/**
 * Runtime timeline
 */
export interface RuntimeTimeline {
  id: string;
  sessionId: string;
  pipelineId: string;
  startTime: number;
  endTime?: number;
  events: StreamedRuntimeEvent[];
  currentStage: RuntimeStage;
  progress: number;
  status: "running" | "completed" | "failed" | "cancelled";
}

/**
 * Streaming session
 */
export interface StreamingSession {
  id: string;
  sessionId: string;
  conversationId?: string;
  pipelineId?: string;
  transport: EventTransport;
  connected: boolean;
  clientId?: string;
  lastEventId?: string;
  createdAt: number;
  lastSeenAt: number;
}

/**
 * Transport adapter interface
 */
export interface StreamingTransport {
  id: string;
  type: EventTransport;
  send(event: StreamedRuntimeEvent): Promise<boolean>;
  connect(session: StreamingSession): Promise<void>;
  disconnect(session: StreamingSession): Promise<void>;
  isConnected(session: StreamingSession): boolean;
}

/**
 * Stream consumer
 */
export interface StreamConsumer {
  id: string;
  filter?: (event: StreamedRuntimeEvent) => boolean;
  onEvent: (event: StreamedRuntimeEvent) => void;
}

/**
 * Progress tracker
 */
export interface ProgressTracker {
  stage: RuntimeStage;
  percentage: number;
  startedAt: number;
  completedAt?: number;
  estimatedRemaining?: number;
}

/**
 * Performance metrics
 */
export interface RuntimePerformanceMetrics {
  latency: number;
  promptBuildTime: number;
  contextTime: number;
  modelTime: number;
  verificationTime: number;
  patchTime: number;
  streamingLatency: number;
  eventsPerSecond: number;
  tokensPerSecond: number;
  filesPerSecond: number;
  cpuUsage?: number;
  memoryUsage?: number;
  providerLatency: Record<string, number>;
}

/**
 * Telemetry event
 */
export interface TelemetryEvent {
  id: string;
  timestamp: number;
  sessionId: string;
  metric: string;
  value: number;
  metadata: Record<string, unknown>;
}

/**
 * Runtime notification
 */
export interface RuntimeNotification {
  id: string;
  timestamp: number;
  type: string;
  title: string;
  message: string;
  severity: RuntimeSeverity;
  metadata?: Record<string, unknown>;
}

/**
 * Cancellation token
 */
export interface CancellationToken {
  id: string;
  cancelled: boolean;
  reason?: string;
  cancelledAt?: number;
}

/**
 * Retry context
 */
export interface RetryContext {
  attempt: number;
  maxAttempts: number;
  failedStage: RuntimeStage;
  failedEventId?: string;
  error?: string;
  retryAt?: number;
}

/**
 * Streaming runtime config
 */
export interface StreamingRuntimeConfig {
  defaultTransport: EventTransport;
  enableTimeline: boolean;
  enableMetrics: boolean;
  enableTelemetry: boolean;
  enableNotifications: boolean;
  maxTimelineEvents: number;
  batchIntervalMs: number;
  maxConsumersPerSession: number;
  sessionTimeoutMs: number;
  transports: EventTransport[];
}

/**
 * Live UI state
 */
export interface LiveUIState {
  currentStage: RuntimeStage;
  activeSubsystem: string;
  progress: number;
  timeline: RuntimeTimeline;
  activeModel?: string;
  activeProvider?: string;
  activeTask?: string;
  currentFile?: string;
  filesChanged: string[];
  verificationStatus?: string;
  patchStatus?: string;
  diagnostics: RuntimeDiagnostic[];
  warnings: string[];
  errors: string[];
  elapsedTime: number;
  estimatedRemainingTime?: number;
  tokenStream?: string;
  canCancel: boolean;
  canRetry: boolean;
}

/**
 * Runtime diagnostic
 */
export interface RuntimeDiagnostic {
  id: string;
  timestamp: number;
  severity: RuntimeSeverity;
  message: string;
  path?: string;
  line?: number;
  column?: number;
}

/**
 * Token stream chunk
 */
export interface TokenStreamChunk {
  id: string;
  sessionId: string;
  requestId: string;
  content: string;
  type: "token" | "paragraph" | "markdown" | "code_block" | "json" | "tool_output" | "reasoning" | "status";
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Structured stream data
 */
export interface StructuredStreamData {
  currentFile?: string;
  currentFunction?: string;
  currentClass?: string;
  currentTask?: string;
  currentTool?: string;
  currentModel?: string;
  currentProvider?: string;
  estimatedTime?: number;
  tokensUsed?: number;
  filesRemaining?: number;
  completedTasks?: number;
  verificationProgress?: number;
  patchProgress?: number;
}
