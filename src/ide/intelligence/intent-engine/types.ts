/**
 * Intent & Objective Engine Types
 * 
 * This engine is the first intelligent stage executed after every user message.
 * It must NEVER generate code, modify files, or call tools.
 * Its only purpose is to completely understand the user's objective.
 */

/**
 * Intent categories for classifying user requests
 * Multiple categories may apply with confidence scores
 */
export type IntentCategory =
  | "create"
  | "edit"
  | "delete"
  | "fix"
  | "debug"
  | "refactor"
  | "rename"
  | "move"
  | "optimize"
  | "explain"
  | "research"
  | "review"
  | "generate"
  | "implement"
  | "design"
  | "analyze"
  | "compare"
  | "document"
  | "configure"
  | "upgrade"
  | "migrate"
  | "test"
  | "improve"
  | "secure"
  | "deploy"
  | "build"
  | "convert"
  | "translate"
  | "summarize"
  | "plan";

/**
 * Confidence level for intent classification
 */
export type ConfidenceLevel = "very_low" | "low" | "medium" | "high" | "very_high";

/**
 * Complexity estimation
 */
export type Complexity = "very_small" | "small" | "medium" | "large" | "very_large" | "enterprise";

/**
 * Scope of the request
 */
export type Scope =
  | "entire_workspace"
  | "feature"
  | "folder"
  | "component"
  | "api"
  | "route"
  | "database"
  | "config"
  | "environment"
  | "hook"
  | "library"
  | "single_file"
  | "single_function"
  | "class"
  | "interface"
  | "multiple_files";

/**
 * Execution strategy recommendation
 */
export type ExecutionStrategy =
  | "simple_edit"
  | "patch"
  | "full_feature"
  | "large_refactor"
  | "incremental_implementation"
  | "parallel_implementation";

/**
 * Model recommendation for later execution
 */
export type ModelRecommendation = "fast" | "reasoning" | "long_context" | "code_specialist" | "verification";

/**
 * Intent category with confidence score
 */
export interface IntentClassification {
  category: IntentCategory;
  confidence: number; // 0-1
}

/**
 * Workspace context required for intent analysis
 */
export interface WorkspaceContext {
  currentFile?: string;
  openTabs: string[];
  cursorPosition?: { line: number; column: number };
  selection?: { start: { line: number; column: number }; end: { line: number; column: number } };
  workspaceSummary?: string;
  knowledgeGraphSummary?: string;
  recentEdits?: string[];
  conversationSummary?: string;
  projectMemorySummary?: string;
}

/**
 * Extracted requirements
 */
export interface Requirement {
  id: string;
  description: string;
  source: "explicit" | "implicit";
  priority: "high" | "medium" | "low";
}

/**
 * Detected constraint
 */
export interface Constraint {
  type: string;
  description: string;
  impact: "breaking" | "non_breaking" | "unknown";
}

/**
 * Detected risk
 */
export interface Risk {
  type: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  mitigation?: string;
}

/**
 * Dependency analysis result
 */
export interface DependencyAnalysis {
  dependsOn: string[];
  affected: string[];
  chainReactions: string[];
  breakingChanges: string[];
  circularRisks: string[];
}

/**
 * Clarification question
 */
export interface ClarificationQuestion {
  id: string;
  question: string;
  options?: string[];
  critical: boolean;
}

/**
 * Token estimation
 */
export interface TokenEstimation {
  planning: number;
  context: number;
  generation: number;
  verification: number;
  total: number;
}

/**
 * Context requirements
 */
export interface ContextRequirement {
  files: string[];
  folders: string[];
  components: string[];
  apis: string[];
  modules: string[];
  symbols: string[];
  reason: string;
}

/**
 * Planning metadata
 */
export interface PlanningMetadata {
  priority: "critical" | "high" | "medium" | "low";
  estimatedDuration?: string;
  suggestedApproach?: string;
  prerequisites: string[];
}

/**
 * Complete intent analysis result
 * This is the structured output passed to the Planning Engine
 */
export interface IntentAnalysisResult {
  // Core intent
  primaryGoal: string;
  secondaryGoals: string[];
  intentTypes: IntentClassification[];
  overallConfidence: ConfidenceLevel;

  // Requirements
  requirements: Requirement[];
  hiddenRequirements: Requirement[];

  // Constraints
  constraints: Constraint[];

  // Scope
  affectedScope: Scope;
  estimatedAffectedFiles: string[];
  affectedFeatures: string[];

  // Architecture
  architecturalImpact: string;
  dependencies: DependencyAnalysis;

  // Risks
  risks: Risk[];

  // Clarification
  clarificationNeeded: boolean;
  clarificationQuestions: ClarificationQuestion[];

  // Estimation
  complexity: Complexity;
  tokenEstimation: TokenEstimation;

  // Recommendations
  recommendedContext: ContextRequirement;
  recommendedModels: ModelRecommendation[];
  executionStrategy: ExecutionStrategy;

  // Metadata
  planningMetadata: PlanningMetadata;
  timestamp: number;
  analysisId: string;
  userId?: string;
  workspaceId?: string;
}

/**
 * Input for intent analysis
 */
export interface IntentAnalysisInput {
  userMessage: string;
  workspaceContext: WorkspaceContext;
  conversationHistory?: Array<{ role: string; content: string }>;
  userId?: string;
  workspaceId?: string;
}

/**
 * Feature detection result
 */
export interface FeatureDetection {
  exists: boolean;
  location?: string;
  description?: string;
  recommendation?: "reuse" | "extend" | "replace" | "create_new";
}

/**
 * Duplicate detection result
 */
export interface DuplicateDetection {
  hasDuplicates: boolean;
  duplicates: Array<{
    type: "api" | "component" | "hook" | "service" | "utility" | "logic" | "feature";
    location: string;
    similarity: number;
  }>;
  recommendations: string[];
}
