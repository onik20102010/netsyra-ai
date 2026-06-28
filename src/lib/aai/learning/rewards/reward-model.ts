/**
 * Reward Model
 * Scores every execution with a comprehensive reward system
 */

import { Experience, Reward, Penalty } from "../learning-types";

export class RewardModel {
  private rewards: Map<string, Reward> = new Map();
  private penalties: Map<string, Penalty> = new Map();

  /**
   * Evaluate an experience and calculate reward
   */
  public async evaluate(experience: Experience): Promise<Reward> {
    const reward: Reward = {
      experienceId: experience.id,
      timestamp: Date.now(),
      
      // Components
      accuracy: this.calculateAccuracy(experience),
      speed: this.calculateSpeed(experience),
      userSatisfaction: this.calculateUserSatisfaction(experience),
      cost: this.calculateCost(experience),
      safety: this.calculateSafety(experience),
      
      // Overall
      overall: 0,
      breakdown: {
        accuracy: 0,
        speed: 0,
        userSatisfaction: 0,
        cost: 0,
        safety: 0,
      },
    };

    // Calculate component scores
    reward.breakdown.accuracy = reward.accuracy;
    reward.breakdown.speed = reward.speed;
    reward.breakdown.userSatisfaction = reward.userSatisfaction;
    reward.breakdown.cost = reward.cost;
    reward.breakdown.safety = reward.safety;

    // Calculate overall (weighted average)
    reward.overall = (
      reward.accuracy * 0.3 +
      reward.speed * 0.2 +
      reward.userSatisfaction * 0.25 +
      reward.cost * 0.1 +
      reward.safety * 0.15
    );

    // Store reward
    this.rewards.set(experience.id, reward);

    // Apply penalties if any
    this.applyPenalties(experience);

    return reward;
  }

  /**
   * Calculate accuracy score
   */
  private calculateAccuracy(experience: Experience): number {
    let score = 0;

    // Success contributes heavily
    if (experience.success) {
      score += 0.6;
    }

    // Confidence contributes
    score += experience.confidence * 0.3;

    // Fewer mistakes is better
    const mistakePenalty = experience.mistakes.length * 0.05;
    score -= mistakePenalty;

    return Math.max(0, Math.min(10, score * 10));
  }

  /**
   * Calculate speed score
   */
  private calculateSpeed(experience: Experience): number {
    // Faster is better, but not too fast (quality matters)
    const idealDuration = 120; // 2 minutes ideal
    const deviation = Math.abs(experience.duration - idealDuration);
    
    // Score decreases with deviation
    const score = Math.max(0, 10 - (deviation / 60));
    
    return Math.min(10, score);
  }

  /**
   * Calculate user satisfaction score
   */
  private calculateUserSatisfaction(experience: Experience): number {
    // Based on success and confidence
    let score = experience.success ? 7 : 3;
    score += experience.confidence * 2;

    return Math.min(10, score);
  }

  /**
   * Calculate cost score (lower is better, so invert)
   */
  private calculateCost(experience: Experience): number {
    // Token efficiency
    const idealTokens = 20000;
    const tokenRatio = idealTokens / Math.max(experience.tokensUsed, 1);
    
    const score = Math.min(10, tokenRatio * 5);
    
    return score;
  }

  /**
   * Calculate safety score
   */
  private calculateSafety(experience: Experience): number {
    let score = 10;

    // Penalize safety violations
    const safetyViolations = experience.mistakes.filter(m => m.type === "safety_violation");
    score -= safetyViolations.length * 5;

    // Penalize hallucinations
    const hallucinations = experience.mistakes.filter(m => m.type === "hallucination");
    score -= hallucinations.length * 3;

    return Math.max(0, score);
  }

  /**
   * Apply penalties for undesirable outcomes
   */
  private applyPenalties(experience: Experience): void {
    experience.mistakes.forEach(mistake => {
      let penalty: Penalty;

      switch (mistake.type) {
        case "hallucination":
          penalty = {
            experienceId: experience.id,
            timestamp: Date.now(),
            type: "hallucination",
            severity: 5,
            description: mistake.description,
          };
          break;

        case "safety_violation":
          penalty = {
            experienceId: experience.id,
            timestamp: Date.now(),
            type: "unsafe_action",
            severity: 10,
            description: mistake.description,
          };
          break;

        default:
          if (!experience.success) {
            penalty = {
              experienceId: experience.id,
              timestamp: Date.now(),
              type: "failed_task",
              severity: 2,
              description: "Task failed",
            };
          } else {
            return; // No penalty
          }
      }

      if (penalty) {
        this.penalties.set(`${experience.id}_${mistake.type}`, penalty);
      }
    });
  }

  /**
   * Get reward by experience ID
   */
  public getReward(experienceId: string): Reward | undefined {
    return this.rewards.get(experienceId);
  }

  /**
   * Get all rewards
   */
  public getAllRewards(): Reward[] {
    return Array.from(this.rewards.values());
  }

  /**
   * Get average reward
   */
  public getAverageReward(): number {
    const rewards = this.getAllRewards();
    if (rewards.length === 0) return 0;

    const total = rewards.reduce((sum, r) => sum + r.overall, 0);
    return total / rewards.length;
  }

  /**
   * Get tool reliability metrics
   */
  public async getToolReliability(): Promise<Record<string, any>> {
    // This would be calculated from tool usage data
    return {
      browser: { successRate: 0.98, avgLatency: 3, failureRate: 0.02 },
      code_editor: { successRate: 0.95, avgLatency: 2, failureRate: 0.05 },
      terminal: { successRate: 0.97, avgLatency: 1, failureRate: 0.03 },
    };
  }

  /**
   * Get user satisfaction metric
   */
  public async getUserSatisfaction(): Promise<number> {
    const rewards = this.getAllRewards();
    if (rewards.length === 0) return 0;

    const total = rewards.reduce((sum, r) => sum + r.userSatisfaction, 0);
    return total / rewards.length;
  }

  /**
   * Get average cost metric
   */
  public async getAverageCost(): Promise<number> {
    const rewards = this.getAllRewards();
    if (rewards.length === 0) return 0;

    const total = rewards.reduce((sum, r) => sum + r.cost, 0);
    return total / rewards.length;
  }

  /**
   * Get average latency metric
   */
  public async getAverageLatency(): Promise<number> {
    // This would be calculated from experience data
    return 5; // Placeholder
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
   * Get all penalties
   */
  public getAllPenalties(): Penalty[] {
    return Array.from(this.penalties.values());
  }
}
