/**
 * Context Assembly Engine Types
 * 
 * This engine is responsible for building the smallest, most relevant,
 * and highest-quality context for the AI model before every reasoning
 * or code generation request.
 */

import type { ExecutionPlan, Task } from "@/ide/intelligence/planning-engine";

/**
 * Context item types
 */
export type ContextItemType =
  | "file"
  | "symbol"
  | "component"
  | "api"
  | "route"
  | "database"
  | "config"
  | "memory"
  | "summary"
  | "architecture"
  | "workspace"
  | "knowledge_graph"
  | "diagnostic"
  | "verification"
  | "conversation";

/**
 * Context item with relevance score
 */
export interface ContextItem {
  id: string;
  type: ContextItemType;
  name: string;
  location?: string;
  content: string;
  summary?: string;
  relevanceScore: number;
  tokenCount: number;
  summaryTokenCount: number;
  dependencies?: string[];
  tags?: string[];
  source: string;
  cached: boolean;
  compressed: boolean;
  lastUpdated: number;
}

/**
 * Symbol types
 */
export type SymbolType =
  | "function"
  | "class"
  | "interface"
  | "enum"
  | "type"
  | "const"
  | "hook"
  | "utility"
  | "component"
  | "route"
  | "api"
  | "database_model";

/**
 * Symbol information
 */
export interface SymbolInfo {
  id: string;
  name: string;
  type: SymbolType;
  file: string;
  location?: { startLine: number; endLine: number };
  signature?: string;
  dependencies: string[];
  dependents: string[];
  summary?: string;
  relevanceScore: number;
}

/**
 * Context source descriptor
 */
export interface ContextSource {
  id: string;
  type: "workspace" | "knowledge_graph" | "memory" | "plan" | "task" | "file" | "diagnostic";
  priority: number;
  isReady: boolean;
  error?: string;
}

/**
 * Context assembly request
 */
export interface ContextAssemblyRequest {
  taskId?: string;
  task?: Task;
  plan?: ExecutionPlan;
  currentFile?: string;
  openTabs?: string[];
  cursorPosition?: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  recentEdits?: string[];
  currentErrors?: string[];
  modelType?: "fast" | "reasoning" | "long_context" | "code_specialist" | "verification";
  maxTokens?: number;
  userId?: string;
  workspaceId?: string;
  sessionId?: string;
}

/**
 * Context assembly output
 */
export interface ContextAssemblyResult {
  contextId: string;
  version: number;
  timestamp: number;

  // Current state
  currentObjective: string;
  currentTask?: Task;
  taskMetadata?: {
    taskId: string;
    title: string;
    category: string;
    priority: string;
  };

  // Relevant context
  relevantFiles: ContextItem[];
  relevantSymbols: ContextItem[];
  relevantComponents: ContextItem[];
  relevantApis: ContextItem[];
  relevantRoutes: ContextItem[];
  relevantDatabaseModels: ContextItem[];
  relevantConfigurations: ContextItem[];

  // Summaries
  workspaceSummary?: string;
  knowledgeGraphNodes: ContextItem[];
  memorySummaries: ContextItem[];
  architectureSummary?: string;
  recentChanges: ContextItem[];
  diagnostics: ContextItem[];
  verificationNotes: ContextItem[];

  // All context items ranked
  allItems: ContextItem[];

  // Statistics
  tokenCount: number;
  originalTokenCount: number;
  compressionRatio: number;
  cacheHitRate: number;
  relevanceScore: number;
  contextVersion: number;

  // Validation
  validation: ContextValidationResult;

  // Metadata
  sources: ContextSource[];
  assembledFor: string;
}

/**
 * Context validation result
 */
export interface ContextValidationResult {
  valid: boolean;
  duplicateFiles: string[];
  duplicateSummaries: string[];
  missingDependencies: string[];
  brokenReferences: string[];
  unnecessaryFiles: string[];
  staleCache: string[];
  outdatedSummaries: string[];
  errors: string[];
  warnings: string[];
}

/**
 * Context cache entry
 */
export interface ContextCacheEntry {
  key: string;
  content: string;
  summary: string;
  tokenCount: number;
  summaryTokenCount: number;
  relevanceScore: number;
  dependencies: string[];
  lastUpdated: number;
  accessCount: number;
  lastAccessed: number;
}

/**
 * Compression statistics
 */
export interface CompressionStatistics {
  originalSize: number;
  compressedSize: number;
  summariesCreated: number;
  filesReplaced: number;
  symbolsRemoved: number;
  duplicatesRemoved: number;
}

/**
 * Context layer
 */
export interface ContextLayer {
  level: number;
  name: string;
  items: ContextItem[];
  tokenCount: number;
  expandIfNeeded: boolean;
}

/**
 * Memory summary item
 */
export interface MemorySummary {
  id: string;
  type: "project" | "decision" | "architecture" | "preference" | "pattern" | "execution" | "workspace";
  content: string;
  relevanceScore: number;
  timestamp: number;
}
