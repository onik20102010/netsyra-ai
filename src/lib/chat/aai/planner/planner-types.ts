// ============ Intent Analysis Types ============
export type IntentType =
  | "simple_question"
  | "simple_task"
  | "build_software"
  | "debug_code"
  | "research"
  | "analysis"
  | "create_content"
  | "unknown";

export interface IntentAnalysis {
  intentType: IntentType;
  goalDescription: string;
  difficulty: "low" | "medium" | "high" | "very_high";
  estimatedSteps: number;
  needsTools: boolean;
  needsPlanning: boolean;
  needsMemory: boolean;
  needsReasoning: boolean;
  needsReflection: boolean;
  planningLevel: 0 | 1 | 2 | 3 | 4;
}

// ============ Goal Types ============
export type GoalStatus =
  | "pending"
  | "active"
  | "in_progress"
  | "completed"
  | "failed"
  | "paused"
  | "cancelled";

export type GoalPriority = "critical" | "high" | "medium" | "low" | "trivial";

export interface Goal {
  id: string;
  title: string;
  description: string;
  priority: GoalPriority;
  deadline?: Date;
  parentGoalId?: string;
  childGoalIds: string[];
  status: GoalStatus;
  confidence: number;
  progress: number;
  dependencies: string[];
  createdAt: Date;
  updatedAt: Date;
  estimatedComplexity: number;
  estimatedTasks: string[];
}

// ============ Task Types ============
export type TaskStatus =
  | "pending"
  | "waiting"
  | "ready"
  | "in_progress"
  | "completed"
  | "failed"
  | "skipped";

export type TaskType =
  | "llm_call"
  | "tool_call"
  | "agent_task"
  | "memory_read"
  | "memory_write"
  | "plan_adjustment";

