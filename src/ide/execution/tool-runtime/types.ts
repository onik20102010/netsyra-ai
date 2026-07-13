/**
 * Tool Calling Runtime Types
 * 
 * This module defines the types and interfaces for the Tool Calling Runtime,
 * which enables the Netsyra IDE Agent to safely interact with the workspace,
 * environment, terminal, browser, AI models, and external services.
 */

import type { Task } from "@/ide/intelligence/planning-engine";
import type { ContextAssemblyResult } from "@/ide/intelligence/context-engine";

/**
 * Tool category
 */
export type ToolCategory =
  | "workspace"
  | "editor"
  | "terminal"
  | "search"
  | "ai"
  | "runtime"
  | "git"
  | "browser"
  | "database"
  | "memory"
  | "filesystem"
  | "configuration";

/**
 * Tool permission level
 */
export type ToolPermissionLevel = "safe" | "medium" | "high" | "critical";

/**
 * Tool execution status
 */
export type ToolExecutionStatus =
  | "pending"
  | "validating"
  | "executing"
  | "completed"
  | "failed"
  | "retrying"
  | "cancelled"
  | "blocked";

/**
 * Tool definition
 */
export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: ToolCategory;
  permissions: ToolPermissionLevel;
  timeout: number;
  retryPolicy: ToolRetryPolicy;
  inputSchema: ToolInputSchema;
  outputSchema: ToolOutputSchema;
  examples?: ToolExample[];
  requiresConfirmation?: boolean;
  cacheable: boolean;
  parallelizable: boolean;
  fallbackToolId?: string;
}

/**
 * Tool retry policy
 */
export interface ToolRetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
  retryableStatusCodes?: number[];
}

/**
 * Tool input schema
 */
export interface ToolInputSchema {
  type: "object";
  properties: Record<string, ToolInputProperty>;
  required: string[];
  additionalProperties?: boolean;
}

/**
 * Tool input property
 */
export interface ToolInputProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
  enum?: string[];
  items?: ToolInputProperty;
  default?: unknown;
}

/**
 * Tool output schema
 */
export interface ToolOutputSchema {
  type: "object";
  properties: Record<string, ToolOutputProperty>;
  required: string[];
}

/**
 * Tool output property
 */
export interface ToolOutputProperty {
  type: "string" | "number" | "boolean" | "array" | "object";
  description: string;
}

/**
 * Tool example
 */
export interface ToolExample {
  description: string;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
}

/**
 * Tool execution request
 */
export interface ToolExecutionRequest {
  executionId: string;
  taskId: string;
  toolId: string;
  input: Record<string, unknown>;
  correlationId?: string;
  sessionId?: string;
  workspaceId?: string;
  userId?: string;
  modelType?: string;
  context?: ContextAssemblyResult;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  executionId: string;
  taskId: string;
  toolId: string;
  status: ToolExecutionStatus;
  success: boolean;
  output: Record<string, unknown>;
  error?: ToolError;
  duration: number;
  startTime: number;
  endTime: number;
  retryCount: number;
  cached: boolean;
  logs: ToolExecutionLog[];
  artifacts: ToolArtifact[];
  metadata: ToolExecutionMetadata;
}

/**
 * Tool error
 */
export interface ToolError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  recoverable: boolean;
  suggestedAction?: string;
}

/**
 * Tool execution log
 */
export interface ToolExecutionLog {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Tool artifact
 */
export interface ToolArtifact {
  id: string;
  type: "file" | "patch" | "output" | "log" | "summary";
  name: string;
  path?: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Tool execution metadata
 */
export interface ToolExecutionMetadata {
  inputSize: number;
  outputSize: number;
  cacheHit: boolean;
  permissionLevel: ToolPermissionLevel;
  validationErrors?: string[];
  safetyChecks?: string[];
  fallbackUsed?: string;
}

/**
 * Tool instance
 */
export interface Tool {
  definition: ToolDefinition;
  execute: (request: ToolExecutionRequest) => Promise<ToolExecutionResult>;
  validateInput?: (input: Record<string, unknown>) => string[];
  validateOutput?: (output: Record<string, unknown>) => string[];
}

/**
 * Tool execution context
 */
export interface ToolRuntimeContext {
  executionId: string;
  task: Task;
  planId?: string;
  context?: ContextAssemblyResult;
  userPermissions?: UserPermissions;
  workspacePath?: string;
  sessionId?: string;
  workspaceId?: string;
  userId?: string;
  modelType?: string;
}

/**
 * User permissions
 */
export interface UserPermissions {
  allowSafe: boolean;
  allowMedium: boolean;
  allowHigh: boolean;
  allowCritical: boolean;
  allowedTools?: string[];
  blockedTools?: string[];
  allowedCommands?: string[];
  blockedCommands?: string[];
  allowedPaths?: string[];
  blockedPaths?: string[];
  requireConfirmationFor?: string[];
}

/**
 * Tool cache entry
 */
export interface ToolCacheEntry {
  key: string;
  result: ToolExecutionResult;
  timestamp: number;
  ttl: number;
  invalidatedBy: string[];
}

/**
 * Safety validation result
 */
export interface SafetyValidationResult {
  allowed: boolean;
  level: ToolPermissionLevel;
  checks: SafetyCheck[];
  reason?: string;
  alternatives?: string[];
}

/**
 * Safety check
 */
export interface SafetyCheck {
  id: string;
  type: string;
  description: string;
  passed: boolean;
  severity: "info" | "warning" | "error" | "critical";
  details?: string;
}

/**
 * Tool runtime configuration
 */
export interface ToolRuntimeConfig {
  defaultTimeout: number;
  maxParallelExecutions: number;
  enableCaching: boolean;
  enableStreaming: boolean;
  enableSafety: boolean;
  workspaceRoot?: string;
  protectedPaths?: string[];
  protectedFiles?: string[];
  allowedCommands?: string[];
  blockedCommands?: string[];
  maxRetries: number;
  defaultRetryPolicy: ToolRetryPolicy;
}

/**
 * Tool execution batch
 */
export interface ToolExecutionBatch {
  batchId: string;
  batchNumber: number;
  executions: ToolExecutionRequest[];
  canParallelize: boolean;
  dependencies: string[];
  status: ToolExecutionStatus;
  results: ToolExecutionResult[];
}

/**
 * Tool runtime event
 */
export interface ToolRuntimeEvent {
  id: string;
  type: string;
  executionId: string;
  taskId: string;
  toolId: string;
  status: ToolExecutionStatus;
  payload: Record<string, unknown>;
  timestamp: number;
  correlationId?: string;
  sessionId?: string;
  workspaceId?: string;
}

/**
 * Tool execution statistics
 */
export interface ToolExecutionStats {
  totalExecutions: number;
  successful: number;
  failed: number;
  retried: number;
  cancelled: number;
  cacheHits: number;
  averageDuration: number;
  totalTokens: number;
}
