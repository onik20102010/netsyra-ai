/**
 * Experience Recorder
 * Records every execution as an experience
 */

import { Experience } from "../learning-types";

export class ExperienceRecorder {
  private experiences: Map<string, Experience> = new Map();

  /**
   * Record an experience
   */
  public async record(experience: Experience): Promise<void> {
    // Store in memory
    this.experiences.set(experience.id, experience);

    // TODO: Persist to storage when storage system is available
    // await this.storage.save('experience', experience.id, experience);

    console.log(`Experience recorded: ${experience.id}`);
  }

  /**
   * Get an experience by ID
   */
  public getExperience(id: string): Experience | undefined {
    return this.experiences.get(id);
  }

  /**
   * Get all experiences
   */
  public getAllExperiences(): Experience[] {
    return Array.from(this.experiences.values());
  }

  /**
   * Get experiences by conversation ID
   */
  public getExperiencesByConversation(conversationId: string): Experience[] {
    return Array.from(this.experiences.values()).filter(
      exp => exp.conversationId === conversationId
    );
  }

  /**
   * Get experiences by user ID
   */
  public getExperiencesByUser(userId: string): Experience[] {
    return Array.from(this.experiences.values()).filter(
      exp => exp.userId === userId
    );
  }

  /**
   * Get successful experiences
   */
  public getSuccessfulExperiences(): Experience[] {
    return Array.from(this.experiences.values()).filter(exp => exp.success);
  }

  /**
   * Get failed experiences
   */
  public getFailedExperiences(): Experience[] {
    return Array.from(this.experiences.values()).filter(exp => !exp.success);
  }

  /**
   * Get experiences by time range
   */
  public getExperiencesByTimeRange(startTime: number, endTime: number): Experience[] {
    return Array.from(this.experiences.values()).filter(
      exp => exp.timestamp >= startTime && exp.timestamp <= endTime
    );
  }

  /**
   * Delete an experience
   */
  public deleteExperience(id: string): boolean {
    return this.experiences.delete(id);
  }

  /**
   * Clear all experiences
   */
  public clearAll(): void {
    this.experiences.clear();
  }

  /**
   * Get experience count
   */
  public getCount(): number {
    return this.experiences.size;
  }
}
