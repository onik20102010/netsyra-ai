/**
 * Memory Policy
 * Manages memory retrieval and storage policies
 */

import { Policy, Experience } from "../learning-types";

export class MemoryPolicy {
  private policy: Policy;
  private retrievalPerformance: Map<string, { success: number; total: number }> = new Map();

  constructor() {
    this.policy = {
      id: crypto.randomUUID(),
      name: "Memory Policy",
      type: "memory",
      description: "Determines memory retrieval strategies and storage policies",
      rules: [
        {
          condition: "memory_type == 'episodic'",
          action: "semantic_search",
          weight: 0.9,
          confidence: 0.85,
        },
        {
          condition: "memory_type == 'procedural'",
          action: "pattern_match",
          weight: 0.88,
          confidence: 0.82,
        },
        {
          condition: "memory_type == 'semantic'",
          action: "vector_similarity",
          weight: 0.92,
          confidence: 0.88,
        },
      ],
      priority: 1,
      successRate: 0.88,
      usageCount: 0,
      lastUpdated: Date.now(),
      version: 1,
      active: true,
    };
  }

  /**
   * Get memory retrieval strategy
   */
  public getRetrievalStrategy(memoryType: string): string {
    this.policy.usageCount++;

    for (const rule of this.policy.rules) {
      if (this.matchesCondition(rule.condition, { memory_type: memoryType })) {
        return rule.action;
      }
    }

    return "semantic_search"; // Default
  }

  /**
   * Check if condition matches
   */
  private matchesCondition(condition: string, context: any): boolean {
    const [field, operator, value] = condition.split(" ");

    if (operator === "==") {
      return context[field] === value.replace(/'/g, "");
    }

    return false;
  }

  /**
   * Update policy based on experience
   */
  public update(experience: Experience): void {
    // Check if memory was used successfully
    const memoryMistakes = experience.mistakes.filter(m => m.type === "missing_memory");
    const success = memoryMistakes.length === 0 ? 1 : 0;

    // Update overall success rate
    const currentRate = this.policy.successRate;
    const newRate = (currentRate * this.policy.usageCount + success) / (this.policy.usageCount + 1);
    this.policy.successRate = newRate;

    this.policy.lastUpdated = Date.now();
  }

  /**
   * Get policy
   */
  public getPolicy(): Policy {
    return { ...this.policy };
  }

  /**
   * Should store memory
   */
  public shouldStore(data: any): boolean {
    // Store if data is important or frequently used
    return data.importance > 0.7 || data.frequency > 3;
  }

  /**
   * Should compress memory
   */
  public shouldCompress(memoryAge: number): boolean {
    // Compress memories older than 30 days
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return memoryAge > thirtyDays;
  }
}
