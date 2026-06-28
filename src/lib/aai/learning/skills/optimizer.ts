/**
 * Skill Optimizer
 * Optimizes skills for better performance
 */

import { Skill } from "../learning-types";

export class SkillOptimizer {
  /**
   * Optimize a skill based on usage data
   */
  public optimize(skill: Skill): Skill {
    const optimized = { ...skill };

    // Optimize workflow
    optimized.workflow = this.optimizeWorkflow(skill.workflow);

    // Optimize tool selection
    optimized.tools = this.optimizeTools(skill.tools, skill.successRate);

    // Update confidence based on performance
    optimized.confidence = this.calculateOptimizedConfidence(skill);

    optimized.updatedAt = Date.now();

    return optimized;
  }

  /**
   * Optimize workflow steps
   */
  private optimizeWorkflow(workflow: any[]): any[] {
    // Remove redundant steps
    const optimized = workflow.filter((step, index, self) => {
      return self.findIndex(s => s.action === step.action) === index;
    });

    // Sort for efficiency
    return optimized.sort((a, b) => a.step - b.step);
  }

  /**
   * Optimize tool selection
   */
  private optimizeTools(tools: string[], successRate: number): string[] {
    // If success rate is low, consider alternative tools
    if (successRate < 0.7) {
      // In production, this would suggest alternative tools
      return tools;
    }

    return tools;
  }

  /**
   * Calculate optimized confidence
   */
  private calculateOptimizedConfidence(skill: Skill): number {
    let confidence = skill.confidence;

    // Boost confidence based on success rate
    if (skill.successRate > 0.9) {
      confidence = Math.min(1, confidence + 0.1);
    }

    // Reduce confidence if rarely used
    if (skill.usageCount < 5) {
      confidence = Math.max(0.5, confidence - 0.1);
    }

    return confidence;
  }

  /**
   * Suggest improvements for a skill
   */
  public suggestImprovements(skill: Skill): string[] {
    const suggestions: string[] = [];

    if (skill.successRate < 0.8) {
      suggestions.push("Consider reviewing and updating the workflow");
    }

    if (skill.usageCount < 5) {
      suggestions.push("Skill needs more usage to validate effectiveness");
    }

    if (skill.confidence < 0.7) {
      suggestions.push("Low confidence - may need refinement");
    }

    if (skill.tools.length === 0) {
      suggestions.push("Consider adding tools for automation");
    }

    if (skill.workflow.length > 10) {
      suggestions.push("Workflow is complex - consider breaking into smaller skills");
    }

    return suggestions;
  }
}
