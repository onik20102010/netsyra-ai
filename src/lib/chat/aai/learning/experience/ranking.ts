/**
 * Experience Ranking
 * Ranks experiences by quality and usefulness
 */

import { Experience } from "../learning-types";

export class ExperienceRanker {
  /**
   * Rank experiences by quality score
   */
  public rankByQuality(experiences: Experience[]): Experience[] {
    return experiences
      .map(exp => ({
        experience: exp,
        score: this.calculateQualityScore(exp),
      }))
      .sort((a, b) => b.score - a.score)
      .map(item => item.experience);
  }

  /**
   * Calculate quality score for an experience
   */
  private calculateQualityScore(experience: Experience): number {
    let score = 0;

    // Success contributes significantly
    if (experience.success) {
      score += 0.4;
    }

    // Confidence contributes
    score += experience.confidence * 0.2;

    // Fewer mistakes is better
    const mistakePenalty = experience.mistakes.length * 0.05;
    score -= mistakePenalty;

    // Duration efficiency (faster is better, up to a point)
    const durationScore = Math.max(0, 1 - experience.duration / 600); // Normalize to 10 minutes
    score += durationScore * 0.2;

    // Token efficiency
    const tokenScore = Math.max(0, 1 - experience.tokensUsed / 100000); // Normalize to 100k tokens
    score += tokenScore * 0.1;

    // Tool success rate
    if (experience.toolsUsed.length > 0) {
      const toolSuccessRate = experience.toolsUsed.filter(t => t.success).length / experience.toolsUsed.length;
      score += toolSuccessRate * 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Rank experiences by similarity to a query
   */
  public rankBySimilarity(experiences: Experience[], query: string): Experience[] {
    return experiences
      .map(exp => ({
        experience: exp,
        similarity: this.calculateSimilarity(exp, query),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .map(item => item.experience);
  }

  /**
   * Calculate similarity to query
   */
  private calculateSimilarity(experience: Experience, query: string): number {
    const queryWords = query.toLowerCase().split(/\s+/);
    const goalWords = experience.goal.toLowerCase().split(/\s+/);

    const intersection = queryWords.filter(word => goalWords.includes(word));
    const union = new Set([...queryWords, ...goalWords]);

    return intersection.length / union.size;
  }
}
