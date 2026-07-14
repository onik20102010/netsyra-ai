/**
 * Reward Scorer
 * Scores individual components of the reward system
 */

import { Experience } from "../learning-types";

export class RewardScorer {
  /**
   * Score accuracy component
   */
  public scoreAccuracy(experience: Experience): number {
    let score = 0;

    // Success is the primary factor
    if (experience.success) {
      score += 6;
    }

    // Confidence in the result
    score += experience.confidence * 3;

    // Quality of result
    score += experience.result.quality * 1;

    // Penalty for mistakes
    score -= experience.mistakes.length * 0.5;

    return Math.max(0, Math.min(10, score));
  }

  /**
   * Score speed component
   */
  public scoreSpeed(experience: Experience): number {
    const duration = experience.duration;

    // Ideal duration is 60-120 seconds
    if (duration < 60) {
      // Too fast might mean incomplete
      return 7;
    }

    if (duration <= 120) {
      // Ideal range
      return 10;
    }

    if (duration <= 300) {
      // Acceptable
      return 8;
    }

    if (duration <= 600) {
      // Slow
      return 5;
    }

    // Very slow
    return 2;
  }

  /**
   * Score user satisfaction component
   */
  public scoreUserSatisfaction(experience: Experience): number {
    let score = 0;

    // Success is key
    if (experience.success) {
      score += 5;
    }

    // High confidence
    if (experience.confidence > 0.8) {
      score += 2;
    }

    // Few mistakes
    if (experience.mistakes.length === 0) {
      score += 2;
    } else if (experience.mistakes.length <= 2) {
      score += 1;
    }

    // Good tool usage
    const toolSuccessRate = experience.toolsUsed.length > 0
      ? experience.toolsUsed.filter(t => t.success).length / experience.toolsUsed.length
      : 1;

    score += toolSuccessRate * 1;

    return Math.min(10, score);
  }

  /**
   * Score cost component
   */
  public scoreCost(experience: Experience): number {
    const tokens = experience.tokensUsed;

    // Lower token usage is better
    if (tokens < 10000) {
      return 10;
    }

    if (tokens < 25000) {
      return 8;
    }

    if (tokens < 50000) {
      return 6;
    }

    if (tokens < 100000) {
      return 4;
    }

    return 2;
  }

  /**
   * Score safety component
   */
  public scoreSafety(experience: Experience): number {
    let score = 10;

    // Penalize safety violations heavily
    const safetyViolations = experience.mistakes.filter(m => m.type === "safety_violation");
    score -= safetyViolations.length * 10;

    // Penalize hallucinations
    const hallucinations = experience.mistakes.filter(m => m.type === "hallucination");
    score -= hallucinations.length * 5;

    // Penalize failed tasks
    if (!experience.success) {
      score -= 2;
    }

    return Math.max(0, score);
  }

  /**
   * Calculate overall score
   */
  public calculateOverall(accuracy: number, speed: number, userSatisfaction: number, cost: number, safety: number): number {
    return (
      accuracy * 0.3 +
      speed * 0.2 +
      userSatisfaction * 0.25 +
      cost * 0.1 +
      safety * 0.15
    );
  }
}
