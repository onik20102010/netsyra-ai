/**
 * Experience Analyzer
 * Analyzes experiences to extract insights
 */

import { Experience } from "../learning-types";
import { ExperienceRecorder } from "./recorder";

export class ExperienceAnalyzer {
  private recorder: ExperienceRecorder;

  constructor() {
    this.recorder = new ExperienceRecorder();
  }

  /**
   * Analyze experience patterns
   */
  public analyzePatterns(): any {
    const experiences = this.recorder.getAllExperiences();

    return {
      totalExperiences: experiences.length,
      successRate: this.calculateSuccessRate(experiences),
      averageDuration: this.calculateAverageDuration(experiences),
      averageTokens: this.calculateAverageTokens(experiences),
      commonMistakes: this.getCommonMistakes(experiences),
      commonTools: this.getCommonTools(experiences),
    };
  }

  /**
   * Calculate success rate
   */
  private calculateSuccessRate(experiences: Experience[]): number {
    if (experiences.length === 0) return 0;
    const successful = experiences.filter(exp => exp.success).length;
    return successful / experiences.length;
  }

  /**
   * Calculate average duration
   */
  private calculateAverageDuration(experiences: Experience[]): number {
    if (experiences.length === 0) return 0;
    const total = experiences.reduce((sum, exp) => sum + exp.duration, 0);
    return total / experiences.length;
  }

  /**
   * Calculate average tokens used
   */
  private calculateAverageTokens(experiences: Experience[]): number {
    if (experiences.length === 0) return 0;
    const total = experiences.reduce((sum, exp) => sum + exp.tokensUsed, 0);
    return total / experiences.length;
  }

  /**
   * Get common mistakes
   */
  private getCommonMistakes(experiences: Experience[]): Record<string, number> {
    const mistakeCounts: Record<string, number> = {};

    experiences.forEach(exp => {
      exp.mistakes.forEach(mistake => {
        mistakeCounts[mistake.type] = (mistakeCounts[mistake.type] || 0) + 1;
      });
    });

    return mistakeCounts;
  }

  /**
   * Get common tools
   */
  private getCommonTools(experiences: Experience[]): Record<string, number> {
    const toolCounts: Record<string, number> = {};

    experiences.forEach(exp => {
      exp.toolsUsed.forEach(tool => {
        toolCounts[tool.toolName] = (toolCounts[tool.toolName] || 0) + 1;
      });
    });

    return toolCounts;
  }
}
