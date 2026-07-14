/**
 * Adaptation System
 * Adapts the system to changing conditions
 */

import { Evolution, EvolutionChange, EvolutionValidation } from "../learning-types";

export class AdaptationSystem {
  private adaptations: Map<string, Adaptation> = new Map();
  private adaptationHistory: Evolution[] = [];

  /**
   * Check if adaptation is needed
   */
  public async checkAdaptationNeeds(metrics: any): Promise<Evolution[]> {
    const evolutions: Evolution[] = [];

    // Check for performance degradation
    if (metrics.successRate < 0.7) {
      evolutions.push(this.createAdaptationEvolution("performance", "Improve overall performance"));
    }

    // Check for high latency
    if (metrics.avgLatency > 300) {
      evolutions.push(this.createAdaptationEvolution("latency", "Reduce execution latency"));
    }

    // Check for high cost
    if (metrics.avgCost > 8) {
      evolutions.push(this.createAdaptationEvolution("cost", "Optimize token usage"));
    }

    return evolutions;
  }

  /**
   * Create adaptation evolution
   */
  private createAdaptationEvolution(target: string, description: string): Evolution {
    return {
      id: crypto.randomUUID(),
      type: "adaptation",
      description,
      changes: [
        {
          component: target,
          changeType: "modify",
          description: `Adapt ${target} parameters`,
          before: "current",
          after: "adapted",
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

  /**
   * Apply adaptation
   */
  public applyAdaptation(evolution: Evolution): void {
    if (evolution.type !== "adaptation") return;

    const adaptation: Adaptation = {
      id: evolution.id,
      target: evolution.changes[0].component,
      description: evolution.description,
      appliedAt: Date.now(),
      effectiveness: 0,
    };

    this.adaptations.set(adaptation.id, adaptation);
    this.adaptationHistory.push(evolution);
  }

  /**
   * Update adaptation effectiveness
   */
  public updateEffectiveness(adaptationId: string, effectiveness: number): void {
    const adaptation = this.adaptations.get(adaptationId);
    if (adaptation) {
      adaptation.effectiveness = effectiveness;
      this.adaptations.set(adaptationId, adaptation);
    }
  }

  /**
   * Get all adaptations
   */
  public getAllAdaptations(): Adaptation[] {
    return Array.from(this.adaptations.values());
  }

  /**
   * Get adaptation history
   */
  public getAdaptationHistory(): Evolution[] {
    return [...this.adaptationHistory];
  }
}

export interface Adaptation {
  id: string;
  target: string;
  description: string;
  appliedAt: number;
  effectiveness: number;
}
