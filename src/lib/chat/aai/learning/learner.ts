/**
 * Learner
 * High-level interface for the learning system
 */

import { Experience } from "./learning-types";
import { LearningEngine } from "./engine";
import { LearningManager } from "./manager";

export class Learner {
  private static instance: Learner;
  private engine: LearningEngine;
  private manager: LearningManager;

  private constructor() {
    this.engine = LearningEngine.getInstance();
    this.manager = LearningManager.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): Learner {
    if (!Learner.instance) {
      Learner.instance = new Learner();
    }
    return Learner.instance;
  }

  /**
   * Initialize the learner
   */
  public async initialize(): Promise<void> {
    console.log("Initializing learner...");
    this.engine.start();
    console.log("Learner initialized");
  }

  /**
   * Shutdown the learner
   */
  public shutdown(): void {
    console.log("Shutting down learner...");
    this.engine.stop();
    console.log("Learner shutdown complete");
  }

  /**
   * Learn from a completed task
   */
  public async learnFrom(experience: Experience): Promise<void> {
    await this.engine.processExperience(experience);
  }

  /**
   * Find similar past experiences
   */
  public async findSimilarExperiences(currentTask: any): Promise<Experience[]> {
    return await this.manager.findSimilarExperiences(currentTask);
  }

  /**
   * Get learning metrics
   */
  public async getMetrics() {
    return await this.engine.getMetrics();
  }

  /**
   * Update learning policy
   */
  public updatePolicy(updates: any): void {
    this.manager.updateLearningPolicy(updates);
  }

  /**
   * Get current learning policy
   */
  public getPolicy() {
    return this.manager.getLearningPolicy();
  }

  /**
   * Get active learning sessions
   */
  public getActiveSessions() {
    return this.manager.getActiveSessions();
  }
}

// Export singleton instance
export const learner = Learner.getInstance();
