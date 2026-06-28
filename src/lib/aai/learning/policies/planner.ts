/**
 * Planner Policy
 * Manages planning strategy selection
 */

import { Policy, Experience } from "../learning-types";

export class PlannerPolicy {
  private policy: Policy;
  private strategyPerformance: Map<string, { success: number; total: number }> = new Map();

  constructor() {
    this.policy = {
      id: crypto.randomUUID(),
      name: "Planner Policy",
      type: "planner",
      description: "Selects the best planning strategy for different task types",
      rules: [
        {
          condition: "task_type == 'development'",
          action: "backward_planning",
          weight: 0.95,
          confidence: 0.9,
        },
        {
          condition: "task_type == 'analysis'",
          action: "forward_planning",
          weight: 0.61,
          confidence: 0.6,
        },
        {
          condition: "task_type == 'general'",
          action: "hybrid_planning",
          weight: 0.98,
          confidence: 0.95,
        },
      ],
      priority: 1,
      successRate: 0.85,
      usageCount: 0,
      lastUpdated: Date.now(),
      version: 1,
      active: true,
    };
  }

  /**
   * Get planning strategy
   */
  public getStrategy(task: any): string {
    this.policy.usageCount++;

    const taskType = this.classifyTaskType(task);

    for (const rule of this.policy.rules) {
      if (this.matchesCondition(rule.condition, { task_type: taskType })) {
        return rule.action;
      }
    }

    return "hybrid_planning"; // Default
  }

  /**
   * Classify task type
   */
  private classifyTaskType(task: any): string {
    const goal = (task.goal || "").toLowerCase();

    if (goal.includes("build") || goal.includes("create") || goal.includes("implement")) {
      return "development";
    }

    if (goal.includes("analyze") || goal.includes("review") || goal.includes("examine")) {
      return "analysis";
    }

    return "general";
  }

  /**
   * Check if condition matches
   */
  private matchesCondition(condition: string, context: any): boolean {
    const [field, operator, value] = condition.split(" ");

    if (operator === "==") {
      return context[field] === value.replace(/'/g, "");
    }

    return false;
  }

  /**
   * Update policy based on experience
   */
  public update(experience: Experience): void {
    const strategy = this.getStrategy(experience);
    const success = experience.success ? 1 : 0;

    const perf = this.strategyPerformance.get(strategy) || { success: 0, total: 0 };
    perf.success += success;
    perf.total += 1;
    this.strategyPerformance.set(strategy, perf);

    // Update rule weights based on performance
    this.policy.rules.forEach(rule => {
      const action = rule.action;
      const perf = this.strategyPerformance.get(action);
      if (perf && perf.total > 0) {
        rule.confidence = perf.success / perf.total;
        rule.weight = rule.confidence;
      }
    });

    // Update overall success rate
    const allPerf = Array.from(this.strategyPerformance.values());
    const totalSuccess = allPerf.reduce((sum, p) => sum + p.success, 0);
    const totalTasks = allPerf.reduce((sum, p) => sum + p.total, 0);
    this.policy.successRate = totalTasks > 0 ? totalSuccess / totalTasks : 0;

    this.policy.lastUpdated = Date.now();
  }

  /**
   * Get policy
   */
  public getPolicy(): Policy {
    return { ...this.policy };
  }

  /**
   * Get best performing strategy
   */
  public getBestStrategy(): string {
    let best = "hybrid_planning";
    let bestRate = 0;

    this.strategyPerformance.forEach((perf, strategy) => {
      const rate = perf.total > 0 ? perf.success / perf.total : 0;
      if (rate > bestRate) {
        bestRate = rate;
        best = strategy;
      }
    });

    return best;
  }
}
