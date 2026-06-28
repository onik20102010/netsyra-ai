/**
 * Learning Policy Configuration
 * Defines when, what, and how the AAI system learns
 */

import { LearningPolicy, LearningFocus, LearningStrategy } from "./learning-types";

export const DEFAULT_LEARNING_POLICY: LearningPolicy = {
  // Learn immediately after each task for critical feedback
  trigger: "immediate",
  
  // Focus on all aspects of learning
  focus: [
    "experience",
    "reflection",
    "skills",
    "patterns",
    "policies",
    "optimization",
    "evolution",
  ],
  
  // Moderate learning strategy - balance between speed and safety
  strategy: "moderate",
  
  // Governance
  requireApproval: false, // Auto-approve low-impact changes
  approvalThreshold: 0.8, // Require approval for high-impact changes
  safetyChecks: true,
  benchmarking: true,
};

export class LearningPolicyManager {
  private policy: LearningPolicy;

  constructor(policy?: Partial<LearningPolicy>) {
    this.policy = { ...DEFAULT_LEARNING_POLICY, ...policy };
  }

  /**
   * Get current learning policy
   */
  public getPolicy(): LearningPolicy {
    return { ...this.policy };
  }

  /**
   * Update learning policy
   */
  public updatePolicy(updates: Partial<LearningPolicy>): void {
    this.policy = { ...this.policy, ...updates };
  }

  /**
   * Check if learning should trigger
   */
  public shouldTrigger(experience: any): boolean {
    switch (this.policy.trigger) {
      case "immediate":
        return true;
      case "batch":
        // Would be handled by batch processor
        return false;
      case "scheduled":
        // Would be handled by scheduler
        return false;
      case "manual":
        return false;
      default:
        return false;
    }
  }

  /**
   * Check if approval is required for a change
   */
  public requiresApproval(impact: number): boolean {
    if (!this.policy.requireApproval) {
      return false;
    }
    return impact >= this.policy.approvalThreshold;
  }

  /**
   * Check if safety checks are enabled
   */
  public safetyChecksEnabled(): boolean {
    return this.policy.safetyChecks;
  }

  /**
   * Check if benchmarking is enabled
   */
  public benchmarkingEnabled(): boolean {
    return this.policy.benchmarking;
  }

  /**
   * Get learning focus areas
   */
  public getFocus(): LearningFocus[] {
    return [...this.policy.focus];
  }

  /**
   * Get learning strategy
   */
  public getStrategy(): LearningStrategy {
    return this.policy.strategy;
  }
}
