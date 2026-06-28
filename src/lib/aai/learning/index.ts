/**
 * Autonomous Learning & Self-Improvement Layer
 * Phase 5 of the AAI System
 * 
 * This layer enables the AAI to learn from its own experiences,
 * continuously improve its performance, and adapt to new situations.
 */

// Core types (renamed to avoid conflicts with existing AAI types)
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
} from "./learning-types";

// Rename conflicting types
export type { 
  Experience as LearningExperience,
  Task as LearningTask,
  TaskResult as LearningTaskResult,
  ToolUsage as LearningToolUsage,
  Mistake as LearningMistake,
  Fix as LearningFix,
  RootCause as LearningRootCause,
  WorkflowStep as LearningWorkflowStep,
  SkillVersion as LearningSkillVersion,
  PatternCondition as LearningPatternCondition,
  PolicyRule as LearningPolicyRule,
  RewardBreakdown as LearningRewardBreakdown,
  SimulationConfig as LearningSimulationConfig,
  SimulationScenario as LearningSimulationScenario,
  SimulationResult as LearningSimulationResult,
  EvolutionChange as LearningEvolutionChange,
  EvolutionValidation as LearningEvolutionValidation,
} from "./learning-types";

// Core components
export { LearningManager, learningManager } from "./manager";
export { LearningEngine, learningEngine } from "./engine";
export { Learner, learner } from "./learner";

// Policy and session management
export { LearningPolicyManager, DEFAULT_LEARNING_POLICY } from "./learning-policy";
export { LearningSessionManager } from "./learning-session";

// Experience system
export { ExperienceRecorder } from "./experience/recorder";
export { ExperienceCollector } from "./experience/collector";
export { ExperienceReplay } from "./experience/replay";
export { ExperienceAnalyzer } from "./experience/analyzer";
export { ExperienceRanker } from "./experience/ranking";

// Reflection system
export { ReflectionEngine } from "./reflection/reflection";
export { SelfReview } from "./reflection/self-review";
export { MistakeAnalyzer } from "./reflection/mistake-analysis";
export { ImprovementGenerator } from "./reflection/improvement";
export { LessonGenerator } from "./reflection/lesson-generator";

// Skills system
export { SkillExtractor } from "./skills/extractor";
export { SkillCompiler } from "./skills/compiler";
export type { CompiledSkill } from "./skills/compiler";
export { SkillRegistry } from "./skills/registry";
export { SkillOptimizer } from "./skills/optimizer";
export { SkillVersioning } from "./skills/versioning";

// Patterns system
export { PatternDetector } from "./patterns/detector";
export { PatternClustering } from "./patterns/clustering";
export type { PatternCluster } from "./patterns/clustering";
export { SequenceAnalyzer } from "./patterns/sequence";
export type { SequencePattern } from "./patterns/sequence";
export { AnomalyDetector } from "./patterns/anomaly";
export type { Anomaly } from "./patterns/anomaly";
export { PatternPredictor } from "./patterns/prediction";
export type { Prediction } from "./patterns/prediction";

// Policies system
export { RoutingPolicy } from "./policies/routing";
export { PlannerPolicy } from "./policies/planner";
export { ReasoningPolicy } from "./policies/reasoning";
export { MemoryPolicy } from "./policies/memory";
export { ToolSelectionPolicy } from "./policies/tool-selection";

// Rewards system
export { RewardModel } from "./rewards/reward-model";
export { RewardScorer } from "./rewards/scorer";
export { PenaltySystem } from "./rewards/penalties";
export { RewardEvaluator } from "./rewards/evaluator";
export { RewardMetricsTracker } from "./rewards/metrics";
export type { RewardMetrics } from "./rewards/metrics";

// Optimization system
export { PromptOptimizer } from "./optimization/prompt";
export { WorkflowOptimizer } from "./optimization/workflow";
export { ExecutionOptimizer } from "./optimization/execution";
export { PlannerOptimizer } from "./optimization/planner";
export { ReasoningOptimizer } from "./optimization/reasoning";
export { MemoryOptimizer } from "./optimization/memory";

// Simulation system
export { SimulationSandbox } from "./simulation/sandbox";
export { ExperimentsManager } from "./simulation/experiments";
export type { Experiment, ExperimentVariant, ExperimentResult } from "./simulation/experiments";
export { BenchmarkingSystem } from "./simulation/benchmarking";
export type { Benchmark, BenchmarkTask, BenchmarkResult } from "./simulation/benchmarking";
export { ValidationSystem } from "./simulation/validation";

// Evolution system
export { StrategyEvolution } from "./evolution/strategy";
export { AdaptationSystem } from "./evolution/adaptation";
export type { Adaptation } from "./evolution/adaptation";
export { MetaLearningSystem } from "./evolution/meta-learning";
export type { LearningAlgorithm } from "./evolution/meta-learning";
export { EvolutionEngine, evolutionEngine } from "./evolution/self-improvement";
