/**
 * Skill Compiler
 * Compiles and optimizes extracted skills
 */

import { Skill, SkillVersion } from "../learning-types";

export class SkillCompiler {
  /**
   * Compile a skill for execution
   */
  public compile(skill: Skill): CompiledSkill {
    return {
      id: skill.id,
      name: skill.name,
      trigger: skill.trigger,
      workflow: this.optimizeWorkflow(skill.workflow),
      tools: skill.tools,
      prompts: skill.prompts,
      version: skill.version,
      confidence: skill.confidence,
    };
  }

  /**
   * Optimize workflow steps
   */
  private optimizeWorkflow(workflow: any[]): any[] {
    // Remove redundant steps
    const optimized = workflow.filter((step, index, self) => {
      return self.findIndex(s => s.action === step.action) === index;
    });

    // Sort by dependencies (simple version)
    return optimized.sort((a, b) => a.step - b.step);
  }

  /**
   * Create a new version of a skill
   */
  public createVersion(skill: Skill, changes: string): Skill {
    const newVersion: SkillVersion = {
      version: skill.version + 1,
      changes,
      successRate: skill.successRate,
      timestamp: Date.now(),
    };

    const updatedSkill: Skill = {
      ...skill,
      version: skill.version + 1,
      history: [...skill.history, newVersion],
      updatedAt: Date.now(),
    };

    return updatedSkill;
  }

  /**
   * Merge similar skills
   */
  public mergeSkills(skills: Skill[]): Skill | null {
    if (skills.length === 0) return null;
    if (skills.length === 1) return skills[0];

    // Create merged skill
    const merged: Skill = {
      id: crypto.randomUUID(),
      name: skills[0].name,
      description: `Merged skill from ${skills.length} similar skills`,
      category: skills[0].category,
      trigger: skills[0].trigger,
      workflow: this.mergeWorkflows(skills.map(s => s.workflow)),
      tools: this.mergeTools(skills.map(s => s.tools)),
      prompts: this.mergePrompts(skills.map(s => s.prompts)),
      version: 1,
      successRate: this.averageSuccessRate(skills),
      usageCount: skills.reduce((sum, s) => sum + s.usageCount, 0),
      lastUsed: Math.max(...skills.map(s => s.lastUsed)),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: [],
      confidence: this.averageConfidence(skills),
    };

    return merged;
  }

  /**
   * Merge workflows
   */
  private mergeWorkflows(workflows: any[][]): any[] {
    const allSteps = workflows.flat();
    
    // Deduplicate
    const uniqueSteps = allSteps.filter((step, index, self) => {
      return self.findIndex(s => s.action === step.action) === index;
    });

    return uniqueSteps;
  }

  /**
   * Merge tool lists
   */
  private mergeTools(tools: string[][]): string[] {
    const allTools = tools.flat();
    return [...new Set(allTools)];
  }

  /**
   * Merge prompt objects
   */
  private mergePrompts(prompts: Record<string, string>[]): Record<string, string> {
    const merged: Record<string, string> = {};
    
    prompts.forEach(promptMap => {
      Object.entries(promptMap).forEach(([key, value]) => {
        merged[key] = value;
      });
    });

    return merged;
  }

  /**
   * Calculate average success rate
   */
  private averageSuccessRate(skills: Skill[]): number {
    const total = skills.reduce((sum, skill) => sum + skill.successRate, 0);
    return total / skills.length;
  }

  /**
   * Calculate average confidence
   */
  private averageConfidence(skills: Skill[]): number {
    const total = skills.reduce((sum, skill) => sum + skill.confidence, 0);
    return total / skills.length;
  }
}

export interface CompiledSkill {
  id: string;
  name: string;
  trigger: string;
  workflow: any[];
  tools: string[];
  prompts: Record<string, string>;
  version: number;
  confidence: number;
}
