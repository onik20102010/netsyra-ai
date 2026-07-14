import { Goal, ValidationResult } from "../planner-types";

export class GoalValidator {
  public static validateGoal(goal: Goal): ValidationResult {
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (!goal.title || goal.title.trim().length === 0) {
      issues.push("Goal must have a title");
    }

    if (!goal.description || goal.description.trim().length === 0) {
      issues.push("Goal must have a description");
    }

    if (goal.confidence < 0 || goal.confidence > 1) {
      issues.push("Confidence must be between 0 and 1");
    }

    if (goal.progress < 0 || goal.progress > 1) {
      issues.push("Progress must be between 0 and 1");
    }

    if (goal.estimatedComplexity < 0 || goal.estimatedComplexity > 10) {
      issues.push("Estimated complexity must be between 0 and 10");
    }

    if (issues.length === 0 && goal.estimatedTasks.length === 0) {
      suggestions.push("Consider adding estimated tasks for better planning");
    }

    return {
      valid: issues.length === 0,
      issues,
      suggestions,
      confidenceScore: goal.confidence,
      safetyScore: 0.8,
      feasibilityScore: 0.7,
    };
  }
}
