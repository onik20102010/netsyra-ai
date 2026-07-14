/**
 * Core type definitions for the Autonomous Learning & Self-Improvement Layer
 */

// ============================================================================
// EXPERIENCE TYPES
// ============================================================================

export interface Experience {
  id: string;
  timestamp: number;
  userId?: string;
  conversationId: string;
  
  // Task Information
  goal: string;
  plan: Task[];
  result: TaskResult;
  
  // Execution Metrics
  duration: number; // seconds
  tokensUsed: number;
  modelsUsed: string[];
  toolsUsed: ToolUsage[];
  
  // Outcomes
  success: boolean;
  confidence: number; // 0-1
  mistakes: Mistake[];
  fixes: Fix[];
  
  // Context
  context: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface Task {
  id: string;
  description: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  duration?: number;
  tokens?: number;
}

export interface TaskResult {
  status: "success" | "failure" | "partial";
  output?: string;
  error?: string;
  quality: number; // 0-1
}

export interface ToolUsage {
  toolName: string;
  success: boolean;
  duration: number;
  attempts: number;
  error?: string;
}

export interface Mistake {
  type: MistakeType;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  cause?: string;
  timestamp: number;
}

export type MistakeType = 
  | "wrong_assumption"
  | "missing_memory"
  | "wrong_planner"
  | "wrong_tool"
  | "hallucination"
  | "safety_violation"
  | "timeout"
  | "other";

export interface Fix {
  mistakeId: string;
  description: string;
  applied: boolean;
  effective: boolean;
}

// ============================================================================
// REFLECTION TYPES
// ============================================================================

export interface Reflection {
  id: string;
  experienceId: string;
  timestamp: number;
  
  // Self-Review
  whatHappened: string;
  why: string;
  whatFailed: string[];
  whatSucceeded: string[];
  whatShouldImprove: string[];
  
  // Analysis
  rootCauses: RootCause[];
  lessons: Lesson[];
  confidence: number;
}

export interface RootCause {
  category: "planner" | "reasoning" | "memory" | "tool" | "policy" | "other";
  description: string;
  frequency: number;
  impact: "low" | "medium" | "high";
}

export interface Lesson {
  id: string;
  category: string;
  description: string;
  condition: string; // When to apply
  action: string; // What to do
  confidence: number;
  createdAt: number;
  lastUsed?: number;
  successRate?: number;
}

// ============================================================================
// SKILL TYPES
// ============================================================================

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  
  // Skill Definition
  trigger: string; // When to invoke
  workflow: WorkflowStep[];
  tools: string[];
  prompts: Record<string, string>;
  
  // Performance
  version: number;
  successRate: number;
  usageCount: number;
  lastUsed: number;
  createdAt: number;
  updatedAt: number;
  
  // Evolution
  history: SkillVersion[];
  confidence: number;
}

export interface WorkflowStep {
  step: number;
  action: string;
  tool?: string;
  prompt?: string;
  expectedOutput: string;
}

export interface SkillVersion {
  version: number;
  changes: string;
  successRate: number;
  timestamp: number;
}

// ============================================================================
// PATTERN TYPES
// ============================================================================

export interface Pattern {
  id: string;
  name: string;
  type: PatternType;
  description: string;
  
  // Pattern Definition
  conditions: PatternCondition[];
  frequency: number;
  confidence: number;
  
  // Impact
  affects: ("planner" | "reasoning" | "memory" | "tool_selection")[];
  recommendation: string;
  
  // Metadata
  discoveredAt: number;
  lastObserved: number;
  sampleSize: number;
}

export type PatternType = 
  | "sequence"
  | "clustering"
  | "anomaly"
  | "prediction"
  | "correlation";

export interface PatternCondition {
  field: string;
  operator: "equals" | "contains" | "greater_than" | "less_than" | "matches";
  value: any;
}

// ============================================================================
// POLICY TYPES
// ============================================================================

export interface Policy {
  id: string;
  name: string;
  type: PolicyType;
  description: string;
  
  // Policy Definition
  rules: PolicyRule[];
  priority: number;
  
  // Performance
  successRate: number;
  usageCount: number;
  lastUpdated: number;
  
  // Versioning
  version: number;
  active: boolean;
}

export type PolicyType = 
  | "routing"
  | "planner"
  | "reasoning"
  | "memory"
  | "tool_selection";

export interface PolicyRule {
  condition: string;
  action: string;
  weight: number;
  confidence: number;
}

// ============================================================================
// REWARD TYPES
// ============================================================================

export interface Reward {
  experienceId: string;
  timestamp: number;
  
  // Components
  accuracy: number;
  speed: number;
  userSatisfaction: number;
  cost: number;
  safety: number;
  
  // Overall
  overall: number;
  breakdown: RewardBreakdown;
}

export interface RewardBreakdown {
  accuracy: number;
  speed: number;
  userSatisfaction: number;
  cost: number;
  safety: number;
}

