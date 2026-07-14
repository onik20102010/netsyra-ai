/**
 * Reasoning Optimizer
 * Optimizes reasoning strategies
 */

import { Experience, Optimization } from "../learning-types";

export class ReasoningOptimizer {
  private reasoningStrategies: Map<string, ReasoningStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize default reasoning strategies
   */
  private initializeStrategies(): void {
    const strategies = [
      {
        id: "deductive",
        description: "Deductive reasoning - from general to specific",
        successRate: 0.85,
        avgConfidence: 0.8,
      },
      {
        id: "inductive",
        description: "Inductive reasoning - from specific to general",
        successRate: 0.82,
        avgConfidence: 0.75,
      },
      {
        id: "abductive",
        description: "Abductive reasoning - inference to best explanation",
        successRate: 0.88,
        avgConfidence: 0.78,
      },
    ];

    strategies.forEach(s => {
      this.reasoningStrategies.set(s.id, s);
    });
  }

  /**
   * Optimize reasoning based on experience
   */
  public async optimize(experience: Experience): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    // Detect which reasoning strategy was used
    const strategyId = this.detectStrategy(experience);

    // Update strategy performance
    this.updateStrategyPerformance(strategyId, experience);

    // Check if better strategy exists
    const betterStrategy = this.findBetterStrategy(experience);
    if (betterStrategy && betterStrategy !== strategyId) {
      optimizations.push({
        id: crypto.randomUUID(),
        type: "reasoning",
        target: strategyId,
        description: `Switch to ${betterStrategy} reasoning strategy`,
        before: strategyId,
        after: betterStrategy,
        improvement: 0.08,
        confidence: 0.75,
        timestamp: Date.now(),
        status: "proposed",
      });
    }

    return optimizations;
  }

  /**
   * Detect which reasoning strategy was used
   */
  private detectStrategy(experience: Experience): string {
    // Simple detection based on mistake types
    const mistakeTypes = experience.mistakes.map(m => m.type);

    if (mistakeTypes.includes("wrong_assumption")) {
      return "deductive";
    }

    if (mistakeTypes.includes("hallucination")) {
      return "inductive";
    }

    return "abductive";
  }

  /**
   * Update strategy performance
   */
  private updateStrategyPerformance(strategyId: string, experience: Experience): void {
    const strategy = this.reasoningStrategies.get(strategyId);
    if (!strategy) return;

    const currentRate = strategy.successRate;
    const newRate = (currentRate * 0.9) + (experience.success ? 0.1 : 0);

    const currentConfidence = strategy.avgConfidence;
    const newConfidence = (currentConfidence * 0.9) + (experience.confidence * 0.1);

    strategy.successRate = newRate;
    strategy.avgConfidence = newConfidence;

    this.reasoningStrategies.set(strategyId, strategy);
  }

  /**
   * Find better strategy for the task
   */
  private findBetterStrategy(experience: Experience): string | null {
    let bestStrategy = null;
    let bestScore = 0;

    this.reasoningStrategies.forEach((strategy, id) => {
      const score = (strategy.successRate * 0.7) + (strategy.avgConfidence * 0.3);
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
    let best = "abductive";
    let bestScore = 0;

    this.reasoningStrategies.forEach((strategy, id) => {
      const score = (strategy.successRate * 0.7) + (strategy.avgConfidence * 0.3);
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
  public getAllStrategies(): Map<string, ReasoningStrategy> {
    return new Map(this.reasoningStrategies);
  }
}

interface ReasoningStrategy {
  id: string;
  description: string;
  successRate: number;
  avgConfidence: number;
}
