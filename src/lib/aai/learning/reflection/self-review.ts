/**
 * Self-Review
 * Performs detailed self-review of task execution
 */

import { Experience } from "../learning-types";

export interface SelfReviewResult {
  overallQuality: number;
  planningQuality: number;
  executionQuality: number;
  reasoningQuality: number;
  toolUsageQuality: number;
  memoryUsageQuality: number;
  summary: string;
  recommendations: string[];
}

export class SelfReview {
  /**
   * Perform self-review of an experience
   */
  public review(experience: Experience): SelfReviewResult {
    return {
      overallQuality: this.calculateOverallQuality(experience),
      planningQuality: this.calculatePlanningQuality(experience),
      executionQuality: this.calculateExecutionQuality(experience),
      reasoningQuality: this.calculateReasoningQuality(experience),
      toolUsageQuality: this.calculateToolUsageQuality(experience),
      memoryUsageQuality: this.calculateMemoryUsageQuality(experience),
      summary: this.generateSummary(experience),
      recommendations: this.generateRecommendations(experience),
    };
  }

  /**
   * Calculate overall quality
   */
  private calculateOverallQuality(experience: Experience): number {
    let quality = 0;

    if (experience.success) quality += 0.4;
    quality += experience.confidence * 0.3;
    quality += this.calculateExecutionQuality(experience) * 0.3;

    return Math.min(1, quality);
  }

  /**
   * Calculate planning quality
   */
  private calculatePlanningQuality(experience: Experience): number {
    const tasks = experience.plan;
    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter(t => t.status === "completed").length;
    const completionRate = completedTasks / tasks.length;

    return completionRate;
  }

  /**
   * Calculate execution quality
   */
  private calculateExecutionQuality(experience: Experience): number {
    let quality = 1;

    // Penalty for mistakes
    quality -= experience.mistakes.length * 0.1;

    // Penalty for failed tools
    const failedTools = experience.toolsUsed.filter(t => !t.success).length;
    quality -= failedTools * 0.05;

    return Math.max(0, quality);
  }

  /**
   * Calculate reasoning quality
   */
  private calculateReasoningQuality(experience: Experience): number {
    // Based on confidence and mistake types
    let quality = experience.confidence;

    const reasoningMistakes = experience.mistakes.filter(
      m => m.type === "wrong_assumption" || m.type === "hallucination"
    );
    quality -= reasoningMistakes.length * 0.15;

    return Math.max(0, quality);
  }

  /**
   * Calculate tool usage quality
   */
  private calculateToolUsageQuality(experience: Experience): number {
    if (experience.toolsUsed.length === 0) return 1;

    const successfulTools = experience.toolsUsed.filter(t => t.success).length;
    return successfulTools / experience.toolsUsed.length;
  }

  /**
   * Calculate memory usage quality
   */
  private calculateMemoryUsageQuality(experience: Experience): number {
    // Check if memory-related mistakes occurred
    const memoryMistakes = experience.mistakes.filter(
      m => m.type === "missing_memory"
    );

    if (memoryMistakes.length === 0) return 1;
    return Math.max(0, 1 - memoryMistakes.length * 0.3);
  }

  /**
   * Generate summary
   */
  private generateSummary(experience: Experience): string {
    const status = experience.success ? "Successful" : "Failed";
    const quality = this.calculateOverallQuality(experience);
    const qualityLabel = quality > 0.8 ? "High" : quality > 0.5 ? "Medium" : "Low";

    return `${status} execution with ${qualityLabel} quality. ${experience.mistakes.length} mistakes encountered.`;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(experience: Experience): string[] {
    const recommendations: string[] = [];

    if (experience.mistakes.length > 2) {
      recommendations.push("Review mistake patterns to identify recurring issues");
    }

    if (!experience.success) {
      recommendations.push("Analyze failure root causes before retrying");
    }

    const failedTools = experience.toolsUsed.filter(t => !t.success);
    if (failedTools.length > 0) {
      recommendations.push("Consider alternative tools or improve tool usage patterns");
    }

    if (experience.duration > 300) {
      recommendations.push("Optimize workflow to reduce execution time");
    }

    if (experience.tokensUsed > 50000) {
      recommendations.push("Optimize prompts to reduce token consumption");
    }

    return recommendations;
  }
}
