// Main AAI exports

// Core runtime
export { AAIRuntime, aaiRuntime } from "./runtime";
export { Executive } from "./core/executive";
export { Workspace } from "./core/workspace";

// LLM
export { LLMRouter } from "./llm/router";

// Planner
export { Planner } from "./planner/planner";
export { GoalManager } from "./planner/goals/goal-manager";
export { GoalFactory } from "./planner/goals/goal";
export { GoalValidator } from "./planner/goals/goal-validator";
export { GoalPriorityManager } from "./planner/goals/goal-priority";
export { GoalLifecycleManager } from "./planner/goals/goal-lifecycle";
export { TaskDecomposer } from "./planner/decomposition/task-decomposer";
export { TaskSplitter } from "./planner/decomposition/splitter";
export { DependencyBuilder } from "./planner/decomposition/dependency-builder";
export { MetaPlanner } from "./planner/planning/meta-planner";
export { DecisionEngine } from "./planner/planning/decision-engine";
export { WorkflowCompiler } from "./planner/planning/workflow-compiler";
export * from "./planner/planner-types";

// Memory
export { MemoryManager } from "./memory/memory-manager";
export * from "./memory/memory-types";

// Reasoning
export { ReasoningManager } from "./reasoning/manager";
export { ReasoningPipeline } from "./reasoning/pipeline";
export { ReasoningSelector } from "./reasoning/selector";
export { ConfidenceEngine } from "./reasoning/confidence";
export { DeductionEngine } from "./reasoning/symbolic/deduction";
export { AbductionEngine } from "./reasoning/symbolic/abduction";
export { CommonsenseEngine } from "./reasoning/symbolic/commonsense";
export { CausalEngine } from "./reasoning/symbolic/causal";
export { ProgrammingEngine } from "./reasoning/domain/programming";
export * from "./reasoning/types";

// Types and config
export * from "./types";
export { AAI_CONFIG } from "./config";
export * from "./constants";

// Learning Layer (Phase 5 - Autonomous Learning & Self-Improvement)
export {
  LearningManager,
  learningManager,
  LearningEngine,
  learningEngine,
  Learner,
  learner,
  LearningPolicyManager,
  DEFAULT_LEARNING_POLICY,
  LearningSessionManager,
  ExperienceRecorder,
  ExperienceCollector,
  ExperienceReplay,
  ExperienceAnalyzer,
  ExperienceRanker,
  ReflectionEngine,
  SelfReview,
  MistakeAnalyzer,
  ImprovementGenerator,
  LessonGenerator,
  SkillExtractor,
  SkillCompiler,
  SkillRegistry,
  SkillOptimizer,
  SkillVersioning,
  PatternDetector,
  PatternClustering,
  SequenceAnalyzer,
  AnomalyDetector,
  PatternPredictor,
  RoutingPolicy,
  PlannerPolicy,
  ReasoningPolicy,
  MemoryPolicy,
  ToolSelectionPolicy,
  RewardModel,
  RewardScorer,
  PenaltySystem,
  RewardEvaluator,
  RewardMetricsTracker,
  PromptOptimizer,
  WorkflowOptimizer,
  ExecutionOptimizer,
  PlannerOptimizer,
  ReasoningOptimizer,
  MemoryOptimizer,
  SimulationSandbox,
  ExperimentsManager,
  BenchmarkingSystem,
  ValidationSystem,
  StrategyEvolution,
  AdaptationSystem,
  MetaLearningSystem,
  EvolutionEngine,
  evolutionEngine,
} from "./learning";

// Export learning types separately to avoid conflicts
export type {
  Experience,
  Reflection,
  Lesson,
  Pattern,
  Policy,
  Reward,
  Penalty,
  Optimization,
  Simulation,
  Evolution,
  LearningSession,
  LearningPolicy,
  LearningMetrics,
  LearningMetricsDashboard,
  UserPreference,
  LearningExperience,
  LearningTask,
  LearningTaskResult,
  LearningToolUsage,
  LearningMistake,
  LearningFix,
  LearningRootCause,
  LearningWorkflowStep,
  LearningSkillVersion,
  LearningPatternCondition,
  LearningPolicyRule,
  LearningRewardBreakdown,
  LearningSimulationConfig,
  LearningSimulationScenario,
  LearningSimulationResult,
  LearningEvolutionChange,
  LearningEvolutionValidation,
  PatternCluster,
  SequencePattern,
  Anomaly,
  Prediction,
  CompiledSkill,
  Experiment,
  ExperimentVariant,
  ExperimentResult,
  Benchmark,
  BenchmarkTask,
  BenchmarkResult,
  RewardMetrics,
  Adaptation,
  LearningAlgorithm,
} from "./learning";
