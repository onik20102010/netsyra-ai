/**
 * Mistake Analyzer
 * Analyzes mistakes to identify root causes and patterns
 */

import { Experience, Reflection, Mistake } from "../learning-types";

export interface MistakeAnalysis {
  mistakes: Mistake[];
  patterns: MistakePattern[];
  clusters: MistakeCluster[];
  recommendations: string[];
}

export interface MistakePattern {
  type: string;
  frequency: number;
  commonCauses: string[];
  severity: "low" | "medium" | "high" | "critical";
}

export interface MistakeCluster {
  category: string;
  mistakes: Mistake[];
  frequency: number;
  impact: "low" | "medium" | "high";
}

export class MistakeAnalyzer {
  private mistakeHistory: Map<string, Mistake[]> = new Map();

  /**
   * Analyze mistakes from experience and reflection
   */
  public async analyze(experience: Experience, reflection: Reflection): Promise<MistakeAnalysis> {
    // Store mistakes for pattern analysis
    this.storeMistakes(experience.mistakes);

    return {
      mistakes: experience.mistakes,
      patterns: this.detectMistakePatterns(),
      clusters: this.clusterMistakes(experience.mistakes),
      recommendations: this.generateRecommendations(experience.mistakes),
    };
  }

  /**
   * Store mistakes for historical analysis
   */
  private storeMistakes(mistakes: Mistake[]): void {
    mistakes.forEach(mistake => {
      const typeMistakes = this.mistakeHistory.get(mistake.type) || [];
      typeMistakes.push(mistake);
      this.mistakeHistory.set(mistake.type, typeMistakes);
    });
  }

  /**
   * Detect mistake patterns
   */
  private detectMistakePatterns(): MistakePattern[] {
    const patterns: MistakePattern[] = [];

    this.mistakeHistory.forEach((mistakes, type) => {
      const frequency = mistakes.length;
      const severities = mistakes.map(m => m.severity);
      
      // Determine overall severity
      let severity: "low" | "medium" | "high" | "critical" = "low";
      if (severities.includes("critical")) severity = "critical";
      else if (severities.includes("high")) severity = "high";
      else if (severities.includes("medium")) severity = "medium";

      // Extract common causes
      const commonCauses = this.extractCommonCauses(mistakes);

      patterns.push({
        type,
        frequency,
        commonCauses,
        severity,
      });
    });

    return patterns.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Extract common causes from mistakes
   */
  private extractCommonCauses(mistakes: Mistake[]): string[] {
    const causes = mistakes
      .map(m => m.cause)
      .filter((c): c is string => c !== undefined);

    // Count frequency
    const causeCounts: Record<string, number> = {};
    causes.forEach(cause => {
      causeCounts[cause] = (causeCounts[cause] || 0) + 1;
    });

    // Return top causes
    return Object.entries(causeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cause]) => cause);
  }

  /**
   * Cluster mistakes by category
   */
  private clusterMistakes(mistakes: Mistake[]): MistakeCluster[] {
    const clusters: Map<string, MistakeCluster> = new Map();

    mistakes.forEach(mistake => {
      const category = this.categorizeMistake(mistake);
      
      const existing = clusters.get(category);
      if (existing) {
        existing.mistakes.push(mistake);
        existing.frequency++;
      } else {
        clusters.set(category, {
          category,
          mistakes: [mistake],
          frequency: 1,
          impact: this.calculateClusterImpact([mistake]),
        });
      }
    });

    return Array.from(clusters.values());
  }

  /**
   * Categorize mistake
   */
  private categorizeMistake(mistake: Mistake): string {
    switch (mistake.type) {
      case "wrong_assumption":
      case "hallucination":
        return "reasoning";
      case "missing_memory":
        return "memory";
      case "wrong_planner":
        return "planner";
      case "wrong_tool":
        return "tool";
      case "safety_violation":
        return "safety";
      default:
        return "other";
    }
  }

  /**
   * Calculate cluster impact
   */
  private calculateClusterImpact(mistakes: Mistake[]): "low" | "medium" | "high" {
    if (mistakes.length === 0) return "low";

    const severities = mistakes.map(m => m.severity);
    if (severities.includes("critical")) return "high";
    if (severities.includes("high")) return "high";
    if (severities.includes("medium")) return "medium";
    return "low";
  }

  /**
   * Generate recommendations based on mistakes
   */
  private generateRecommendations(mistakes: Mistake[]): string[] {
    const recommendations: string[] = [];

    const types = new Set(mistakes.map(m => m.type));

    if (types.has("wrong_assumption")) {
      recommendations.push("Improve assumption validation in planning phase");
    }

    if (types.has("missing_memory")) {
      recommendations.push("Enhance memory retrieval and storage mechanisms");
    }

    if (types.has("wrong_planner")) {
      recommendations.push("Review and update planning strategies");
    }

    if (types.has("wrong_tool")) {
      recommendations.push("Improve tool selection algorithms");
    }

    if (types.has("hallucination")) {
      recommendations.push("Add fact-checking and verification steps");
    }

    if (types.has("safety_violation")) {
      recommendations.push("Strengthen safety checks and constraints");
    }

    return recommendations;
  }

  /**
   * Get mistake statistics
   */
  public getStatistics() {
    const allMistakes = Array.from(this.mistakeHistory.values()).flat();
    
    return {
      totalMistakes: allMistakes.length,
      byType: Object.fromEntries(
        Array.from(this.mistakeHistory.entries()).map(([type, mistakes]) => [
          type,
          mistakes.length,
        ])
      ),
      bySeverity: this.countBySeverity(allMistakes),
    };
  }

  /**
   * Count mistakes by severity
   */
  private countBySeverity(mistakes: Mistake[]): Record<string, number> {
    const counts: Record<string, number> = {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    };

    mistakes.forEach(mistake => {
      counts[mistake.severity]++;
    });

    return counts;
  }
}
