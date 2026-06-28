/**
 * Learning Engine
 * Core engine that orchestrates the learning pipeline
 */

import { Experience } from "./learning-types";
import { LearningManager } from "./manager";

export class LearningEngine {
  private static instance: LearningEngine;
  private learningManager: LearningManager;
  private isRunning: boolean = false;
  private backgroundInterval?: NodeJS.Timeout;

  private constructor() {
    this.learningManager = LearningManager.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): LearningEngine {
    if (!LearningEngine.instance) {
      LearningEngine.instance = new LearningEngine();
    }
    return LearningEngine.instance;
  }

  /**
   * Start the learning engine
   */
  public start(): void {
    if (this.isRunning) {
      console.warn("Learning engine is already running");
      return;
    }

    this.isRunning = true;
    console.log("Learning engine started");

    // Start background learning (runs every hour)
    this.backgroundInterval = setInterval(async () => {
      try {
        await this.learningManager.runBackgroundLearning();
      } catch (error) {
        console.error("Background learning error:", error);
      }
    }, 60 * 60 * 1000); // 1 hour
  }

  /**
   * Stop the learning engine
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.backgroundInterval) {
      clearInterval(this.backgroundInterval);
      this.backgroundInterval = undefined;
    }

    console.log("Learning engine stopped");
  }

  /**
   * Process a single experience
   */
  public async processExperience(experience: Experience): Promise<void> {
    if (!this.isRunning) {
      console.warn("Learning engine is not running");
      return;
    }

    await this.learningManager.processTaskCompletion(experience);
  }

  /**
   * Check if engine is running
   */
  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get learning metrics
   */
  public async getMetrics() {
    return await this.learningManager.getMetricsDashboard();
  }
}

// Export singleton instance
export const learningEngine = LearningEngine.getInstance();
