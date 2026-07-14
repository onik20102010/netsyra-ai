/**
 * Planner Optimizer
 * Optimizes planning strategies
 */

import { Experience, Optimization } from "../learning-types";

export class PlannerOptimizer {
  private planningStrategies: Map<string, PlanningStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize default planning strategies
   */
  private initializeStrategies(): void {
    const strategies = [
      {
        id: "forward",
        description: "Forward planning - start from initial state",
        successRate: 0.61,
        avgTasks: 8,
      },
      {
        id: "backward",
        description: "Backward planning - start from goal",
        successRate: 0.95,
        avgTasks: 6,
      },
      {
        id: "hybrid",
        description: "Hybrid planning - combine forward and backward",
        successRate: 0.98,
        avgTasks: 7,
      },
    ];

    strategies.forEach(s => {
      this.planningStrategies.set(s.id, s);
    });
  }

  /**
   * Optimize planning based on experience
   */
  public async optimize(experience: Experience): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    // Detect which planning strategy was used
    const strategyId = this.detectStrategy(experience);

    // Update strategy performance
    this.updateStrategyPerformance(strategyId, experience);

    // Check if better strategy exists
    const betterStrategy = this.findBetterStrategy(experience);
    if (betterStrategy && betterStrategy !== strategyId) {
      optimizations.push({
        id: crypto.randomUUID(),
        type: "planner",
        target: strategyId,
        description: `Switch to ${betterStrategy} planning strategy`,
        before: strategyId,
        after: betterStrategy,
        improvement: 0.1,
        confidence: 0.8,
        timestamp: Date.now(),
        status: "proposed",
      });
    }

    return optimizations;
  }

  /**
   * Detect which planning strategy was used
   */
  private detectStrategy(experience: Experience): string {
    // Simple detection based on task structure
    const tasks = experience.plan;
    
    // If tasks seem to build toward a goal, likely backward planning
    if (tasks.length > 0 && tasks[0].description.toLowerCase().includes("goal")) {
      return "backward";
    }

    // If tasks seem to progress from start, likely forward planning
    if (tasks.length > 0 && tasks[tasks.length - 1].description.toLowerCase().includes("complete")) {
      return "forward";
    }

    return "hybrid";
  }

  /**
   * Update strategy performance
   */
  private updateStrategyPerformance(strategyId: string, experience: Experience): void {
    const strategy = this.planningStrategies.get(strategyId);
    if (!strategy) return;

    const currentRate = strategy.successRate;
    const newRate = (currentRate * 0.9) + (experience.success ? 0.1 : 0);

    const currentTasks = strategy.avgTasks;
    const newTasks = (currentTasks * 0.9) + (experience.plan.length * 0.1);

    strategy.successRate = newRate;
    strategy.avgTasks = newTasks;

    this.planningStrategies.set(strategyId, strategy);
  }

  /**
   * Find better strategy for the task
   */
  private findBetterStrategy(experience: Experience): string | null {
    let bestStrategy = null;
    let bestScore = 0;

    this.planningStrategies.forEach((strategy, id) => {
      const score = (strategy.successRate * 0.8) + ((10 - strategy.avgTasks) / 10 * 0.2);
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = id;
      }
    });

    return bestStrategy;
  }

  /**
   * Get best strategy
   */
  public getBestStrategy(): string {
    let best = "hybrid";
    let bestScore = 0;

    this.planningStrategies.forEach((strategy, id) => {
      const score = (strategy.successRate * 0.8) + ((10 - strategy.avgTasks) / 10 * 0.2);
      if (score > bestScore) {
        bestScore = score;
        best = id;
      }
    });

    return best;
  }

  /**
   * Get all strategies
   */
  public getAllStrategies(): Map<string, PlanningStrategy> {
    return new Map(this.planningStrategies);
  }
}

interface PlanningStrategy {
  id: string;
  description: string;
  successRate: number;
  avgTasks: number;
}