export interface Task {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  status: TaskStatus;
  dependencies: string[];
  priority: number;
  priorityLevel: GoalPriority;
  assignedCapability: "llm" | "browser" | "terminal" | "memory" | "code" | "agent";
  estimatedTime?: number;
  estimatedCost?: number;
  estimatedTokens?: number;
  estimatedRisk?: number;
  estimatedConfidence?: number;
  result?: any;
  error?: string;
  attempts: number;
  maxAttempts: number;
  retryable: boolean;
  rollbackSteps?: string[];
  preconditions?: string[];
  effects?: string[];
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

// ============ Planning Strategy Types ============
export type PlanningStrategy =
  | "htn"
  | "goap"
  | "forward"
  | "backward"
  | "hybrid"
  | "tree_search"
  | "graph_planning"
  | "constraint"
  | "monte_carlo"
  | "utility"
  | "risk"
  | "scenario"
  | "recursive"
  | "adaptive"
  | "experience"
  | "template"
  | "parallel"
  | "probabilistic"
  | "resource"
  | "deadline";

// ============ Dependency Graph Types ============
export interface TaskGraphNode {
  id: string;
  task: Task;
  inDegree: number;
  outDegree: number;
  level: number;
}

export interface TaskGraphEdge {
  from: string;
  to: string;
  type: "required" | "optional" | "parallel" | "sequential";
}

export interface TaskDependencyGraph {
  nodes: TaskGraphNode[];
  edges: TaskGraphEdge[];
  topologicalOrder: string[];
}

// ============ Execution DAG Types ============
export interface ExecutionDAG extends TaskDependencyGraph {
  compiledAt: Date;
  optimized: boolean;
  parallelBranches: string[][];
}

// ============ Validation Types ============
export interface ValidationResult {
  valid: boolean;
  issues: string[];
  suggestions: string[];
  confidenceScore: number;
  safetyScore: number;
  feasibilityScore: number;
}

// ============ Execution Monitor Types ============
export interface ExecutionProgress {
  completedTasks: number;
  totalTasks: number;
  percentageComplete: number;
  currentTaskId?: string;
  elapsedTime: number;
  failedTasks: number;
  totalCost: number;
  totalTokens: number;
}

// ============ Reflection Types ============
export interface ReflectionResult {
  success: boolean;
  efficiencyScore: number;
  failures: string[];
  lessonsLearned: string[];
  improvements: string[];
}

// ============ HTN Types ============
export interface HTNCompoundTask {
  id: string;
  name: string;
  methods: HTNMethod[];
}

export interface HTNMethod {
  id: string;
  name: string;
  preconditions: string[];
  subtasks: HTNTask[];
}

export type HTNTask = HTNPrimitiveTask | HTNCompoundTask;

export interface HTNPrimitiveTask {
  id: string;
  name: string;
  action: string;
  preconditions: string[];
  effects: string[];
}

// ============ GOAP Types ============
export interface GOAPAction {
  id: string;
  name: string;
  preconditions: Map<string, boolean>;
  effects: Map<string, boolean>;
  cost: number;
  reward: number;
}

export interface GOAPState {
  [key: string]: boolean;
}

// ============ Constraint Types ============
export interface Constraint {
  id: string;
  type: "required" | "forbidden" | "limit";
  description: string;
  check: (state: any) => boolean;
}

export interface ConstraintViolation {
  constraintId: string;
  description: string;
}

// ============ Utility/Cost/Risk Types ============
export interface UtilityScore {
  accuracy: number;
  cost: number;
  latency: number;
  risk: number;
  userPreference: number;
  total: number;
}

export interface CostEstimate {
  time: number;
  money: number;
  tokens: number;
  risk: number;
  complexity: number;
}

export interface RiskAssessment {
  riskLevel: number;
  riskFactors: string[];
  mitigationSteps: string[];
}

// ============ Candidate Plan Types ============
export interface CandidatePlan {
  id: string;
  tasks: Task[];
  graph: TaskDependencyGraph;
  strategy: PlanningStrategy;
  utilityScore: UtilityScore;
  costEstimate: CostEstimate;
  riskAssessment: RiskAssessment;
  successProbability: number;
}

// ============ Resource Types ============
export interface ResourceState {
  models: string[];
  tools: string[];
  cpu: number;
  memory: number;
  apiBudget: number;
  tokenBudget: number;
  rateLimits: Record<string, number>;
}

// ============ Scenario Types ============
export interface Scenario {
  id: string;
  name: string;
  description: string;
  outcome: "success" | "partial_success" | "failure" | "unexpected";
  contingencyPlan?: ExecutionPlan;
}

// ============ Rollback Types ============
export interface RollbackPlan {
  taskId: string;
  steps: string[];
  triggers: string[];
}

// ============ Plan Template Types ============
export interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  triggerKeywords: string[];
  tasks: Task[];
  graph: TaskDependencyGraph;
  successCount: number;
  usageCount: number;
  lastUsed: Date;
  effectivenessScore: number;
}

// ============ Execution Plan Types ============
export interface ExecutionPlan {
  id: string;
  goal: Goal;
  tasks: Task[];
  taskGraph: TaskDependencyGraph;
  executionDAG?: ExecutionDAG;
  strategy: PlanningStrategy;
  strategiesUsed: PlanningStrategy[];
  planningLevel: number;
  estimatedTotalTime: number;
  estimatedTotalTokens: number;
  estimatedTotalCost: number;
  riskAssessment?: RiskAssessment;
  scenarios?: Scenario[];
  rollbackPlans?: RollbackPlan[];
  templateUsed?: PlanTemplate;
  createdAt: Date;
}

// ============ Planner Request Types ============
export interface PlannerInput {
  userId: string;
  userMessage: string;
  conversationId?: string;
  context?: any;
  resources?: Partial<ResourceState>;
  deadline?: Date;
}

export interface PlannerOutput {
  intentAnalysis: IntentAnalysis;
  goal: Goal;
  plan?: ExecutionPlan;
  candidatePlans?: CandidatePlan[];
  directResponse?: string;
  reflection?: ReflectionResult;
}
