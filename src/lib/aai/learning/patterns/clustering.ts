/**
 * Pattern Clustering
 * Clusters similar patterns together
 */

import { Pattern } from "../learning-types";

export interface PatternCluster {
  id: string;
  patterns: Pattern[];
  category: string;
  frequency: number;
  confidence: number;
}

export class PatternClustering {
  /**
   * Cluster patterns by similarity
   */
  public cluster(patterns: Pattern[]): PatternCluster[] {
    const clusters: Map<string, PatternCluster> = new Map();

    patterns.forEach(pattern => {
      const category = this.categorizePattern(pattern);
      
      const existing = clusters.get(category);
      if (existing) {
        existing.patterns.push(pattern);
        existing.frequency += pattern.frequency;
        existing.confidence = (existing.confidence + pattern.confidence) / 2;
      } else {
        clusters.set(category, {
          id: crypto.randomUUID(),
          patterns: [pattern],
          category,
          frequency: pattern.frequency,
          confidence: pattern.confidence,
        });
      }
    });

    return Array.from(clusters.values());
  }

  /**
   * Categorize a pattern
   */
  private categorizePattern(pattern: Pattern): string {
    if (pattern.description.toLowerCase().includes("tool")) {
      return "tool_usage";
    }

    if (pattern.description.toLowerCase().includes("mistake")) {
      return "mistakes";
    }

    if (pattern.description.toLowerCase().includes("sequence")) {
      return "sequences";
    }

    if (pattern.description.toLowerCase().includes("api")) {
      return "api_patterns";
    }

    return "other";
  }

  /**
   * Find similar patterns
   */
  public findSimilar(pattern: Pattern, allPatterns: Pattern[]): Pattern[] {
    return allPatterns
      .filter(p => p.id !== pattern.id)
      .filter(p => this.calculateSimilarity(pattern, p) > 0.5)
      .sort((a, b) => this.calculateSimilarity(pattern, b) - this.calculateSimilarity(pattern, a));
  }

  /**
   * Calculate similarity between patterns
   */
  private calculateSimilarity(pattern1: Pattern, pattern2: Pattern): number {
    let similarity = 0;

    // Same type
    if (pattern1.type === pattern2.type) {
      similarity += 0.3;
    }

    // Same affects
    const commonAffects = pattern1.affects.filter(a => pattern2.affects.includes(a));
    similarity += (commonAffects.length / Math.max(pattern1.affects.length, pattern2.affects.length)) * 0.4;

    // Description similarity
    const words1 = pattern1.description.toLowerCase().split(/\s+/);
    const words2 = pattern2.description.toLowerCase().split(/\s+/);
    const commonWords = words1.filter(w => words2.includes(w));
    similarity += (commonWords.length / Math.max(words1.length, words2.length)) * 0.3;

    return similarity;
  }
}
