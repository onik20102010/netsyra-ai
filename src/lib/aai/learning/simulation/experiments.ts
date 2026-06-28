/**
 * Experiments Manager
 * Manages A/B testing and experiments
 */

import { Simulation, SimulationScenario } from "../learning-types";

export interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: ExperimentVariant[];
  status: "pending" | "running" | "completed";
  results: ExperimentResult[];
  timestamp: number;
}

export interface ExperimentVariant {
  id: string;
  name: string;
  config: any;
  traffic: number; // Percentage of traffic (0-100)
}

export interface ExperimentResult {
  variantId: string;
  successRate: number;
  avgDuration: number;
  avgTokens: number;
  sampleSize: number;
}

export class ExperimentsManager {
  private experiments: Map<string, Experiment> = new Map();

  /**
   * Create an A/B experiment
   */
  public createExperiment(name: string, description: string, variants: ExperimentVariant[]): Experiment {
    const experiment: Experiment = {
      id: crypto.randomUUID(),
      name,
      description,
      variants,
      status: "pending",
      results: [],
      timestamp: Date.now(),
    };

    this.experiments.set(experiment.id, experiment);
    return experiment;
  }

  /**
   * Run an experiment
   */
  public async runExperiment(experimentId: string): Promise<Experiment> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    experiment.status = "running";

    // Run each variant
    for (const variant of experiment.variants) {
      const result = await this.runVariant(variant);
      experiment.results.push(result);
    }

    experiment.status = "completed";
    this.experiments.set(experimentId, experiment);

    return experiment;
  }

  /**
   * Run a single variant
   */
  private async runVariant(variant: ExperimentVariant): Promise<ExperimentResult> {
    // Simulate running the variant
    const sampleSize = Math.floor(variant.traffic / 10);
    const successes = Math.floor(sampleSize * (0.7 + Math.random() * 0.3));

    return {
      variantId: variant.id,
      successRate: successes / sampleSize,
      avgDuration: 100 + Math.random() * 50,
      avgTokens: 5000 + Math.random() * 5000,
      sampleSize,
    };
  }

  /**
   * Get winning variant
   */
  public getWinningVariant(experimentId: string): ExperimentVariant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.results.length === 0) return null;

    let bestResult = experiment.results[0];
    let bestVariant = experiment.variants[0];

    experiment.results.forEach((result, index) => {
      if (result.successRate > bestResult.successRate) {
        bestResult = result;
        bestVariant = experiment.variants[index];
      }
    });

    return bestVariant;
  }

  /**
   * Get experiment by ID
   */
  public getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  /**
   * Get all experiments
   */
  public getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Clear experiments
   */
  public clear(): void {
    this.experiments.clear();
  }
}
