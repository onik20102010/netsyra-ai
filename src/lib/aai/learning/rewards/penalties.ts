/**
 * Penalty System
 * Manages penalties for undesirable outcomes
 */

import { Penalty, PenaltyType, Experience } from "../learning-types";

export class PenaltySystem {
  private penalties: Map<string, Penalty> = new Map();
  private penaltyHistory: Map<PenaltyType, number> = new Map();

  /**
   * Apply penalty for a mistake
   */
  public applyPenalty(experience: Experience, mistakeType: string, description: string): Penalty {
    const penalty: Penalty = {
      experienceId: experience.id,
      timestamp: Date.now(),
      type: this.mapMistakeToPenaltyType(mistakeType),
      severity: this.calculateSeverity(mistakeType),
      description,
    };

    this.penalties.set(`${experience.id}_${mistakeType}`, penalty);

    // Update history
    const currentCount = this.penaltyHistory.get(penalty.type) || 0;
    this.penaltyHistory.set(penalty.type, currentCount + 1);

    return penalty;
  }

  /**
   * Map mistake type to penalty type
   */
  private mapMistakeToPenaltyType(mistakeType: string): PenaltyType {
    switch (mistakeType) {
      case "hallucination":
        return "hallucination";
      case "safety_violation":
        return "unsafe_action";
      default:
        return "failed_task";
    }
  }

  /**
   * Calculate penalty severity
   */
  private calculateSeverity(mistakeType: string): number {
    const severityMap: Record<string, number> = {
      hallucination: 5,
      safety_violation: 10,
      wrong_assumption: 2,
      missing_memory: 3,
      wrong_planner: 2,
      wrong_tool: 1,
      timeout: 2,
    };

    return severityMap[mistakeType] || 2;
  }

  /**
   * Get penalties by experience
   */
  public getPenalties(experienceId: string): Penalty[] {
    return Array.from(this.penalties.values()).filter(
      p => p.experienceId === experienceId
    );
  }

  /**
   * Get penalties by type
   */
  public getPenaltiesByType(type: PenaltyType): Penalty[] {
    return Array.from(this.penalties.values()).filter(p => p.type === type);
  }

  /**
   * Get all penalties
   */
  public getAllPenalties(): Penalty[] {
    return Array.from(this.penalties.values());
  }

  /**
   * Get penalty statistics
   */
  public getStatistics(): Record<PenaltyType, number> {
    const stats: Record<string, number> = {};

    this.penaltyHistory.forEach((count, type) => {
      stats[type] = count;
    });

    return stats as Record<PenaltyType, number>;
  }

  /**
   * Get total penalty score for an experience
   */
  public getTotalPenaltyScore(experienceId: string): number {
    const penalties = this.getPenalties(experienceId);
    return penalties.reduce((sum, p) => sum + p.severity, 0);
  }

  /**
   * Clear penalties
   */
  public clear(): void {
    this.penalties.clear();
    this.penaltyHistory.clear();
  }
}
