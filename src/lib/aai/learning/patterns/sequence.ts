/**
 * Sequence Pattern Analyzer
 * Analyzes sequential patterns in task execution
 */

import { Experience } from "../learning-types";

export interface SequencePattern {
  sequence: string[];
  frequency: number;
  confidence: number;
  averageDuration: number;
  averageSuccess: number;
}

export class SequenceAnalyzer {
  private sequences: Map<string, SequencePattern> = new Map();

  /**
   * Analyze sequences from experiences
   */
  public analyze(experiences: Experience[]): SequencePattern[] {
    experiences.forEach(exp => {
      this.extractSequence(exp);
    });

    return Array.from(this.sequences.values()).sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Extract sequence from experience
   */
  private extractSequence(experience: Experience): void {
    const sequenceKey = experience.plan.map(t => t.description.substring(0, 30)).join(" -> ");

    const existing = this.sequences.get(sequenceKey);
    if (existing) {
      existing.frequency++;
      existing.averageDuration = (existing.averageDuration * (existing.frequency - 1) + experience.duration) / existing.frequency;
      existing.averageSuccess = (existing.averageSuccess * (existing.frequency - 1) + (experience.success ? 1 : 0)) / existing.frequency;
      existing.confidence = Math.min(1, existing.confidence + 0.05);
    } else {
      this.sequences.set(sequenceKey, {
        sequence: experience.plan.map(t => t.description),
        frequency: 1,
        confidence: 0.5,
        averageDuration: experience.duration,
        averageSuccess: experience.success ? 1 : 0,
      });
    }
  }

  /**
   * Get most common sequences
   */
  public getMostCommon(limit: number = 10): SequencePattern[] {
    return Array.from(this.sequences.values())
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  /**
   * Get most successful sequences
   */
  public getMostSuccessful(limit: number = 10): SequencePattern[] {
    return Array.from(this.sequences.values())
      .filter(s => s.frequency >= 2)
      .sort((a, b) => b.averageSuccess - a.averageSuccess)
      .slice(0, limit);
  }

  /**
   * Get fastest sequences
   */
  public getFastest(limit: number = 10): SequencePattern[] {
    return Array.from(this.sequences.values())
      .filter(s => s.frequency >= 2)
      .sort((a, b) => a.averageDuration - b.averageDuration)
      .slice(0, limit);
  }
}
