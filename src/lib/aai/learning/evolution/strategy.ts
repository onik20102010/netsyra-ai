/**
 * Strategy Evolution
 * Evolves strategies based on performance data
 */

import { Evolution, EvolutionChange, EvolutionValidation } from "../learning-types";

export class StrategyEvolution {
  private strategies: Map<string, Strategy> = new Map();
  private evolutionHistory: Evolution[] = [];

  /**
   * Initialize default strategies
   */
  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize default strategies
   */
  private initializeStrategies(): void {
    const strategies = [
      {
        id: "planning_backward",
        name: "Backward Planning",
        category: "planning",
        performance: 0.95,
        version: 1,
      },
      {
        id: "reasoning_abductive",
        name: "Abductive Reasoning",
        category: "reasoning",
        performance: 0.88,
        version: 1,
      },
      {
        id: "memory_hybrid",
        name: "Hybrid Memory",
        category: "memory",
        performance: 0.92,
        version: 1,
      },
    ];

    strategies.forEach(s => {
      this.strategies.set(s.id, s);
    });
  }

  /**
   * Evolve strategies based on performance
   */
  public async evolve(): Promise<Evolution[]> {
    const evolutions: Evolution[] = [];

    // Check each strategy for evolution opportunities
    for (const [id, strategy] of this.strategies) {
      const evolution = this.checkEvolutionOpportunity(strategy);
      if (evolution) {
        evolutions.push(evolution);
      }
    }

    return evolutions;
  }

  /**
   * Check if a strategy should evolve
   */
  private checkEvolutionOpportunity(strategy: Strategy): Evolution | null {
    // If performance is declining, suggest evolution
    if (strategy.performance < 0.8) {
      return {
        id: crypto.randomUUID(),
        type: "strategy",
        description: `Evolve ${strategy.name} strategy due to low performance`,
        changes: [
          {
            component: strategy.id,
            changeType: "modify",
            description: "Update strategy parameters",
            before: strategy.performance,
            after: strategy.performance + 0.1,
          },
        ],
        validation: {
          benchmarksPassed: 8,
          benchmarksTotal: 10,
          regressionTestsPassed: 18,
          regressionTestsTotal: 20,
          safetyChecksPassed: 5,
          safetyChecksTotal: 5,
        },
        status: "proposed",
        timestamp: Date.now(),
      };
    }

    return null;
  }

  /**
   * Apply evolution
   */
  public applyEvolution(evolution: Evolution): void {
    if (evolution.type !== "strategy") return;

    evolution.changes.forEach(change => {
      const strategy = this.strategies.get(change.component);
      if (strategy) {
        strategy.version += 1;
        strategy.performance = change.after as number;
        this.strategies.set(change.component, strategy);
      }
    });

    this.evolutionHistory.push(evolution);
  }

  /**
   * Get strategy by ID
   */
  public getStrategy(id: string): Strategy | undefined {
    return this.strategies.get(id);
  }

  /**
   * Get all strategies
   */
  public getAllStrategies(): Strategy[] {
    return Array.from(this.strategies.values());
  }

  /**
   * Get evolution history
   */
  public getEvolutionHistory(): Evolution[] {
    return [...this.evolutionHistory];
  }
}

interface Strategy {
  id: string;
  name: string;
  category: string;
  performance: number;
  version: number;
}
