/**
 * Memory Optimizer
 * Optimizes memory storage and retrieval
 */

import { Experience, Optimization } from "../learning-types";

export class MemoryOptimizer {
  private memoryStrategies: Map<string, MemoryStrategy> = new Map();

  constructor() {
    this.initializeStrategies();
  }

  /**
   * Initialize default memory strategies
   */
  private initializeStrategies(): void {
    const strategies = [
      {
        id: "semantic",
        description: "Semantic search using embeddings",
        successRate: 0.92,
        avgRetrievalTime: 50,
      },
      {
        id: "keyword",
        description: "Keyword-based search",
        successRate: 0.78,
        avgRetrievalTime: 30,
      },
      {
        id: "hybrid",
        description: "Hybrid semantic and keyword search",
        successRate: 0.95,
        avgRetrievalTime: 40,
      },
    ];

    strategies.forEach(s => {
      this.memoryStrategies.set(s.id, s);
    });
  }

  /**
   * Optimize memory based on experience
   */
  public async optimize(experience: Experience): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    // Check if memory was used
    const memoryMistakes = experience.mistakes.filter(m => m.type === "missing_memory");
    
    if (memoryMistakes.length > 0) {
      // Suggest memory optimization
      const currentStrategy = this.getCurrentStrategy();
      const betterStrategy = this.findBetterStrategy();

      if (betterStrategy && betterStrategy !== currentStrategy) {
        optimizations.push({
          id: crypto.randomUUID(),
          type: "memory",
          target: currentStrategy,
          description: `Switch to ${betterStrategy} memory strategy`,
          before: currentStrategy,
          after: betterStrategy,
          improvement: 0.12,
          confidence: 0.8,
          timestamp: Date.now(),
          status: "proposed",
        });
      }

      // Suggest memory compression
      optimizations.push({
        id: crypto.randomUUID(),
        type: "memory",
        target: "compression",
        description: "Compress old memories to improve retrieval",
        before: "uncompressed",
        after: "compressed",
        improvement: 0.05,
        confidence: 0.7,
        timestamp: Date.now(),
        status: "proposed",
      });
    }

    return optimizations;
  }

  /**
   * Get current memory strategy
   */
  private getCurrentStrategy(): string {
    return "hybrid";
  }

  /**
   * Find better memory strategy
   */
  private findBetterStrategy(): string | null {
    let bestStrategy = null;
    let bestScore = 0;

    this.memoryStrategies.forEach((strategy, id) => {
      const score = (strategy.successRate * 0.8) + ((100 - strategy.avgRetrievalTime) / 100 * 0.2);
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = id;
      }
    });

    return bestStrategy;
  }

  /**
   * Get best strategy
   */
  public getBestStrategy(): string {
    let best = "hybrid";
    let bestScore = 0;

    this.memoryStrategies.forEach((strategy, id) => {
      const score = (strategy.successRate * 0.8) + ((100 - strategy.avgRetrievalTime) / 100 * 0.2);
      if (score > bestScore) {
        bestScore = score;
        best = id;
      }
    });

    return best;
  }

  /**
   * Get all strategies
   */
  public getAllStrategies(): Map<string, MemoryStrategy> {
    return new Map(this.memoryStrategies);
  }

  /**
   * Suggest memory compression
   */
  public shouldCompressMemory(memoryAge: number): boolean {
    // Compress memories older than 30 days
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    return memoryAge > thirtyDays;
  }

  /**
   * Suggest memory deduplication
   */
  public shouldDeduplicate(): boolean {
    // Run deduplication periodically
    return true;
  }
}

interface MemoryStrategy {
  id: string;
  description: string;
  successRate: number;
  avgRetrievalTime: number;
}