export interface Penalty {
  experienceId: string;
  timestamp: number;
  type: PenaltyType;
  severity: number;
  description: string;
}

export type PenaltyType = 
  | "hallucination"
  | "failed_task"
  | "unsafe_action"
  | "timeout"
  | "user_rejection"
  | "other";

// ============================================================================
// OPTIMIZATION TYPES
// ============================================================================

export interface Optimization {
  id: string;
  type: OptimizationType;
  target: string;
  description: string;
  
  // Before/After
  before: any;
  after: any;
  
  // Results
  improvement: number;
  confidence: number;
  timestamp: number;
  status: "proposed" | "testing" | "approved" | "rejected" | "deployed";
}

export type OptimizationType = 
  | "prompt"
  | "workflow"
  | "execution"
  | "planner"
  | "reasoning"
  | "memory";

// ============================================================================
// SIMULATION TYPES
// ============================================================================

export interface Simulation {
  id: string;
  name: string;
  description: string;
  
  // Configuration
  config: SimulationConfig;
  scenarios: SimulationScenario[];
  
  // Results
  results: SimulationResult[];
  timestamp: number;
  status: "pending" | "running" | "completed" | "failed";
}

export interface SimulationConfig {
  iterations: number;
  timeout: number;
  metrics: string[];
}

export interface SimulationScenario {
  name: string;
  input: any;
  expectedOutput?: any;
}

export interface SimulationResult {
  scenarioName: string;
  success: boolean;
  output: any;
  metrics: Record<string, number>;
  duration: number;
}

// ============================================================================
// EVOLUTION TYPES
// ============================================================================

export interface Evolution {
  id: string;
  type: EvolutionType;
  description: string;
  
  // Changes
  changes: EvolutionChange[];
  
  // Validation
  validation: EvolutionValidation;
  
  // Status
  status: "proposed" | "testing" | "approved" | "rejected" | "deployed";
  timestamp: number;
}

export type EvolutionType = 
  | "strategy"
  | "adaptation"
  | "meta_learning"
  | "self_improvement";

export interface EvolutionChange {
  component: string;
  changeType: "add" | "modify" | "remove";
  description: string;
  before?: any;
  after?: any;
}

export interface EvolutionValidation {
  benchmarksPassed: number;
  benchmarksTotal: number;
  regressionTestsPassed: number;
  regressionTestsTotal: number;
  safetyChecksPassed: number;
  safetyChecksTotal: number;
}

// ============================================================================
// LEARNING SESSION TYPES
// ============================================================================

export interface LearningSession {
  id: string;
  startTime: number;
  endTime?: number;
  status: "active" | "completed" | "failed";
  
  // Input
  experienceIds: string[];
  
  // Output
  reflections: Reflection[];
  lessons: Lesson[];
  skills: Skill[];
  patterns: Pattern[];
  policyUpdates: Policy[];
  optimizations: Optimization[];
  
  // Metrics
  metrics: LearningMetrics;
}

export interface LearningMetrics {
  experiencesProcessed: number;
  reflectionsGenerated: number;
  lessonsLearned: number;
  skillsExtracted: number;
  patternsDiscovered: number;
  policiesUpdated: number;
  optimizationsProposed: number;
  duration: number;
}

// ============================================================================
// LEARNING POLICY TYPES
// ============================================================================

export interface LearningPolicy {
  // When to learn
  trigger: "immediate" | "batch" | "scheduled" | "manual";
  
  // What to learn
  focus: LearningFocus[];
  
  // How to learn
  strategy: LearningStrategy;
  
  // Governance
  requireApproval: boolean;
  approvalThreshold: number;
  safetyChecks: boolean;
  benchmarking: boolean;
}

export type LearningFocus = 
  | "experience"
  | "reflection"
  | "skills"
  | "patterns"
  | "policies"
  | "optimization"
  | "evolution";

export type LearningStrategy = 
  | "conservative"
  | "moderate"
  | "aggressive"
  | "custom";

// ============================================================================
// METRICS DASHBOARD TYPES
// ============================================================================

export interface LearningMetricsDashboard {
  skillSuccessRate: number;
  plannerEfficiency: number;
  reasoningAccuracy: number;
  memoryRetrievalPrecision: number;
  toolReliability: Record<string, ToolReliability>;
  userSatisfaction: number;
  averageCost: number;
  averageLatency: number;
  
  // Trends
  trends: MetricsTrend[];
}

export interface ToolReliability {
  successRate: number;
  averageLatency: number;
  failureRate: number;
}

export interface MetricsTrend {
  metric: string;
  value: number;
  timestamp: number;
}

// ============================================================================
// USER PREFERENCE TYPES
// ============================================================================

export interface UserPreference {
  userId: string;
  preference: string;
  value: any;
  
  // Confidence
  confidence: number;
  stability: number; // How stable this preference is over time
  
  // Metadata
  firstObserved: number;
  lastObserved: number;
  observationCount: number;
  consentGiven?: boolean;
}
