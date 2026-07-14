/**
 * Routing Policy
 * Manages routing policy for task delegation
 */

import { Policy, PolicyRule, Experience } from "../learning-types";

export class RoutingPolicy {
  private policy: Policy;
  private performanceHistory: Map<string, number[]> = new Map();

  constructor() {
    this.policy = {
      id: crypto.randomUUID(),
      name: "Routing Policy",
      type: "routing",
      description: "Determines which model tier to use for different task types",
      rules: [
        {
          condition: "task_complexity == 'high'",
          action: "use_tier_3",
          weight: 0.9,
          confidence: 0.85,
        },
        {
          condition: "task_complexity == 'medium'",
          action: "use_tier_2",
          weight: 0.8,
          confidence: 0.8,
        },
        {
          condition: "task_complexity == 'low'",
          action: "use_tier_1",
          weight: 0.7,
          confidence: 0.75,
        },
      ],
      priority: 1,
      successRate: 0.8,
      usageCount: 0,
      lastUpdated: Date.now(),
      version: 1,
      active: true,
    };
  }

  /**
   * Get routing decision based on task
   */
  public getRouting(task: any): string {
    this.policy.usageCount++;

    // Simple routing based on task complexity
    const complexity = this.assessComplexity(task);

    for (const rule of this.policy.rules) {
      if (this.matchesCondition(rule.condition, { task_complexity: complexity })) {
        return rule.action;
      }
    }

    return "use_tier_2"; // Default
  }

  /**
   * Assess task complexity
   */
  private assessComplexity(task: any): string {
    const goal = (task.goal || "").toLowerCase();
    const length = goal.length;

    if (length > 200 || goal.includes("complex") || goal.includes("system")) {
      return "high";
    }

    if (length > 100 || goal.includes("multiple") || goal.includes("integration")) {
      return "medium";
    }

    return "low";
  }

  /**
   * Check if condition matches
   */
  private matchesCondition(condition: string, context: any): boolean {
    // Simple condition matching
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
    const action = this.getRouting(experience);
    const success = experience.success ? 1 : 0;

    const history = this.performanceHistory.get(action) || [];
    history.push(success);
    this.performanceHistory.set(action, history);

    // Update success rate
    const allHistory = Array.from(this.performanceHistory.values()).flat();
    const newSuccessRate = allHistory.reduce((a, b) => a + b, 0) / allHistory.length;

    this.policy.successRate = newSuccessRate;
    this.policy.lastUpdated = Date.now();
  }

  /**
   * Get policy
   */
  public getPolicy(): Policy {
    return { ...this.policy };
  }

  /**
   * Get efficiency metric
   */
  public async getEfficiency(): Promise<number> {
    return this.policy.successRate;
  }
}
