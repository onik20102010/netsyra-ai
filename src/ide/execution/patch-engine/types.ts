/**
 * Patch & File Integration Engine Types
 * 
 * This engine safely integrates verified AI-generated changes into the user's workspace.
 * It analyzes patches, compares them against the current workspace, detects conflicts,
 * preserves user edits, applies minimal modifications, and updates workspace state.
 */

import type { VerificationResult } from "@/ide/execution/verification-engine";

/**
 * Patch operation
 */
export type PatchOperation =
  | "create"
  | "update"
  | "replace"
  | "delete"
  | "rename"
  | "move"
  | "copy"
  | "create_folder"
  | "delete_folder"
  | "rename_folder"
  | "move_folder"
  | "replace_block"
  | "insert_block"
  | "remove_block"
  | "update_imports"
  | "update_exports"
  | "update_dependencies"
  | "update_config";

/**
 * Integration status
 */
export type IntegrationStatus = "pending" | "preparing" | "conflict_detected" | "merging" | "applying" | "formatting" | "completed" | "failed" | "rolled_back";

/**
 * File patch
 */
export interface FilePatch {
  id: string;
  executionId: string;
  taskId: string;
  path: string;
  operation: PatchOperation;
  originalHash?: string;
  updatedHash?: string;
  originalContent?: string;
  newContent?: string;
  patchContent?: string;
  dependencies: string[];
  confidence: number;
  reasoning: string;
  timestamp: number;
  hunks?: PatchHunk[];
  blocks?: PatchBlock[];
}

/**
 * Patch hunk (for diff-based patches)
 */
export interface PatchHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string;
  header?: string;
}

/**
 * Patch block (for structural patches)
 */
export interface PatchBlock {
  id: string;
  type: "replace" | "insert" | "remove";
  target?: string;
  position?: "before" | "after" | "inside";
  content?: string;
  oldContent?: string;
  newContent?: string;
  path?: string;
  startLine?: number;
  endLine?: number;
}

/**
 * Integration request
 */
export interface IntegrationRequest {
  id: string;
  taskId: string;
  executionId: string;
  verificationResult: VerificationResult;
  patches: FilePatch[];
  workspacePath: string;
  workspaceVersion: string;
  openEditors?: OpenEditorState[];
  sessionId?: string;
  workspaceId?: string;
  correlationId?: string;
  streaming?: boolean;
}

/**
 * Open editor state
 */
export interface OpenEditorState {
  path: string;
  cursorLine: number;
  cursorColumn: number;
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  scrollTop: number;
  foldedLines?: number[];
  breakpoints?: number[];
}

/**
 * Integration result
 */
export interface IntegrationResult {
  id: string;
  requestId: string;
  taskId: string;
  executionId: string;
  status: IntegrationStatus;
  success: boolean;
  patches: FilePatchResult[];
  conflicts: ConflictReport[];
  rollbackCheckpointId: string;
  workspaceVersion: string;
  updatedFiles: string[];
  createdFiles: string[];
  deletedFiles: string[];
  duration: number;
  startTime: number;
  endTime: number;
  logs: IntegrationLog[];
  metadata: IntegrationMetadata;
}

/**
 * File patch result
 */
export interface FilePatchResult {
  patchId: string;
  path: string;
  operation: PatchOperation;
  status: "applied" | "failed" | "merged" | "skipped" | "conflict";
  originalHash?: string;
  updatedHash?: string;
  originalContent?: string;
  newContent?: string;
  error?: string;
  duration: number;
}

/**
 * Conflict report
 */
export interface ConflictReport {
  id: string;
  patchId: string;
  path: string;
  type: "line" | "overlap" | "deleted" | "renamed" | "moved" | "import" | "symbol";
  description: string;
  severity: "info" | "warning" | "error";
  originalContent?: string;
  generatedContent?: string;
  currentContent?: string;
  suggestedResolution?: string;
  autoResolvable: boolean;
}

/**
 * Integration log
 */
export interface IntegrationLog {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  stage: string;
  message: string;
  metadata?: Record<string, unknown>;
}

/**
 * Integration metadata
 */
export interface IntegrationMetadata {
  totalPatches: number;
  appliedPatches: number;
  failedPatches: number;
  mergedPatches: number;
  skippedPatches: number;
  conflictCount: number;
  autoResolvedConflicts: number;
  manualConflicts: number;
  formattedFiles: number;
  transactionId: string;
  atomic: boolean;
}

/**
 * Workspace snapshot
 */
export interface WorkspaceSnapshot {
  version: string;
  timestamp: number;
  files: WorkspaceFile[];
  directories: string[];
  hash: string;
}

/**
 * Workspace file
 */
export interface WorkspaceFile {
  path: string;
  content: string;
  hash: string;
  lastModified: number;
  size: number;
  language?: string;
}

/**
 * Rollback checkpoint
 */
export interface RollbackCheckpoint {
  id: string;
  executionId: string;
  taskId: string;
  timestamp: number;
  snapshot: WorkspaceSnapshot;
  patchIds: string[];
  reason: string;
}

/**
 * Integration history entry
 */
export interface IntegrationHistoryEntry {
  id: string;
  executionId: string;
  taskId: string;
  timestamp: number;
  files: string[];
  operations: PatchOperation[];
  duration: number;
  rollbackCheckpointId: string;
  verificationResultId?: string;
  userApproved: boolean;
  status: "success" | "failed" | "rolled_back";
}

/**
 * Patch stream event
 */
export interface PatchStreamEvent {
  id: string;
  requestId: string;
  stage: string;
  status: IntegrationStatus;
  payload: Record<string, unknown>;
  timestamp: number;
}

/**
 * Protected file rules
 */
export interface ProtectedFileRules {
  paths: string[];
  patterns: string[];
  allowWithConfirmation: string[];
  allowWithReason: string[];
}
