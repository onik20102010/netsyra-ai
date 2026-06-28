/**
 * Reflection Engine
 * Performs self-review and reflection after each task
 */

import { Experience, Reflection } from "../learning-types";

export class ReflectionEngine {
  private reflections: Map<string, Reflection> = new Map();

  /**
   * Reflect on an experience
   */
  public async reflect(experience: Experience): Promise<Reflection> {
    const reflection: Reflection = {
      id: crypto.randomUUID(),
      experienceId: experience.id,
      timestamp: Date.now(),
      
      // Self-Review
      whatHappened: this.generateWhatHappened(experience),
      why: this.generateWhy(experience),
      whatFailed: this.generateWhatFailed(experience),
      whatSucceeded: this.generateWhatSucceeded(experience),
      whatShouldImprove: this.generateWhatShouldImprove(experience),
      
      // Analysis
      rootCauses: this.analyzeRootCauses(experience),
      lessons: [],
      confidence: experience.confidence,
    };

    // Store reflection
    this.reflections.set(reflection.id, reflection);

    return reflection;
  }

  /**
   * Generate "what happened" summary
   */
  private generateWhatHappened(experience: Experience): string {
    const status = experience.success ? "succeeded" : "failed";
    const taskCount = experience.plan.length;
    const duration = Math.round(experience.duration);
    
    return `Task ${status}. Executed ${taskCount} tasks in ${duration}s using ${experience.tokensUsed} tokens.`;
  }

  /**
   * Generate "why" analysis
   */
  private generateWhy(experience: Experience): string {
    if (experience.success) {
      return "Task completed successfully due to effective planning and tool usage.";
    } else {
      return "Task failed due to mistakes encountered during execution.";
    }
  }

  /**
   * Generate what failed
   */
  private generateWhatFailed(experience: Experience): string[] {
    const failures: string[] = [];
    
    experience.mistakes.forEach(mistake => {
      failures.push(`${mistake.type}: ${mistake.description}`);
    });

    if (!experience.success && experience.result.error) {
      failures.push(`Final error: ${experience.result.error}`);
    }

    return failures;
  }

  /**
   * Generate what succeeded
   */
  private generateWhatSucceeded(experience: Experience): string[] {
    const successes: string[] = [];
    
    if (experience.success) {
      successes.push("Overall task completion");
    }

    const successfulTasks = experience.plan.filter(t => t.status === "completed");
    if (successfulTasks.length > 0) {
      successes.push(`${successfulTasks.length} tasks completed successfully`);
    }

    const successfulTools = experience.toolsUsed.filter(t => t.success);
    if (successfulTools.length > 0) {
      successes.push(`${successfulTools.length} tools used successfully`);
    }

    return successes;
  }

  /**
   * Generate what should improve
   */
  private generateWhatShouldImprove(experience: Experience): string[] {
    const improvements: string[] = [];
    
    if (experience.mistakes.length > 0) {
      improvements.push("Reduce mistake frequency");
    }

    if (experience.duration > 300) {
      improvements.push("Improve execution speed");
    }

    if (experience.tokensUsed > 50000) {
      improvements.push("Optimize token usage");
    }

    const failedTools = experience.toolsUsed.filter(t => !t.success);
    if (failedTools.length > 0) {
      improvements.push("Improve tool selection and usage");
    }

    if (experience.confidence < 0.8) {
      improvements.push("Increase confidence in planning");
    }

    return improvements;
  }

  /**
   * Analyze root causes
   */
  private analyzeRootCauses(experience: Experience): any[] {
    const rootCauses: any[] = [];
    
    experience.mistakes.forEach(mistake => {
      let category = "other";
      
      switch (mistake.type) {
        case "wrong_assumption":
        case "hallucination":
          category = "reasoning";
          break;
        case "missing_memory":
          category = "memory";
          break;
        case "wrong_planner":
          category = "planner";
          break;
        case "wrong_tool":
          category = "tool";
          break;
        case "safety_violation":
          category = "policy";
          break;
      }

      rootCauses.push({
        category,
        description: mistake.description,
        frequency: 1,
        impact: mistake.severity,
      });
    });

    return rootCauses;
  }

  /**
   * Get reflection by ID
   */
  public getReflection(id: string): Reflection | undefined {
    return this.reflections.get(id);
  }

  /**
   * Get reflections by experience ID
   */
  public getReflectionsByExperience(experienceId: string): Reflection[] {
    return Array.from(this.reflections.values()).filter(
      ref => ref.experienceId === experienceId
    );
  }

  /**
   * Get all reflections
   */
  public getAllReflections(): Reflection[] {
    return Array.from(this.reflections.values());
  }

  /**
   * Get accuracy metric
   */
  public async getAccuracy(): Promise<number> {
    // This would be calculated based on actual reflection accuracy
    return 0.91;
  }
}
