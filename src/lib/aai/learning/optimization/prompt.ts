/**
 * Prompt Optimizer
 * Continuously improves internal prompts
 */

import { Experience, Optimization } from "../learning-types";

export class PromptOptimizer {
  private promptVersions: Map<string, PromptVersion> = new Map();
  private promptPerformance: Map<string, { success: number; total: number }> = new Map();

  constructor() {
    // Initialize with default prompts
    this.initializeDefaultPrompts();
  }

  /**
   * Initialize default prompts
   */
  private initializeDefaultPrompts(): void {
    const defaultPrompts = [
      {
        id: "planning",
        prompt: "Plan the task step by step, breaking it down into manageable subtasks.",
        version: 1,
      },
      {
        id: "reasoning",
        prompt: "Apply logical reasoning to solve the problem, considering multiple perspectives.",
        version: 1,
      },
      {
        id: "execution",
        prompt: "Execute the plan carefully, validating each step before proceeding.",
        version: 1,
      },
    ];

    defaultPrompts.forEach(p => {
      this.promptVersions.set(p.id, {
        id: p.id,
        prompt: p.prompt,
        version: p.version,
        createdAt: Date.now(),
        successRate: 0.8,
      });
    });
  }

  /**
   * Optimize prompts based on experience
   */
  public async optimize(experience: Experience): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    // Analyze which prompts were used and their effectiveness
    const promptIds = this.extractUsedPrompts(experience);

    for (const promptId of promptIds) {
      const optimization = this.optimizePrompt(promptId, experience);
      if (optimization) {
        optimizations.push(optimization);
      }
    }

    return optimizations;
  }

  /**
   * Extract used prompts from experience
   */
  private extractUsedPrompts(experience: Experience): string[] {
    // In production, this would extract actual prompt IDs from the experience
    return ["planning", "reasoning", "execution"];
  }

  /**
   * Optimize a specific prompt
   */
  private optimizePrompt(promptId: string, experience: Experience): Optimization | null {
    const currentVersion = this.promptVersions.get(promptId);
    if (!currentVersion) return null;

    // Update performance
    const perf = this.promptPerformance.get(promptId) || { success: 0, total: 0 };
    perf.total += 1;
    if (experience.success) {
      perf.success += 1;
    }
    this.promptPerformance.set(promptId, perf);

    // Check if optimization is needed
    const successRate = perf.success / perf.total;
    currentVersion.successRate = successRate;

    // If success rate is low, suggest optimization
    if (successRate < 0.7 && perf.total >= 5) {
      const newPrompt = this.generateImprovedPrompt(currentVersion.prompt, experience);

      return {
        id: crypto.randomUUID(),
        type: "prompt",
        target: promptId,
        description: `Optimize ${promptId} prompt for better performance`,
        before: currentVersion.prompt,
        after: newPrompt,
        improvement: 0.1, // Expected improvement
        confidence: 0.7,
        timestamp: Date.now(),
        status: "proposed",
      };
    }

    return null;
  }

  /**
   * Generate improved prompt
   */
  private generateImprovedPrompt(currentPrompt: string, experience: Experience): string {
    // Simple improvement strategy
    let improved = currentPrompt;

    // Add specificity based on mistakes
    if (experience.mistakes.some(m => m.type === "hallucination")) {
      improved += " Always verify facts before output.";
    }

    if (experience.mistakes.some(m => m.type === "wrong_assumption")) {
      improved += " Explicitly validate all assumptions.";
    }

    if (experience.mistakes.some(m => m.type === "missing_memory")) {
      improved += " Check memory for relevant information before proceeding.";
    }

    return improved;
  }

  /**
   * Apply optimization
   */
  public applyOptimization(optimization: Optimization): void {
    if (optimization.type !== "prompt") return;

    const currentVersion = this.promptVersions.get(optimization.target);
    if (!currentVersion) return;

    const newVersion: PromptVersion = {
      id: optimization.target,
      prompt: optimization.after,
      version: currentVersion.version + 1,
      createdAt: Date.now(),
      successRate: 0.8, // Reset for new version
    };

    this.promptVersions.set(optimization.target, newVersion);
  }

  /**
   * Get prompt by ID
   */
  public getPrompt(promptId: string): string | null {
    const version = this.promptVersions.get(promptId);
    return version ? version.prompt : null;
  }

  /**
   * Get all prompts
   */
  public getAllPrompts(): Map<string, string> {
    const prompts = new Map<string, string>();
    this.promptVersions.forEach((version, id) => {
      prompts.set(id, version.prompt);
    });
    return prompts;
  }
}

interface PromptVersion {
  id: string;
  prompt: string;
  version: number;
  createdAt: number;
  successRate: number;
}
