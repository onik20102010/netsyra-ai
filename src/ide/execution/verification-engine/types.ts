/**
 * Verification & Self-Correction Engine Types
 * 
 * This engine validates every artifact produced by Netsyra IDE before
 * it is applied to the user's workspace. It detects defects, assesses quality,
 * performs structured reviews, identifies regressions, and automatically
 * repairs issues whenever possible.
 */

import type { GeneratedFileChange } from "@/ide/execution/code-generator";
import type { Task } from "@/ide/intelligence/planning-engine";
import type { ContextAssemblyResult } from "@/ide/intelligence/context-engine";

/**
 * Verification status
 */
export type VerificationStatus = "pending" | "running" | "passed" | "failed" | "partial" | "repaired";

/**
 * Verification severity
 */
export type VerificationSeverity = "info" | "warning" | "error" | "critical";

/**
 * Verification category
 */
export type VerificationCategory =
  | "syntax"
  | "type"
  | "import"
  | "dependency"
  | "build"
  | "runtime"
  | "security"
  | "architecture"
  | "performance"
  | "style"
  | "test"
  | "quality"
  | "regression"
  | "convention";

/**
 * Artifact type
 */
export type ArtifactType = "file" | "patch" | "command" | "config" | "migration" | "dependency" | "unknown";

/**
 * Verification artifact
 */
export interface VerificationArtifact {
  id: string;
  type: ArtifactType;
  path?: string;
  originalContent?: string;
  content?: string;
  patch?: string;
  command?: string;
  metadata?: Record<string, unknown>;
  source: string;
}

/**
 * Verification issue
 */
export interface VerificationIssue {
  id: string;
  category: VerificationCategory;
  severity: VerificationSeverity;
  title: string;
  description: string;
  path?: string;
  line?: number;
  column?: number;
  suggestedFix?: string;
  autoRepairable: boolean;
  repairAttempts: number;
  repaired: boolean;
  repairResult?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Verification result
 */
export interface VerificationResult {
  id: string;
  requestId: string;
  taskId: string;
  status: VerificationStatus;
  confidenceScore: number;
  artifacts: VerificationArtifact[];
  issues: VerificationIssue[];
  warnings: VerificationIssue[];
  repairedArtifacts: VerificationArtifact[];
  rejectedArtifacts: VerificationArtifact[];
  diagnostics: VerificationDiagnostic[];
  logs: VerificationLog[];
  metadata: VerificationMetadata;
  startTime: number;
  endTime: number;
  duration: number;
  modelId?: string;
  provider?: string;
}

/**
 * Verification diagnostic
 */
export interface VerificationDiagnostic {
  id: string;
  category: VerificationCategory;
  severity: VerificationSeverity;
  message: string;
  path?: string;
  line?: number;
  column?: number;
}

/**
 * Verification log
 */
export interface VerificationLog {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  stage: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Verification metadata
 */
export interface VerificationMetadata {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  repairAttempts: number;
  successfulRepairs: number;
  rejectedRepairs: number;
  verificationRounds: number;
  tokenUsage: number;
  modelRoutingReason?: string;
}

/**
 * Verification request
 */
export interface VerificationRequest {
  id: string;
  taskId: string;
  task: Task;
  artifacts: VerificationArtifact[];
  context?: ContextAssemblyResult;
  userMessage?: string;
  subscription: "free" | "paid";
  complexity: "low" | "medium" | "high" | "enterprise";
  maxRepairAttempts: number;
  streaming?: boolean;
  sessionId?: string;
  workspaceId?: string;
  correlationId?: string;
}

/**
 * Repair strategy
 */
export interface RepairStrategy {
  id: string;
  name: string;
  description: string;
  categories: VerificationCategory[];
  severityLevels: VerificationSeverity[];
  appliesTo: ArtifactType[];
  apply: (issue: VerificationIssue, artifact: VerificationArtifact) => Promise<VerificationArtifact | null>;
}

/**
 * Verification checker
 */
export interface VerificationChecker {
  id: string;
  category: VerificationCategory;
  name: string;
  description: string;
  enabled: boolean;
  canRepair: boolean;
  check: (artifact: VerificationArtifact, context?: ContextAssemblyResult) => Promise<VerificationIssue[]>;
  repair?: (issue: VerificationIssue, artifact: VerificationArtifact) => Promise<VerificationArtifact | null>;
}

/**
 * Verification stream event
 */
export interface VerificationStreamEvent {
  id: string;
  requestId: string;
  stage: string;
  status: VerificationStatus;
  payload: Record<string, unknown>;
  timestamp: number;
}

/**
 * Verification summary for memory
 */
export interface VerificationSummary {
  id: string;
  timestamp: number;
  taskId: string;
  result: "passed" | "failed" | "repaired";
  categories: VerificationCategory[];
  recurringIssues: string[];
  successfulRepairs: string[];
  conventions: string[];
  preferredFixes: string[];
}

/**
 * Model routing for verification
 */
export interface VerificationModelRoutingRequest {
  category: VerificationCategory;
  severity: VerificationSeverity;
  complexity: "low" | "medium" | "high" | "enterprise";
  subscription: "free" | "paid";
  artifactCount: number;
  tokenBudget: number;
  previousFailures?: string[];
}

/**
 * Model routing result for verification
 */
export interface VerificationModelRoutingResult {
  modelId: string;
  provider: import("@/ide/execution/code-generator/types").ModelProvider;
  reason: string;
  fallbackModelId?: string;
}
