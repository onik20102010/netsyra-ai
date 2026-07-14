/**
 * Experience Replay
 * Finds and replays similar experiences for learning
 */

import { Experience } from "../learning-types";
import { ExperienceRecorder } from "./recorder";

export class ExperienceReplay {
  private recorder: ExperienceRecorder;

  constructor() {
    this.recorder = new ExperienceRecorder();
  }

  /**
   * Find similar experiences based on current task
   */
  public async findSimilar(currentTask: any): Promise<Experience[]> {
    const allExperiences = this.recorder.getAllExperiences();
    
    // Simple similarity matching based on goal
    // In production, this would use embeddings and vector similarity
    const similar = allExperiences.filter(exp => {
      const goalSimilarity = this.calculateGoalSimilarity(currentTask.goal || "", exp.goal);
      return goalSimilarity > 0.5; // Threshold
    });

    // Sort by similarity and success rate
    return similar
      .sort((a, b) => {
        const similarityA = this.calculateGoalSimilarity(currentTask.goal || "", a.goal);
        const similarityB = this.calculateGoalSimilarity(currentTask.goal || "", b.goal);
        return similarityB - similarityA;
      })
      .slice(0, 5); // Return top 5
  }

  /**
   * Calculate similarity between two goals
   */
  private calculateGoalSimilarity(goal1: string, goal2: string): number {
    if (!goal1 || !goal2) return 0;

    const words1 = goal1.toLowerCase().split(/\s+/);
    const words2 = goal2.toLowerCase().split(/\s+/);

    const intersection = words1.filter(word => words2.includes(word));
    const union = new Set([...words1, ...words2]);

    return intersection.length / union.size;
  }

  /**
   * Get best strategy from similar experiences
   */
  public async getBestStrategy(currentTask: any): Promise<Experience | null> {
    const similar = await this.findSimilar(currentTask);
    const successful = similar.filter(exp => exp.success);

    if (successful.length === 0) return null;

    // Return the most successful experience
    return successful.sort((a, b) => b.confidence - a.confidence)[0];
  }

  /**
   * Get retrieval precision metric
   */
  public async getPrecision(): Promise<number> {
    // This would be calculated based on actual retrieval performance
    // For now, return a placeholder
    return 0.92;
  }
}
