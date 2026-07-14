/**
 * Tool Selection Policy
 * Manages tool selection based on reliability and performance
 */

import { Policy, Experience, ToolUsage } from "../learning-types";

export class ToolSelectionPolicy {
  private policy: Policy;
  private toolPerformance: Map<string, { success: number; total: number; avgLatency: number }> = new Map();

  constructor() {
    this.policy = {
      id: crypto.randomUUID(),
      name: "Tool Selection Policy",
      type: "tool_selection",
      description: "Selects the best tools based on historical performance",
      rules: [],
      priority: 1,
      successRate: 0.9,
      usageCount: 0,
      lastUpdated: Date.now(),
      version: 1,
      active: true,
    };
  }

  /**
   * Get best tool for a task
   */
  public getBestTool(availableTools: string[], task: string): string {
    this.policy.usageCount++;

    if (availableTools.length === 0) return "";

    // Score tools based on performance
    const scoredTools = availableTools.map(tool => ({
      tool,
      score: this.scoreTool(tool),
    }));

    // Sort by score and return best
    scoredTools.sort((a, b) => b.score - a.score);
    return scoredTools[0].tool;
  }

  /**
   * Score a tool based on performance
   */
  private scoreTool(tool: string): number {
    const perf = this.toolPerformance.get(tool);
    if (!perf || perf.total === 0) return 0.5; // Default score for new tools

    const successRate = perf.success / perf.total;
    const latencyScore = Math.max(0, 1 - perf.avgLatency / 10); // Prefer faster tools

    return (successRate * 0.7) + (latencyScore * 0.3);
  }

  /**
   * Update policy based on experience
   */
  public update(experience: Experience): void {
    experience.toolsUsed.forEach(toolUsage => {
      const perf = this.toolPerformance.get(toolUsage.toolName) || {
        success: 0,
        total: 0,
        avgLatency: 0,
      };

      perf.total += 1;
      if (toolUsage.success) {
        perf.success += 1;
      }

      // Update average latency
      perf.avgLatency = (perf.avgLatency * (perf.total - 1) + toolUsage.duration) / perf.total;

      this.toolPerformance.set(toolUsage.toolName, perf);
    });

    // Update overall success rate
    const allPerf = Array.from(this.toolPerformance.values());
    const totalSuccess = allPerf.reduce((sum, p) => sum + p.success, 0);
    const totalTasks = allPerf.reduce((sum, p) => sum + p.total, 0);
    this.policy.successRate = totalTasks > 0 ? totalSuccess / totalTasks : 0;

    this.policy.lastUpdated = Date.now();
  }

  /**
   * Get tool reliability
   */
  public getToolReliability(tool: string): { successRate: number; avgLatency: number } | null {
    const perf = this.toolPerformance.get(tool);
    if (!perf || perf.total === 0) return null;

    return {
      successRate: perf.success / perf.total,
      avgLatency: perf.avgLatency,
    };
  }

  /**
   * Get all tool reliabilities
   */
  public getAllToolReliabilities(): Record<string, { successRate: number; avgLatency: number }> {
    const result: Record<string, { successRate: number; avgLatency: number }> = {};

    this.toolPerformance.forEach((perf, tool) => {
      if (perf.total > 0) {
        result[tool] = {
          successRate: perf.success / perf.total,
          avgLatency: perf.avgLatency,
        };
      }
    });

    return result;
  }

  /**
   * Get policy
   */
  public getPolicy(): Policy {
    return { ...this.policy };
  }
}
