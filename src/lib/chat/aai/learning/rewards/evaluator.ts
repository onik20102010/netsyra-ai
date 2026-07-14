/**
 * Reward Evaluator
 * Evaluates and aggregates reward metrics
 */

import { Reward } from "../learning-types";

export class RewardEvaluator {
  private rewards: Reward[] = [];

  /**
   * Add a reward for evaluation
   */
  public addReward(reward: Reward): void {
    this.rewards.push(reward);
  }

  /**
   * Get average reward
   */
  public getAverageReward(): number {
    if (this.rewards.length === 0) return 0;

    const total = this.rewards.reduce((sum, r) => sum + r.overall, 0);
    return total / this.rewards.length;
  }

  /**
   * Get average by component
   */
  public getAverageByComponent(): {
    accuracy: number;
    speed: number;
    userSatisfaction: number;
    cost: number;
    safety: number;
  } {
    if (this.rewards.length === 0) {
      return { accuracy: 0, speed: 0, userSatisfaction: 0, cost: 0, safety: 0 };
    }

    const sum = this.rewards.reduce(
      (acc, r) => ({
        accuracy: acc.accuracy + r.breakdown.accuracy,
        speed: acc.speed + r.breakdown.speed,
        userSatisfaction: acc.userSatisfaction + r.breakdown.userSatisfaction,
        cost: acc.cost + r.breakdown.cost,
        safety: acc.safety + r.breakdown.safety,
      }),
      { accuracy: 0, speed: 0, userSatisfaction: 0, cost: 0, safety: 0 }
    );

    const count = this.rewards.length;

    return {
      accuracy: sum.accuracy / count,
      speed: sum.speed / count,
      userSatisfaction: sum.userSatisfaction / count,
      cost: sum.cost / count,
      safety: sum.safety / count,
    };
  }

  /**
   * Get reward trend
   */
  public getTrend(windowSize: number = 10): Array<{ timestamp: number; reward: number }> {
    const recent = this.rewards.slice(-windowSize);
    return recent.map(r => ({
      timestamp: r.timestamp,
      reward: r.overall,
    }));
  }

  /**
   * Get best rewards
   */
  public getBestRewards(limit: number = 10): Reward[] {
    return [...this.rewards]
      .sort((a, b) => b.overall - a.overall)
      .slice(0, limit);
  }

  /**
   * Get worst rewards
   */
  public getWorstRewards(limit: number = 10): Reward[] {
    return [...this.rewards]
      .sort((a, b) => a.overall - b.overall)
      .slice(0, limit);
  }

  /**
   * Get percentile
   */
  public getPercentile(percentile: number): number {
    if (this.rewards.length === 0) return 0;

    const sorted = [...this.rewards].sort((a, b) => a.overall - b.overall);
    const index = Math.floor((percentile / 100) * sorted.length);
    
    return sorted[index].overall;
  }

  /**
   * Clear rewards
   */
  public clear(): void {
    this.rewards = [];
  }
}
