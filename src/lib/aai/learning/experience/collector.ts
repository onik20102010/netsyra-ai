/**
 * Experience Collector
 * Collects pending experiences for batch processing
 */

import { Experience } from "../learning-types";
import { ExperienceRecorder } from "./recorder";

export class ExperienceCollector {
  private recorder: ExperienceRecorder;
  private processedIds: Set<string> = new Set();

  constructor() {
    this.recorder = new ExperienceRecorder();
  }

  /**
   * Collect pending experiences (not yet processed)
   */
  public async collectPending(): Promise<Experience[]> {
    const allExperiences = this.recorder.getAllExperiences();
    const pending = allExperiences.filter(exp => !this.processedIds.has(exp.id));
    
    return pending;
  }

  /**
   * Mark experience as processed
   */
  public markAsProcessed(experienceId: string): void {
    this.processedIds.add(experienceId);
  }

  /**
   * Mark multiple experiences as processed
   */
  public markManyAsProcessed(experienceIds: string[]): void {
    experienceIds.forEach(id => this.processedIds.add(id));
  }

  /**
   * Get count of pending experiences
   */
  public getPendingCount(): number {
    return this.recorder.getCount() - this.processedIds.size;
  }

  /**
   * Clear processed cache
   */
  public clearProcessedCache(): void {
    this.processedIds.clear();
  }
}
