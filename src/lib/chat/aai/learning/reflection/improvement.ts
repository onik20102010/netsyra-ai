/**
 * Improvement Generator
 * Generates improvement suggestions based on analysis
 */

import { Experience, Reflection } from "../learning-types";

export interface ImprovementSuggestion {
  id: string;
  category: string;
  priority: "low" | "medium" | "high" | "critical";
  description: string;
  action: string;
  expectedImpact: number;
  effort: "low" | "medium" | "high";
}

export class ImprovementGenerator {
  /**
   * Generate improvement suggestions
   */
  public generate(experience: Experience, reflection: Reflection): ImprovementSuggestion[] {
    const suggestions: ImprovementSuggestion[] = [];

    // Analyze mistakes for improvements
    experience.mistakes.forEach(mistake => {
      const suggestion = this.generateMistakeImprovement(mistake);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    });

    // Analyze reflection for improvements
    reflection.whatShouldImprove.forEach(improvement => {
      const suggestion = this.generateReflectionImprovement(improvement);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    });

    // Analyze performance metrics
    if (experience.duration > 300) {
      suggestions.push({
        id: crypto.randomUUID(),
        category: "performance",
        priority: "medium",
        description: "Reduce execution time",
        action: "Optimize workflow and parallelize independent tasks",
        expectedImpact: 0.7,
        effort: "medium",
      });
    }

    if (experience.tokensUsed > 50000) {
      suggestions.push({
        id: crypto.randomUUID(),
        category: "cost",
        priority: "medium",
        description: "Reduce token consumption",
        action: "Optimize prompts and use more efficient models where appropriate",
        expectedImpact: 0.6,
        effort: "low",
      });
    }

    // Sort by priority and expected impact
    return suggestions.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || 
             b.expectedImpact - a.expectedImpact;
    });
  }

  /**
   * Generate improvement for a specific mistake
   */
  private generateMistakeImprovement(mistake: any): ImprovementSuggestion | null {
    switch (mistake.type) {
      case "wrong_assumption":
        return {
          id: crypto.randomUUID(),
          category: "reasoning",
          priority: mistake.severity === "critical" ? "high" : "medium",
          description: "Prevent wrong assumptions",
          action: "Add assumption validation step in planning phase",
          expectedImpact: 0.8,
          effort: "medium",
        };

      case "missing_memory":
        return {
          id: crypto.randomUUID(),
          category: "memory",
          priority: "high",
          description: "Improve memory retrieval",
          action: "Enhance memory indexing and retrieval algorithms",
          expectedImpact: 0.9,
          effort: "high",
        };

      case "wrong_planner":
        return {
          id: crypto.randomUUID(),
          category: "planning",
          priority: "high",
          description: "Fix planner selection",
          action: "Update planner selection policy based on task type",
          expectedImpact: 0.85,
          effort: "medium",
        };

      case "wrong_tool":
        return {
          id: crypto.randomUUID(),
          category: "tools",
          priority: "medium",
          description: "Improve tool selection",
          action: "Update tool selection heuristics and reliability tracking",
          expectedImpact: 0.75,
          effort: "low",
        };

      case "hallucination":
        return {
          id: crypto.randomUUID(),
          category: "reasoning",
          priority: "critical",
          description: "Prevent hallucinations",
          action: "Add fact-checking and verification steps",
          expectedImpact: 0.95,
          effort: "high",
        };

      case "safety_violation":
        return {
          id: crypto.randomUUID(),
          category: "safety",
          priority: "critical",
          description: "Prevent safety violations",
          action: "Strengthen safety checks and add pre-execution validation",
          expectedImpact: 1.0,
          effort: "high",
        };

      default:
        return null;
    }
  }

  /**
   * Generate improvement from reflection
   */
  private generateReflectionImprovement(improvement: string): ImprovementSuggestion | null {
    if (improvement.includes("speed")) {
      return {
        id: crypto.randomUUID(),
        category: "performance",
        priority: "medium",
        description: improvement,
        action: "Optimize execution workflow and reduce unnecessary steps",
        expectedImpact: 0.6,
        effort: "medium",
      };
    }

    if (improvement.includes("token")) {
      return {
        id: crypto.randomUUID(),
        category: "cost",
        priority: "low",
        description: improvement,
        action: "Optimize prompt engineering and use caching",
        expectedImpact: 0.5,
        effort: "low",
      };
    }

    if (improvement.includes("confidence")) {
      return {
        id: crypto.randomUUID(),
        category: "planning",
        priority: "medium",
        description: improvement,
        action: "Improve planning confidence estimation",
        expectedImpact: 0.7,
        effort: "medium",
      };
    }

    return null;
  }
}
