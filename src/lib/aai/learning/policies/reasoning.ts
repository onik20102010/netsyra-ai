/**
 * Reasoning Policy
 * Manages reasoning strategy selection
 */

import { Policy, Experience } from "../learning-types";

export class ReasoningPolicy {
  private policy: Policy;
  private strategyPerformance: Map<string, { success: number; total: number }> = new Map();

  constructor() {
    this.policy = {
      id: crypto.randomUUID(),
      name: "Reasoning Policy",
      type: "reasoning",
      description: "Selects the best reasoning strategy for different problem types",
      rules: [
        {
          condition: "problem_type == 'logical'",
          action: "deductive_reasoning",
          weight: 0.9,
          confidence: 0.85,
        },
        {
          condition: "problem_type == 'creative'",
          action: "abductive_reasoning",
          weight: 0.85,
          confidence: 0.8,
        },
        {
          condition: "problem_type == 'analytical'",
          action: "inductive_reasoning",
          weight: 0.88,
          confidence: 0.83,
        },
      ],
      priority: 1,
      successRate: 0.87,
      usageCount: 0,
      lastUpdated: Date.now(),
      version: 1,
      active: true,
    };
  }

  /**
   * Get reasoning strategy
   */
  public getStrategy(task: any): string {
    this.policy.usageCount++;

    const problemType = this.classifyProblemType(task);

    for (const rule of this.policy.rules) {
      if (this.matchesCondition(rule.condition, { problem_type: problemType })) {
        return rule.action;
      }
    }

    return "deductive_reasoning"; // Default
  }

  /**
   * Classify problem type
   */
  private classifyProblemType(task: any): string {
    const goal = (task.goal || "").toLowerCase();

    if (goal.includes("prove") || goal.includes("logic") || goal.includes("deduce")) {
      return "logical";
    }

    if (goal.includes("create") || goal.includes("design") || goal.includes("innovate")) {
      return "creative";
    }

    if (goal.includes("analyze") || goal.includes("pattern") || goal.includes("trend")) {
      return "analytical";
    }

    return "logical";
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
}
