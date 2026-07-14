/**
 * Skill Extractor
 * Extracts reusable skills from successful executions
 */

import { Experience, Skill, WorkflowStep } from "../learning-types";

export class SkillExtractor {
  private skills: Map<string, Skill> = new Map();
  private experienceBuffer: Experience[] = [];

  /**
   * Extract skills from an experience
   */
  public async extract(experience: Experience): Promise<Skill[]> {
    if (!experience.success) {
      return []; // Only extract from successful experiences
    }

    // Add to buffer for pattern analysis
    this.experienceBuffer.push(experience);

    // Try to extract skills based on patterns
    const extractedSkills = this.extractSkillsFromExperience(experience);

    // Store skills
    for (const skill of extractedSkills) {
      this.skills.set(skill.id, skill);
    }

    return extractedSkills;
  }

  /**
   * Extract skills from a single experience
   */
  private extractSkillsFromExperience(experience: Experience): Skill[] {
    const skills: Skill[] = [];

    // Extract based on task patterns
    const taskSkill = this.extractTaskSkill(experience);
    if (taskSkill) {
      skills.push(taskSkill);
    }

    // Extract based on tool usage patterns
    const toolSkill = this.extractToolSkill(experience);
    if (toolSkill) {
      skills.push(toolSkill);
    }

    return skills;
  }

  /**
   * Extract skill based on task patterns
   */
  private extractTaskSkill(experience: Experience): Skill | null {
    // Check if this is a common task pattern
    const taskPattern = this.identifyTaskPattern(experience);
    if (!taskPattern) return null;

    const skill: Skill = {
      id: crypto.randomUUID(),
      name: taskPattern.name,
      description: `Automated skill for ${taskPattern.name}`,
      category: taskPattern.category,
      trigger: taskPattern.trigger,
      workflow: this.generateWorkflow(experience),
      tools: experience.toolsUsed.map(t => t.toolName),
      prompts: this.extractPrompts(experience),
      version: 1,
      successRate: experience.success ? 1 : 0,
      usageCount: 0,
      lastUsed: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: [],
      confidence: experience.confidence,
    };

    return skill;
  }

  /**
   * Identify task pattern from experience
   */
  private identifyTaskPattern(experience: Experience): { name: string; category: string; trigger: string } | null {
    const goal = experience.goal.toLowerCase();

    // Common patterns
    if (goal.includes("api") && goal.includes("build")) {
      return {
        name: "API Development",
        category: "development",
        trigger: "When building APIs",
      };
    }

    if (goal.includes("auth") || goal.includes("authentication")) {
      return {
        name: "Authentication",
        category: "security",
        trigger: "When implementing authentication",
      };
    }

    if (goal.includes("database") || goal.includes("db")) {
      return {
        name: "Database Operations",
        category: "data",
        trigger: "When working with databases",
      };
    }

    if (goal.includes("test") || goal.includes("testing")) {
      return {
        name: "Testing",
        category: "quality",
        trigger: "When writing tests",
      };
    }

    if (goal.includes("deploy") || goal.includes("deployment")) {
      return {
        name: "Deployment",
        category: "operations",
        trigger: "When deploying applications",
      };
    }

    return null;
  }

  /**
   * Generate workflow from experience
   */
  private generateWorkflow(experience: Experience): WorkflowStep[] {
    return experience.plan.map((task, index) => ({
      step: index + 1,
      action: task.description,
      expectedOutput: "Task completion",
    }));
  }

  /**
   * Extract prompts from experience
   */
  private extractPrompts(experience: Experience): Record<string, string> {
    // In production, this would extract actual prompts used
    return {
      planning: "Plan the task step by step",
      execution: "Execute the planned steps",
    };
  }

  /**
   * Extract skill based on tool usage
   */
  private extractToolSkill(experience: Experience): Skill | null {
    if (experience.toolsUsed.length === 0) return null;

    const primaryTool = experience.toolsUsed[0].toolName;

    const skill: Skill = {
      id: crypto.randomUUID(),
      name: `${primaryTool} Usage`,
      description: `Skill for using ${primaryTool} effectively`,
      category: "tools",
      trigger: `When using ${primaryTool}`,
      workflow: this.generateToolWorkflow(experience),
      tools: [primaryTool],
      prompts: {},
      version: 1,
      successRate: experience.toolsUsed[0].success ? 1 : 0,
      usageCount: 0,
      lastUsed: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: [],
      confidence: experience.toolsUsed[0].success ? 0.9 : 0.5,
    };

    return skill;
  }

  /**
   * Generate tool workflow
   */
  private generateToolWorkflow(experience: Experience): WorkflowStep[] {
    return experience.toolsUsed.map((tool, index) => ({
      step: index + 1,
      action: `Use ${tool.toolName}`,
      tool: tool.toolName,
      expectedOutput: "Successful tool execution",
    }));
  }

  /**
   * Get skill by ID
   */
  public getSkill(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  /**
   * Get skills by category
   */
  public getSkillsByCategory(category: string): Skill[] {
    return Array.from(this.skills.values()).filter(
      skill => skill.category === category
    );
  }

  /**
   * Get all skills
   */
  public getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Update skill usage
   */
  public updateSkillUsage(skillId: string, success: boolean): void {
    const skill = this.skills.get(skillId);
    if (!skill) return;

    skill.usageCount++;
    skill.lastUsed = Date.now();

    // Update success rate
    const currentRate = skill.successRate;
    const newRate = (currentRate * (skill.usageCount - 1) + (success ? 1 : 0)) / skill.usageCount;
    skill.successRate = newRate;
  }

  /**
   * Get skill success rate
   */
  public async getSuccessRate(): Promise<number> {
    const skills = this.getAllSkills();
    if (skills.length === 0) return 0;

    const totalRate = skills.reduce((sum, skill) => sum + skill.successRate, 0);
    return totalRate / skills.length;
  }

  /**
   * Find applicable skills for a task
   */
  public findApplicableSkills(task: string): Skill[] {
    const taskLower = task.toLowerCase();

    return Array.from(this.skills.values()).filter(skill => {
      return taskLower.includes(skill.trigger.toLowerCase()) ||
             taskLower.includes(skill.name.toLowerCase());
    });
  }
}
