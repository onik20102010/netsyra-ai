import {
  PlannerInput,
  PlannerOutput,
  IntentAnalysis,
  IntentType,
  ExecutionPlan,
  CandidatePlan,
  UtilityScore,
  CostEstimate,
  RiskAssessment,
} from "./planner-types";
import { GoalManager } from "./goals/goal-manager";
import { TaskDecomposer } from "./decomposition/task-decomposer";
import { DependencyBuilder } from "./decomposition/dependency-builder";
import { MetaPlanner } from "./planning/meta-planner";
import { DecisionEngine } from "./planning/decision-engine";
import { WorkflowCompiler } from "./planning/workflow-compiler";

export class Planner {
  private goalManager: GoalManager;
  private metaPlanner: MetaPlanner;
  private decisionEngine: DecisionEngine;
  private workflowCompiler: WorkflowCompiler;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.goalManager = new GoalManager(userId);
    this.metaPlanner = new MetaPlanner();
    this.decisionEngine = new DecisionEngine();
    this.workflowCompiler = new WorkflowCompiler();
  }

  public async process(input: PlannerInput): Promise<PlannerOutput> {
    const intentAnalysis = this.analyzeIntent(input.userMessage);

    const goal = this.goalManager.createGoal(
      intentAnalysis.goalDescription,
      input.userMessage
    );

    if (intentAnalysis.planningLevel === 0 || !intentAnalysis.needsPlanning) {
      return {
        intentAnalysis,
        goal,
        directResponse: "I'll help you with that directly.",
      };
    }

    const strategies = this.metaPlanner.selectStrategy(input, intentAnalysis);
    const candidatePlans: CandidatePlan[] = [];

    for (const strategy of strategies) {
      const tasks = TaskDecomposer.decomposeGoal(goal, intentAnalysis);
      const graph = DependencyBuilder.buildTaskGraph(tasks);
      const estimate = this.estimateCost(tasks);
      const risk = this.assessRisk(tasks);

      candidatePlans.push({
        id: crypto.randomUUID(),
        tasks,
        graph,
        strategy,
        utilityScore: {
          accuracy: 0.8,
          cost: 0.7,
          latency: 0.8,
          risk: 1 - risk.riskLevel,
          userPreference: 0.5,
          total: 0.75,
        },
        costEstimate: estimate,
        riskAssessment: risk,
        successProbability: 0.85,
      });
    }

    for (const plan of candidatePlans) {
      plan.utilityScore = this.decisionEngine.calculateUtility(plan);
    }

    const selectedPlan = this.decisionEngine.selectBestPlan(candidatePlans);
    const executionDAG = this.workflowCompiler.compile(selectedPlan.tasks);

    const finalPlan: ExecutionPlan = {
      id: selectedPlan.id,
      goal,
      tasks: selectedPlan.tasks,
      taskGraph: selectedPlan.graph,
      executionDAG,
      strategy: selectedPlan.strategy,
      strategiesUsed: strategies,
      planningLevel: intentAnalysis.planningLevel,
      estimatedTotalTime: selectedPlan.costEstimate.time,
      estimatedTotalTokens: selectedPlan.costEstimate.tokens,
      estimatedTotalCost: selectedPlan.costEstimate.money,
      riskAssessment: selectedPlan.riskAssessment,
      createdAt: new Date(),
    };

    return {
      intentAnalysis,
      goal,
      plan: finalPlan,
      candidatePlans,
    };
  }

  private analyzeIntent(userMessage: string): IntentAnalysis {
    const lower = userMessage.toLowerCase();

    let intentType: IntentType = "unknown";
    let difficulty: IntentAnalysis["difficulty"] = "low";
    let estimatedSteps = 1;
    let needsTools = false;
    let needsPlanning = false;
    let needsMemory = true;
    let needsReasoning = false;
    let needsReflection = false;
    let planningLevel: 0 | 1 | 2 | 3 | 4 = 0;

    if (lower.includes("build") || lower.includes("create") || lower.includes("code")) {
      intentType = "build_software";
      difficulty = "high";
      estimatedSteps = 10;
      needsTools = true;
      needsPlanning = true;
      needsReasoning = true;
      needsReflection = true;
      planningLevel = 3;
    } else if (lower.includes("debug") || lower.includes("fix")) {
      intentType = "debug_code";
      difficulty = "high";
      estimatedSteps = 8;
      needsTools = true;
      needsPlanning = true;
      needsReasoning = true;
      needsReflection = true;
      planningLevel = 2;
    } else if (lower.includes("research") || lower.includes("find")) {
      intentType = "research";
      difficulty = "medium";
      estimatedSteps = 5;
      needsTools = true;
      needsPlanning = true;
      needsReasoning = true;
      planningLevel = 1;
    } else if (lower.length > 200 || lower.includes("explain") || lower.includes("detail")) {
      intentType = "analysis";
      difficulty = "medium";
      estimatedSteps = 3;
      needsPlanning = true;
      planningLevel = 1;
    } else {
      intentType = "simple_question";
      difficulty = "low";
      estimatedSteps = 1;
      planningLevel = 0;
    }

    return {
      intentType,
      goalDescription: userMessage.slice(0, 100),
      difficulty,
      estimatedSteps,
      needsTools,
      needsPlanning,
      needsMemory,
      needsReasoning,
      needsReflection,
      planningLevel,
    };
  }

  private estimateCost(tasks: any[]): CostEstimate {
    return {
      time: tasks.length * 60,
      money: tasks.length * 0.05,
      tokens: tasks.length * 1000,
      risk: 0.2,
      complexity: tasks.length * 0.5,
    };
  }

  private assessRisk(tasks: any[]): RiskAssessment {
    return {
      riskLevel: 0.3,
      riskFactors: [],
      mitigationSteps: [],
    };
  }
}
