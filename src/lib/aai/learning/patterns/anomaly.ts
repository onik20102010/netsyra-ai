/**
 * Anomaly Detector
 * Detects anomalous patterns in experiences
 */

import { Experience } from "../learning-types";

export interface Anomaly {
  id: string;
  type: "duration" | "tokens" | "mistakes" | "tools";
  description: string;
  severity: "low" | "medium" | "high";
  experienceId: string;
  value: number;
  expectedRange: [number, number];
}

export class AnomalyDetector {
  private anomalies: Anomaly[] = [];

  /**
   * Detect anomalies in an experience
   */
  public detect(experience: Experience, allExperiences: Experience[]): Anomaly[] {
    const detectedAnomalies: Anomaly[] = [];

    // Check duration anomaly
    const durationAnomaly = this.checkDurationAnomaly(experience, allExperiences);
    if (durationAnomaly) {
      detectedAnomalies.push(durationAnomaly);
    }

    // Check token anomaly
    const tokenAnomaly = this.checkTokenAnomaly(experience, allExperiences);
    if (tokenAnomaly) {
      detectedAnomalies.push(tokenAnomaly);
    }

    // Check mistake anomaly
    const mistakeAnomaly = this.checkMistakeAnomaly(experience, allExperiences);
    if (mistakeAnomaly) {
      detectedAnomalies.push(mistakeAnomaly);
    }

    // Store anomalies
    this.anomalies.push(...detectedAnomalies);

    return detectedAnomalies;
  }

  /**
   * Check duration anomaly
   */
  private checkDurationAnomaly(experience: Experience, allExperiences: Experience[]): Anomaly | null {
    if (allExperiences.length < 5) return null;

    const durations = allExperiences.map(e => e.duration);
    const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
    const stdDev = Math.sqrt(durations.reduce((sum, d) => sum + Math.pow(d - mean, 2), 0) / durations.length);

    const threshold = 2 * stdDev; // 2 standard deviations

    if (Math.abs(experience.duration - mean) > threshold) {
      return {
        id: crypto.randomUUID(),
        type: "duration",
        description: `Unusual duration: ${experience.duration}s (expected: ${mean.toFixed(0)} ± ${threshold.toFixed(0)}s)`,
        severity: Math.abs(experience.duration - mean) > 3 * stdDev ? "high" : "medium",
        experienceId: experience.id,
        value: experience.duration,
        expectedRange: [mean - threshold, mean + threshold],
      };
    }

    return null;
  }

  /**
   * Check token anomaly
   */
  private checkTokenAnomaly(experience: Experience, allExperiences: Experience[]): Anomaly | null {
    if (allExperiences.length < 5) return null;

    const tokens = allExperiences.map(e => e.tokensUsed);
    const mean = tokens.reduce((a, b) => a + b, 0) / tokens.length;
    const stdDev = Math.sqrt(tokens.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / tokens.length);

    const threshold = 2 * stdDev;

    if (Math.abs(experience.tokensUsed - mean) > threshold) {
      return {
        id: crypto.randomUUID(),
        type: "tokens",
        description: `Unusual token usage: ${experience.tokensUsed} (expected: ${mean.toFixed(0)} ± ${threshold.toFixed(0)})`,
        severity: Math.abs(experience.tokensUsed - mean) > 3 * stdDev ? "high" : "medium",
        experienceId: experience.id,
        value: experience.tokensUsed,
        expectedRange: [mean - threshold, mean + threshold],
      };
    }

    return null;
  }

  /**
   * Check mistake anomaly
   */
  private checkMistakeAnomaly(experience: Experience, allExperiences: Experience[]): Anomaly | null {
    if (allExperiences.length < 5) return null;

    const mistakes = allExperiences.map(e => e.mistakes.length);
    const mean = mistakes.reduce((a, b) => a + b, 0) / mistakes.length;

    if (experience.mistakes.length > mean + 2) {
      return {
        id: crypto.randomUUID(),
        type: "mistakes",
        description: `Unusual mistake count: ${experience.mistakes.length} (expected: ${mean.toFixed(1)})`,
        severity: experience.mistakes.length > mean + 5 ? "high" : "medium",
        experienceId: experience.id,
        value: experience.mistakes.length,
        expectedRange: [0, mean + 2],
      };
    }

    return null;
  }

  /**
   * Get all anomalies
   */
  public getAllAnomalies(): Anomaly[] {
    return [...this.anomalies];
  }

  /**
   * Get anomalies by type
   */
  public getAnomaliesByType(type: string): Anomaly[] {
    return this.anomalies.filter(a => a.type === type);
  }

  /**
   * Get anomalies by severity
   */
  public getAnomaliesBySeverity(severity: string): Anomaly[] {
    return this.anomalies.filter(a => a.severity === severity);
  }

  /**
   * Clear anomalies
   */
  public clear(): void {
    this.anomalies = [];
  }
}
