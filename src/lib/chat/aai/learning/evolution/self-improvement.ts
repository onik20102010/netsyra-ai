/**
 * Self-Improvement Engine
 * Orchestrates autonomous self-improvement
 */

import { Evolution, EvolutionChange, EvolutionValidation, LearningSession } from "../learning-types";
import { ValidationSystem } from "../simulation/validation";
import { StrategyEvolution } from "./strategy";
import { AdaptationSystem } from "./adaptation";
import { MetaLearningSystem } from "./meta-learning";

export class EvolutionEngine {
  private static instance: EvolutionEngine;

  private strategyEvolution: StrategyEvolution;
  private adaptationSystem: AdaptationSystem;
  private metaLearningSystem: MetaLearningSystem;
  private validationSystem: ValidationSystem;

  private evolutionQueue: Evolution[] = [];
  private deployedEvolutions: Evolution[] = [];

  private constructor() {
    this.strategyEvolution = new StrategyEvolution();
    this.adaptationSystem = new AdaptationSystem();
    this.metaLearningSystem = new MetaLearningSystem();
    this.validationSystem = new ValidationSystem();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): EvolutionEngine {
    if (!EvolutionEngine.instance) {
      EvolutionEngine.instance = new EvolutionEngine();
    }
    return EvolutionEngine.instance;
  }

  /**
   * Evolve based on learning session
   */
  public async evolve(session: LearningSession): Promise<void> {
    // Generate evolution candidates
    const candidates = await this.generateEvolutionCandidates(session);

    // Add to queue
    this.evolutionQueue.push(...candidates);

    // Process queue
    await this.processEvolutionQueue();
  }

  /**
   * Generate evolution candidates
   */
  private async generateEvolutionCandidates(session: LearningSession): Promise<Evolution[]> {
    const candidates: Evolution[] = [];

    // Strategy evolution
    const strategyEvolutions = await this.strategyEvolution.evolve();
    candidates.push(...strategyEvolutions);

    // Meta-learning
    const metaLearningEvolutions = await this.metaLearningSystem.evaluateAlgorithms();
    candidates.push(...metaLearningEvolutions);

    return candidates;
  }

  /**
   * Process evolution queue
   */
  private async processEvolutionQueue(): Promise<void> {
    while (this.evolutionQueue.length > 0) {
      const evolution = this.evolutionQueue.shift()!;
      await this.processEvolution(evolution);
    }
  }

  /**
   * Process a single evolution
   */
  private async processEvolution(evolution: Evolution): Promise<void> {
    // Validate evolution
    const validation = await this.validationSystem.validate(evolution);

    // Check if validation passes
    if (this.validationSystem.passesValidation(validation)) {
      // Apply evolution
      await this.applyEvolution(evolution);
      evolution.status = "deployed";
      this.deployedEvolutions.push(evolution);
    } else {
      evolution.status = "rejected";
    }
  }

  /**
   * Apply evolution
   */
  private async applyEvolution(evolution: Evolution): Promise<void> {
    switch (evolution.type) {
      case "strategy":
        this.strategyEvolution.applyEvolution(evolution);
        break;
      case "adaptation":
        this.adaptationSystem.applyAdaptation(evolution);
        break;
      case "meta_learning":
        // Meta-learning changes are applied by switching algorithms
        break;
      case "self_improvement":
        // Self-improvement changes are applied by updating the system
        break;
    }
  }

  /**
   * Run evolution cycle
   */
  public async runEvolutionCycle(): Promise<void> {
    // Check for adaptation needs
    const metrics = await this.getCurrentMetrics();
    const adaptationEvolutions = await this.adaptationSystem.checkAdaptationNeeds(metrics);

    // Add to queue
    this.evolutionQueue.push(...adaptationEvolutions);

    // Process queue
    await this.processEvolutionQueue();
  }

  /**
   * Get current metrics (placeholder)
   */
  private async getCurrentMetrics(): Promise<any> {
    return {
      successRate: 0.85,
      avgLatency: 120,
      avgCost: 7,
    };
  }

  /**
   * Get evolution queue
   */
  public getEvolutionQueue(): Evolution[] {
    return [...this.evolutionQueue];
  }

  /**
   * Get deployed evolutions
   */
  public getDeployedEvolutions(): Evolution[] {
    return [...this.deployedEvolutions];
  }

  /**
   * Get evolution statistics
   */
  public getStatistics(): {
    total: number;
    deployed: number;
    rejected: number;
    pending: number;
  } {
    return {
      total: this.deployedEvolutions.length + this.evolutionQueue.length,
      deployed: this.deployedEvolutions.length,
      rejected: this.deployedEvolutions.filter(e => e.status === "rejected").length,
      pending: this.evolutionQueue.length,
    };
  }
}

// Export singleton instance
export const evolutionEngine = EvolutionEngine.getInstance();
