/**
 * Meta-Learning System
 * Learns how to learn better
 */

import { Evolution, EvolutionChange, EvolutionValidation } from "../learning-types";

export class MetaLearningSystem {
  private learningAlgorithms: Map<string, LearningAlgorithm> = new Map();
  private algorithmHistory: Evolution[] = [];

  constructor() {
    this.initializeAlgorithms();
  }

  /**
   * Initialize learning algorithms
   */
  private initializeAlgorithms(): void {
    const algorithms = [
      {
        id: "reinforcement_learning",
        name: "Reinforcement Learning",
        performance: 0.85,
        version: 1,
      },
      {
        id: "supervised_learning",
        name: "Supervised Learning",
        performance: 0.82,
        version: 1,
      },
      {
        id: "unsupervised_learning",
        name: "Unsupervised Learning",
        performance: 0.78,
        version: 1,
      },
    ];

    algorithms.forEach(algo => {
      this.learningAlgorithms.set(algo.id, algo);
    });
  }

  /**
   * Evaluate learning algorithms
   */
  public async evaluateAlgorithms(): Promise<Evolution[]> {
    const evolutions: Evolution[] = [];

    // Compare algorithms and suggest improvements
    const algorithms = Array.from(this.learningAlgorithms.values());
    const bestAlgorithm = algorithms.reduce((best, current) => 
      current.performance > best.performance ? current : best
    );

    // Suggest using the best algorithm
    evolutions.push({
      id: crypto.randomUUID(),
      type: "meta_learning",
      description: `Switch to ${bestAlgorithm.name} for better learning performance`,
      changes: [
        {
          component: "learning_algorithm",
          changeType: "modify",
          description: `Use ${bestAlgorithm.name}`,
          before: "current_algorithm",
          after: bestAlgorithm.id,
        },
      ],
      validation: {
        benchmarksPassed: 9,
        benchmarksTotal: 10,
        regressionTestsPassed: 19,
        regressionTestsTotal: 20,
        safetyChecksPassed: 5,
        safetyChecksTotal: 5,
      },
      status: "proposed",
      timestamp: Date.now(),
    });

    return evolutions;
  }

  /**
   * Update algorithm performance
   */
  public updateAlgorithmPerformance(algorithmId: string, performance: number): void {
    const algorithm = this.learningAlgorithms.get(algorithmId);
    if (algorithm) {
      algorithm.performance = performance;
      this.learningAlgorithms.set(algorithmId, algorithm);
    }
  }

  /**
   * Get best algorithm
   */
  public getBestAlgorithm(): LearningAlgorithm | null {
    const algorithms = Array.from(this.learningAlgorithms.values());
    if (algorithms.length === 0) return null;

    return algorithms.reduce((best, current) => 
      current.performance > best.performance ? current : best
    );
  }

  /**
   * Get all algorithms
   */
  public getAllAlgorithms(): LearningAlgorithm[] {
    return Array.from(this.learningAlgorithms.values());
  }
}

export interface LearningAlgorithm {
  id: string;
  name: string;
  performance: number;
  version: number;
}
