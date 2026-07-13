/**
 * Code Generation Engine Types
 * 
 * This engine is an intelligent orchestration layer for generating, editing,
 * refactoring, debugging, reviewing, and explaining code inside the IDE.
 * It is provider-agnostic, model-agnostic, and event-driven.
 */

import type { ContextAssemblyResult } from "@/ide/intelligence/context-engine";
import type { Task } from "@/ide/intelligence/planning-engine";

/**
 * Generation type
 */
export type GenerationType =
  | "create_file"
  | "edit_file"
  | "refactor"
  | "fix_bug"
  | "optimize"
  | "explain"
  | "review"
  | "generate_tests"
  | "generate_docs"
  | "generate_sql"
  | "generate_api"
  | "generate_ui"
  | "generate_backend"
  | "migrate_framework"
  | "rename_symbols"
  | "extract_component"
  | "extract_hook"
  | "convert_language"
  | "update_dependencies";

/**
 * Model provider
 */
export type ModelProvider = "groq" | "mesh" | "openai" | "anthropic" | "google" | "custom";

/**
 * Model tier
 */
export type ModelTier = "free" | "paid" | "premium" | "enterprise";

/**
 * Model capability
 */
export type ModelCapability =
  | "fast_chat"
  | "general_coding"
  | "large_file_generation"
  | "debugging"
  | "repository_reasoning"
  | "architecture"
  | "autocomplete"
  | "embedding"
  | "safety"
  | "reasoning"
  | "multi_file_editing";

/**
 * Model information
 */
export interface ModelInfo {
  id: string;
  name: string;
  provider: ModelProvider;
  tier: ModelTier;
  capabilities: ModelCapability[];
  maxContextTokens: number;
  maxOutputTokens: number;
  costPerInputToken: number;
  costPerOutputToken: number;
  latencyProfile: "fast" | "medium" | "slow";
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
  health: "healthy" | "degraded" | "unhealthy";
  rateLimit: number;
  fallbackModelId?: string;
}

/**
 * Code generation request
 */
export interface CodeGenerationRequest {
  id: string;
  taskId: string;
  generationType: GenerationType;
  task: Task;
  context: ContextAssemblyResult;
  userMessage?: string;
  existingCode?: string;
  targetFiles?: string[];
  language?: string;
  framework?: string;
  complexity: "low" | "medium" | "high" | "enterprise";
  subscription: "free" | "paid";
  userId?: string;
  workspaceId?: string;
  sessionId?: string;
  correlationId?: string;
  maxTokens?: number;
  streaming?: boolean;
  onStreamEvent?: (event: CodeGenerationStreamEvent) => void;
}

/**
 * File operation
 */
export type FileOperation = "create" | "edit" | "replace" | "delete" | "rename" | "patch";

/**
 * Generated file change
 */
export interface GeneratedFileChange {
  id: string;
  path: string;
  operation: FileOperation;
  originalContent?: string;
  newContent?: string;
  patch?: string;
  reasoning: string;
  dependencies: string[];
  isVerified: boolean;
  verificationErrors: string[];
  language?: string;
}

/**
 * Code generation result
 */
export interface CodeGenerationResult {
  id: string;
  requestId: string;
  taskId: string;
  success: boolean;
  status: "completed" | "failed" | "partial" | "verified";
  modelId: string;
  provider: ModelProvider;
  generationType: GenerationType;
  files: GeneratedFileChange[];
  explanation?: string;
  summary?: string;
  tokenUsage: TokenUsage;
  duration: number;
  startTime: number;
  endTime: number;
  streamingEvents: number;
  verificationStatus: VerificationStatus;
  error?: CodeGenerationError;
  metadata: GenerationMetadata;
}

/**
 * Token usage
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

/**
 * Verification status
 */
export interface VerificationStatus {
  checks: string[];
  passed: string[];
  failed: string[];
  warnings: string[];
  overall: "passed" | "failed" | "pending";
}

/**
 * Code generation error
 */
export interface CodeGenerationError {
  code: string;
  message: string;
  recoverable: boolean;
  details?: Record<string, unknown>;
}

/**
 * Generation metadata
 */
export interface GenerationMetadata {
  promptLength: number;
  contextFiles: number;
  contextTokens: number;
  modelRoutingReason: string;
  strategy: string;
  retries: number;
  fallbackUsed?: string;
}

/**
 * Stream event
 */
export interface CodeGenerationStreamEvent {
  id: string;
  requestId: string;
  type: string;
  stage: string;
  payload: Record<string, unknown>;
  timestamp: number;
}

/**
 * Model routing request
 */
export interface ModelRoutingRequest {
  taskType: GenerationType;
  projectSize?: number;
  fileSize?: number;
  contextSize: number;
  language?: string;
  framework?: string;
  complexity: "low" | "medium" | "high" | "enterprise";
  latencyRequirement: "fast" | "normal" | "slow";
  subscription: "free" | "paid";
  tokenBudget: number;
  requiredCapabilities: ModelCapability[];
  providerHealth?: Record<string, "healthy" | "degraded" | "unhealthy">;
  previousFailures?: string[];
}

/**
 * Model routing result
 */
export interface ModelRoutingResult {
  modelId: string;
  provider: ModelProvider;
  reason: string;
  estimatedCost: number;
  estimatedLatency: string;
  fallbackModelId?: string;
}

/**
 * Prompt template
 */
export interface PromptTemplate {
  id: string;
  generationType: GenerationType;
  role: string;
  content: string;
  variables: string[];
  version: string;
}

/**
 * Provider client interface
 */
export interface ModelProviderClient {
  id: string;
  provider: ModelProvider;
  generate: (options: ProviderGenerateOptions) => Promise<ProviderResponse>;
  generateStream?: (options: ProviderGenerateOptions) => AsyncIterable<ProviderStreamChunk>;
  healthCheck: () => Promise<boolean>;
  getRateLimitStatus: () => Promise<RateLimitStatus>;
}

/**
 * Provider generate options
 */
export interface ProviderGenerateOptions {
  modelId: string;
  prompt: string;
  systemPrompt?: string;
  messages?: ProviderMessage[];
  temperature: number;
  maxTokens: number;
  streaming?: boolean;
  topP?: number;
  stopSequences?: string[];
}

/**
 * Provider message
 */
export interface ProviderMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  name?: string;
}

/**
 * Provider response
 */
export interface ProviderResponse {
  content: string;
  modelId: string;
  provider: ModelProvider;
  tokenUsage: TokenUsage;
  finishReason: string;
  duration: number;
  error?: string;
}

/**
 * Provider stream chunk
 */
export interface ProviderStreamChunk {
  content: string;
  finishReason?: string;
  usage?: Partial<TokenUsage>;
}

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  remaining: number;
  resetAt: number;
  limit: number;
}

/**
 * Generation strategy
 */
export interface GenerationStrategy {
  id: string;
  name: string;
  generationTypes: GenerationType[];
  promptTemplate: string;
  temperature: number;
  maxTokens: number;
  requiresVerification: boolean;
  incremental: boolean;
  multiFile: boolean;
  preferredCapabilities: ModelCapability[];
}

/**
 * Patch format
 */
export interface PatchFormat {
  type: "unified" | "structured" | "whole_file";
  path: string;
  hunks?: PatchHunk[];
  content?: string;
}

/**
 * Patch hunk
 */
export interface PatchHunk {
  oldStart: number;
  oldLines: number;
  newStart: number;
  newLines: number;
  lines: string;
}

/**
 * Streaming stage
 */
export interface StreamingStage {
  id: string;
  name: string;
  description: string;
  order: number;
  duration?: number;
}
