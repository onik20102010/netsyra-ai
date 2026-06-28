/**
 * Skill Registry
 * Manages the registry of available skills
 */

import { Skill } from "../learning-types";

export class SkillRegistry {
  private skills: Map<string, Skill> = new Map();
  private skillCategories: Map<string, string[]> = new Map();

  /**
   * Register a skill
   */
  public register(skill: Skill): void {
    this.skills.set(skill.id, skill);

    // Add to category index
    const categorySkills = this.skillCategories.get(skill.category) || [];
    if (!categorySkills.includes(skill.id)) {
      categorySkills.push(skill.id);
      this.skillCategories.set(skill.category, categorySkills);
    }
  }

  /**
   * Unregister a skill
   */
  public unregister(skillId: string): boolean {
    const skill = this.skills.get(skillId);
    if (!skill) return false;

    // Remove from category index
    const categorySkills = this.skillCategories.get(skill.category) || [];
    const index = categorySkills.indexOf(skillId);
    if (index > -1) {
      categorySkills.splice(index, 1);
      this.skillCategories.set(skill.category, categorySkills);
    }

    return this.skills.delete(skillId);
  }

  /**
   * Get skill by ID
   */
  public getSkill(skillId: string): Skill | undefined {
    return this.skills.get(skillId);
  }

  /**
   * Get skills by category
   */
  public getSkillsByCategory(category: string): Skill[] {
    const skillIds = this.skillCategories.get(category) || [];
    return skillIds
      .map(id => this.skills.get(id))
      .filter((s): s is Skill => s !== undefined);
  }

  /**
   * Get all skills
   */
  public getAllSkills(): Skill[] {
    return Array.from(this.skills.values());
  }

  /**
   * Get skill categories
   */
   public getCategories(): string[] {
    return Array.from(this.skillCategories.keys());
  }

  /**
   * Search skills by name or description
   */
  public search(query: string): Skill[] {
    const queryLower = query.toLowerCase();

    return Array.from(this.skills.values()).filter(skill => {
      return skill.name.toLowerCase().includes(queryLower) ||
             skill.description.toLowerCase().includes(queryLower) ||
             skill.trigger.toLowerCase().includes(queryLower);
    });
  }

  /**
   * Get top performing skills
   */
  public getTopSkills(limit: number = 10): Skill[] {
    return Array.from(this.skills.values())
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, limit);
  }

  /**
   * Get most used skills
   */
  public getMostUsedSkills(limit: number = 10): Skill[] {
    return Array.from(this.skills.values())
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  /**
   * Get recently updated skills
   */
  public getRecentlyUpdatedSkills(limit: number = 10): Skill[] {
    return Array.from(this.skills.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .slice(0, limit);
  }

  /**
   * Update skill
   */
  public updateSkill(skill: Skill): void {
    if (this.skills.has(skill.id)) {
      this.skills.set(skill.id, skill);
    }
  }

  /**
   * Get skill count
   */
  public getCount(): number {
    return this.skills.size;
  }

  /**
   * Get count by category
   */
  public getCountByCategory(category: string): number {
    return (this.skillCategories.get(category) || []).length;
  }
}
