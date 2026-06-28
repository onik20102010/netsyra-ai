/**
 * Execution Optimizer
 * Optimizes task execution strategies
 */

import { Experience, Optimization } from "../learning-types";

export class ExecutionOptimizer {
  private strategies: Map<string, ExecutionStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize default execution strategies
   */
  private initializeStrategies(): void {
    const strategies = [
      {
        id: "sequential",
        description: "Execute tasks sequentially",
        successRate: 0.85,
        avgDuration: 120,
      },
      {
        id: "parallel",
        description: "Execute independent tasks in parallel",
        successRate: 0.82,
        avgDuration: 80,
      },
      {
        id: "adaptive",
        description: "Adapt execution strategy based on task dependencies",
        successRate: 0.9,
        avgDuration: 100,
      },
    ];

    strategies.forEach(s => {
      this.strategies.set(s.id, s);
    });
  }

  /**
   * Optimize execution based on experience
   */
  public async optimize(experience: Experience): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    // Analyze which strategy was used
    const strategyId = this.detectStrategy(experience);

    // Update strategy performance
    this.updateStrategyPerformance(strategyId, experience);

    // Check if better strategy exists
    const betterStrategy = this.findBetterStrategy(experience);
    if (betterStrategy && betterStrategy !== strategyId) {
      optimizations.push({
        id: crypto.randomUUID(),
        type: "execution",
        target: strategyId,
        description: `Switch to ${betterStrategy} execution strategy`,
        before: strategyId,
        after: betterStrategy,
        improvement: 0.1,
        confidence: 0.75,
        timestamp: Date.now(),
        status: "proposed",
      });
    }

    return optimizations;
  }

  /**
   * Detect which strategy was used
   */
  private detectStrategy(experience: Experience): string {
    // Simple detection based on task timing
    const tasks = experience.plan;
    const totalDuration = experience.duration;
    const avgTaskDuration = totalDuration / tasks.length;

    if (avgTaskDuration < totalDuration / tasks.length * 0.5) {
      return "parallel";
    }

    return "sequential";
  }

  /**
   * Update strategy performance
   */
  private updateStrategyPerformance(strategyId: string, experience: Experience): void {
    const strategy = this.strategies.get(strategyId);
    if (!strategy) return;

    const currentRate = strategy.successRate;
    const newRate = (currentRate * 0.9) + (experience.success ? 0.1 : 0);

    const currentDuration = strategy.avgDuration;
    const newDuration = (currentDuration * 0.9) + (experience.duration * 0.1);

    strategy.successRate = newRate;
    strategy.avgDuration = newDuration;

    this.strategies.set(strategyId, strategy);
  }

  /**
   * Find better strategy for the task
   */
  private findBetterStrategy(experience: Experience): string | null {
    let bestStrategy = null;
    let bestScore = 0;

    this.strategies.forEach((strategy, id) => {
      const score = (strategy.successRate * 0.7) + ((300 - strategy.avgDuration) / 300 * 0.3);
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = id;
      }
    });

    return bestStrategy;
  }

  /**
   * Get best strategy for a task
   */
  public getBestStrategy(): string {
    let best = "sequential";
    let bestScore = 0;

    this.strategies.forEach((strategy, id) => {
      const score = (strategy.successRate * 0.7) + ((300 - strategy.avgDuration) / 300 * 0.3);
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
  public getAllStrategies(): Map<string, ExecutionStrategy> {
    return new Map(this.strategies);
  }
}

interface ExecutionStrategy {
  id: string;
  description: string;
  successRate: number;
  avgDuration: number;
}
