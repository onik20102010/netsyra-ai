/**
 * Pattern Predictor
 * Predicts outcomes based on patterns
 */

import { Experience, Pattern } from "../learning-types";

export interface Prediction {
  id: string;
  type: "success" | "duration" | "tokens" | "mistakes";
  predictedValue: number;
  confidence: number;
  basedOn: string[];
}

export class PatternPredictor {
  private experiences: Experience[] = [];

  /**
   * Add experience for prediction model
   */
  public addExperience(experience: Experience): void {
    this.experiences.push(experience);
  }

  /**
   * Predict success probability
   */
  public predictSuccess(task: string): Prediction {
    if (this.experiences.length === 0) {
      return {
        id: crypto.randomUUID(),
        type: "success",
        predictedValue: 0.5,
        confidence: 0,
        basedOn: [],
      };
    }

    // Find similar experiences
    const similar = this.findSimilarExperiences(task);
    
    if (similar.length === 0) {
      return {
        id: crypto.randomUUID(),
        type: "success",
        predictedValue: 0.5,
        confidence: 0.3,
        basedOn: [],
      };
    }

    const successRate = similar.filter(e => e.success).length / similar.length;
    const confidence = Math.min(1, similar.length / 10);

    return {
      id: crypto.randomUUID(),
      type: "success",
      predictedValue: successRate,
      confidence,
      basedOn: similar.map(e => e.id),
    };
  }

  /**
   * Predict duration
   */
  public predictDuration(task: string): Prediction {
    const similar = this.findSimilarExperiences(task);
    
    if (similar.length === 0) {
      return {
        id: crypto.randomUUID(),
        type: "duration",
        predictedValue: 120,
        confidence: 0.3,
        basedOn: [],
      };
    }

    const avgDuration = similar.reduce((sum, e) => sum + e.duration, 0) / similar.length;
    const confidence = Math.min(1, similar.length / 10);

    return {
      id: crypto.randomUUID(),
      type: "duration",
      predictedValue: avgDuration,
      confidence,
      basedOn: similar.map(e => e.id),
    };
  }

  /**
   * Predict token usage
   */
  public predictTokens(task: string): Prediction {
    const similar = this.findSimilarExperiences(task);
    
    if (similar.length === 0) {
      return {
        id: crypto.randomUUID(),
        type: "tokens",
        predictedValue: 10000,
        confidence: 0.3,
        basedOn: [],
      };
    }

    const avgTokens = similar.reduce((sum, e) => sum + e.tokensUsed, 0) / similar.length;
    const confidence = Math.min(1, similar.length / 10);

    return {
      id: crypto.randomUUID(),
      type: "tokens",
      predictedValue: avgTokens,
      confidence,
      basedOn: similar.map(e => e.id),
    };
  }

  /**
   * Find similar experiences
   */
  private findSimilarExperiences(task: string): Experience[] {
    const taskWords = task.toLowerCase().split(/\s+/);

    return this.experiences
      .map(exp => ({
        experience: exp,
        similarity: this.calculateSimilarity(taskWords, exp.goal),
      }))
      .filter(item => item.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5)
      .map(item => item.experience);
  }

  /**
   * Calculate similarity
   */
  private calculateSimilarity(taskWords: string[], goal: string): number {
    const goalWords = goal.toLowerCase().split(/\s+/);
    const intersection = taskWords.filter(word => goalWords.includes(word));
    const union = new Set([...taskWords, ...goalWords]);

    return intersection.length / union.size;
  }

  /**
   * Get prediction for a pattern
   */
  public predictFromPattern(pattern: Pattern, task: string): Prediction {
    // Simple prediction based on pattern confidence
    return {
      id: crypto.randomUUID(),
      type: "success",
      predictedValue: pattern.confidence,
      confidence: pattern.confidence,
      basedOn: [pattern.id],
    };
  }
}
