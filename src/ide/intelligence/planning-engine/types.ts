/**
 * Planning & Task Decomposition Engine Types
 * 
 * This engine receives structured output from the Intent Engine
 * and transforms it into a complete execution strategy.
 * 
 * It must NEVER generate code, edit files, or execute tools.
 * Its only purpose is to produce the best possible execution plan.
 */

import type { IntentAnalysisResult } from "@/ide/intelligence/intent-engine";

/**
 * Task category
 */
export type TaskCategory =
  | "workspace_analysis"
  | "planning"
  | "context"
  | "search"
  | "read_file"
  | "write_file"
  | "edit_file"
  | "delete_file"
  | "rename_file"
  | "move_file"
  | "create_file"
  | "patch"
  | "generate"
  | "verify"
  | "review"
  | "research"
  | "terminal"
  | "git"
  | "testing"
  | "documentation"
  | "database"
  | "api"
  | "frontend"
  | "backend"
  | "configuration"
  | "deployment"
  | "memory"
  | "tool_call";

/**
 * Task status
 */
export type TaskStatus =
  | "pending"
  | "ready"
  | "running"
  | "completed"
  | "failed"
  | "blocked"
  | "skipped"
  | "cancelled";

/**
 * Task priority
 */
export type TaskPriority = "critical" | "high" | "medium" | "low";

/**
 * Task complexity
 */
export type TaskComplexity = "very_small" | "small" | "medium" | "large" | "enterprise";

/**
 * Execution strategy
 */
export type ExecutionStrategy =
  | "simple_edit"
  | "patch"
  | "full_feature"
  | "large_refactor"
  | "incremental_implementation"
  | "parallel_implementation";

/**
 * Tool requirement
 */
export type ToolRequirement =
  | "filesystem"
  | "search"
  | "terminal"
  | "git"
  | "package_manager"
  | "database"
  | "browser"
  | "diagnostics";

/**
 * Verification method
 */
export type VerificationMethod =
  | "lint"
  | "typescript"
  | "unit_tests"
  | "integration_tests"
  | "formatting"
  | "security_checks"
  | "dependency_checks"
  | "build_verification"
  | "browser_testing"
  | "regression_testing";

/**
 * Individual task metadata
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  complexity: TaskComplexity;
  estimatedDuration: string;
  estimatedTokens: number;
  dependencies: string[];
  requiredContext: ContextRequirement;
  expectedOutput: string;
  possibleRisks: string[];
  verification: string[];
  rollbackStrategy: string;
  completionCriteria: string[];
  status: TaskStatus;
  retryPolicy: RetryPolicy;
  executionBatch?: number;
  canParallelize: boolean;
  createdAt: number;
  updatedAt: number;
}

/**
 * Context requirement for a task
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
 * Retry policy for a task
 */
export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
  retryableErrors: string[];
}

/**
 * Dependency between tasks
 */
export interface TaskDependency {
  fromTaskId: string;
  toTaskId: string;
  type: "requires" | "blocks" | "enables" | "depends_on";
  reason: string;
}

/**
 * Parallel execution group
 */
export interface ParallelGroup {
  batchId: string;
  batchNumber: number;
  taskIds: string[];
  reason: string;
  estimatedDuration: string;
  estimatedTokens: number;
}

/**
 * Blocker preventing execution
 */
export interface Blocker {
  id: string;
  type: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  resolution?: string;
  taskIds: string[];
}

/**
 * Risk in the plan
 */
export interface PlanRisk {
  id: string;
  type: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  probability: "high" | "medium" | "low";
  mitigation: string;
  affectedTasks: string[];
}

/**
 * Token budget for the plan
 */
export interface TokenBudget {
  planning: number;
  context: number;
  generation: number;
  verification: number;
  patch: number;
  review: number;
  streaming: number;
  total: number;
  contingency: number;
}

/**
 * Verification strategy
 */
export interface VerificationStrategy {
  methods: VerificationMethod[];
  order: number[];
  requiredFiles: string[];
  expectedOutcomes: string[];
  fallbackStrategy: string;
}

/**
 * Rollback strategy
 */
export interface RollbackStrategy {
  steps: string[];
  backupFiles: string[];
  restoreCommands: string[];
  recoveryTime: string;
}

/**
 * Reusable component found in project
 */
export interface ReusableComponent {
  id: string;
  type: "hook" | "utility" | "service" | "api" | "component" | "style" | "helper" | "function" | "class";
  name: string;
  location: string;
  description: string;
  usage: string;
  confidence: number;
}

/**
 * Planning memory summary
 */
export interface PlanningMemory {
  goal: string;
  completedTasks: string[];
  pendingTasks: string[];
  decisions: string[];
  architectureDecisions: string[];
  constraints: string[];
  updatedAt: number;
}

/**
 * Execution plan output
 */
export interface ExecutionPlan {
  planId: string;
  version: number;
  timestamp: number;
  userId?: string;
  workspaceId?: string;

  projectGoal: string;
  executionStrategy: ExecutionStrategy;
  implementationStrategy: string;

  tasks: Task[];
  dependencies: TaskDependency[];
  executionOrder: string[];
  parallelGroups: ParallelGroup[];

  blockers: Blocker[];
  risks: PlanRisk[];
  contextRequirements: ContextRequirement;
  tokenBudget: TokenBudget;
  verificationStrategy: VerificationStrategy;
  rollbackStrategy: RollbackStrategy;
  architectureNotes: string[];
  planningSummary: string;
  executionMetadata: ExecutionMetadata;
  planningConfidence: number;
  reusableComponents: ReusableComponent[];
  isIncremental: boolean;
  previousPlanId?: string;
}

/**
 * Execution metadata
 */
export interface ExecutionMetadata {
  estimatedTotalDuration: string;
  estimatedTotalTokens: number;
  maxParallelTasks: number;
  requiresUserInput: boolean;
  canAutostart: boolean;
  needsApproval: boolean;
  milestoneCount: number;
  milestoneBatches: MilestoneBatch[];
}

/**
 * Milestone batch for large plans
 */
export interface MilestoneBatch {
  milestoneId: string;
  title: string;
  description: string;
  batchNumbers: number[];
  tasks: string[];
  estimatedDuration: string;
  estimatedTokens: number;
  completionCriteria: string[];
}

/**
 * Input for planning engine
 */
export interface PlanningEngineInput {
  intentAnalysis: IntentAnalysisResult;
  previousPlan?: ExecutionPlan;
  workspaceSummary?: string;
  knowledgeGraphSummary?: string;
  conversationSummary?: string;
  projectMemorySummary?: string;
  currentBranch?: string;
  openFiles?: string[];
  currentSelection?: string;
  currentErrors?: string[];
  recentChanges?: string[];
  userId?: string;
  workspaceId?: string;
}

/**
 * Plan diff for incremental updates
 */
export interface PlanDiff {
  added: Task[];
  removed: Task[];
  modified: Task[];
  unchanged: Task[];
  newDependencies: TaskDependency[];
  removedDependencies: TaskDependency[];
  updatedBlockers: Blocker[];
  updatedRisks: PlanRisk[];
}
