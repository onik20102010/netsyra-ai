/**
 * Skill Versioning
 * Manages skill versioning and history
 */

import { Skill, SkillVersion } from "../learning-types";

export class SkillVersioning {
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
   * Rollback to a previous version
   */
  public rollback(skill: Skill, targetVersion: number): Skill | null {
    const versionHistory = skill.history;
    const targetVersionData = versionHistory.find(v => v.version === targetVersion);

    if (!targetVersionData) {
      return null;
    }

    // Create rollback entry
    const rollbackEntry: SkillVersion = {
      version: skill.version + 1,
      changes: `Rollback to version ${targetVersion}`,
      successRate: skill.successRate,
      timestamp: Date.now(),
    };

    const rolledBackSkill: Skill = {
      ...skill,
      version: skill.version + 1,
      history: [...skill.history, rollbackEntry],
      updatedAt: Date.now(),
    };

    return rolledBackSkill;
  }

  /**
   * Get version history
   */
  public getVersionHistory(skill: Skill): SkillVersion[] {
    return [...skill.history];
  }

  /**
   * Compare two versions
   */
  public compareVersions(skill: Skill, version1: number, version2: number): any {
    const v1 = skill.history.find(v => v.version === version1);
    const v2 = skill.history.find(v => v.version === version2);

    if (!v1 || !v2) {
      return null;
    }

    return {
      version1: v1,
      version2: v2,
      successRateChange: v2.successRate - v1.successRate,
      timeDifference: v2.timestamp - v1.timestamp,
    };
  }

  /**
   * Get best performing version
   */
  public getBestVersion(skill: Skill): SkillVersion | null {
    if (skill.history.length === 0) return null;

    return skill.history.reduce((best, current) => {
      return current.successRate > best.successRate ? current : best;
    });
  }

  /**
   * Check if skill should be versioned
   */
  public shouldVersion(skill: Skill, changes: string): boolean {
    // Version if significant changes
    const significantChanges = [
      "workflow",
      "tools",
      "prompts",
      "trigger",
    ];

    return significantChanges.some(change => 
      changes.toLowerCase().includes(change)
    );
  }
}
