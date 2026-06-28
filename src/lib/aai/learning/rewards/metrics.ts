/**
 * Reward Metrics
 * Tracks and analyzes reward metrics over time
 */

import { Reward } from "../learning-types";

export interface RewardMetrics {
  totalRewards: number;
  averageReward: number;
  averageAccuracy: number;
  averageSpeed: number;
  averageUserSatisfaction: number;
  averageCost: number;
  averageSafety: number;
  trend: "improving" | "stable" | "declining";
  trendPercentage: number;
}

export class RewardMetricsTracker {
  private rewards: Reward[] = [];

  /**
   * Add reward
   */
  public addReward(reward: Reward): void {
    this.rewards.push(reward);
  }

  /**
   * Get current metrics
   */
  public getMetrics(): RewardMetrics {
    if (this.rewards.length === 0) {
      return {
        totalRewards: 0,
        averageReward: 0,
        averageAccuracy: 0,
        averageSpeed: 0,
        averageUserSatisfaction: 0,
        averageCost: 0,
        averageSafety: 0,
        trend: "stable",
        trendPercentage: 0,
      };
    }

    const totalRewards = this.rewards.length;
    const averageReward = this.rewards.reduce((sum, r) => sum + r.overall, 0) / totalRewards;
    const averageAccuracy = this.rewards.reduce((sum, r) => sum + r.breakdown.accuracy, 0) / totalRewards;
    const averageSpeed = this.rewards.reduce((sum, r) => sum + r.breakdown.speed, 0) / totalRewards;
    const averageUserSatisfaction = this.rewards.reduce((sum, r) => sum + r.breakdown.userSatisfaction, 0) / totalRewards;
    const averageCost = this.rewards.reduce((sum, r) => sum + r.breakdown.cost, 0) / totalRewards;
    const averageSafety = this.rewards.reduce((sum, r) => sum + r.breakdown.safety, 0) / totalRewards;

    const { trend, trendPercentage } = this.calculateTrend();

    return {
      totalRewards,
      averageReward,
      averageAccuracy,
      averageSpeed,
      averageUserSatisfaction,
      averageCost,
      averageSafety,
      trend,
      trendPercentage,
    };
  }

  /**
   * Calculate trend
   */
  private calculateTrend(): { trend: "improving" | "stable" | "declining"; trendPercentage: number } {
    if (this.rewards.length < 10) {
      return { trend: "stable", trendPercentage: 0 };
    }

    const recent = this.rewards.slice(-10);
    const older = this.rewards.slice(-20, -10);

    if (older.length === 0) {
      return { trend: "stable", trendPercentage: 0 };
    }

    const recentAvg = recent.reduce((sum, r) => sum + r.overall, 0) / recent.length;
    const olderAvg = older.reduce((sum, r) => sum + r.overall, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 5) {
      return { trend: "improving", trendPercentage: change };
    }

    if (change < -5) {
      return { trend: "declining", trendPercentage: Math.abs(change) };
    }

    return { trend: "stable", trendPercentage: change };
  }

  /**
   * Get metrics by time range
   */
  public getMetricsByTimeRange(startTime: number, endTime: number): RewardMetrics {
    const filtered = this.rewards.filter(
      r => r.timestamp >= startTime && r.timestamp <= endTime
    );

    if (filtered.length === 0) {
      return {
        totalRewards: 0,
        averageReward: 0,
        averageAccuracy: 0,
        averageSpeed: 0,
        averageUserSatisfaction: 0,
        averageCost: 0,
        averageSafety: 0,
        trend: "stable",
        trendPercentage: 0,
      };
    }

    const totalRewards = filtered.length;
    const averageReward = filtered.reduce((sum, r) => sum + r.overall, 0) / totalRewards;
    const averageAccuracy = filtered.reduce((sum, r) => sum + r.breakdown.accuracy, 0) / totalRewards;
    const averageSpeed = filtered.reduce((sum, r) => sum + r.breakdown.speed, 0) / totalRewards;
    const averageUserSatisfaction = filtered.reduce((sum, r) => sum + r.breakdown.userSatisfaction, 0) / totalRewards;
    const averageCost = filtered.reduce((sum, r) => sum + r.breakdown.cost, 0) / totalRewards;
    const averageSafety = filtered.reduce((sum, r) => sum + r.breakdown.safety, 0) / totalRewards;

    return {
      totalRewards,
      averageReward,
      averageAccuracy,
      averageSpeed,
      averageUserSatisfaction,
      averageCost,
      averageSafety,
      trend: "stable",
      trendPercentage: 0,
    };
  }

  /**
   * Clear rewards
   */
  public clear(): void {
    this.rewards = [];
  }
}
