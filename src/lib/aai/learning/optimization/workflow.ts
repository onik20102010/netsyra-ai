/**
 * Workflow Optimizer
 * Finds and optimizes inefficient workflows
 */

import { Experience, Optimization } from "../learning-types";

interface Workflow {
  steps: string[];
  version: number;
  createdAt: number;
}

export class WorkflowOptimizer {
  private workflows: Map<string, Workflow> = new Map();
  private workflowPerformance: Map<string, { success: number; total: number; avgDuration: number }> = new Map();

  /**
   * Analyze and optimize workflows from experience
   */
  public async optimize(experience: Experience): Promise<Optimization[]> {
    const optimizations: Optimization[] = [];

    // Extract workflow from experience
    const workflow = this.extractWorkflow(experience);
    const workflowId = this.generateWorkflowId(workflow);

    // Update performance
    this.updateWorkflowPerformance(workflowId, experience);

    // Check for optimization opportunities
    const optimization = this.checkWorkflowOptimization(workflowId, workflow);
    if (optimization) {
      optimizations.push(optimization);
    }

    return optimizations;
  }

  /**
   * Extract workflow from experience
   */
  private extractWorkflow(experience: Experience): string[] {
    return experience.plan.map(task => task.description);
  }

  /**
   * Generate workflow ID
   */
  private generateWorkflowId(workflow: string[]): string {
    return workflow.join(" -> ").substring(0, 50);
  }

  /**
   * Update workflow performance
   */
  private updateWorkflowPerformance(workflowId: string, experience: Experience): void {
    const perf = this.workflowPerformance.get(workflowId) || {
      success: 0,
      total: 0,
      avgDuration: 0,
    };

    perf.total += 1;
    if (experience.success) {
      perf.success += 1;
    }

    // Update average duration
    perf.avgDuration = (perf.avgDuration * (perf.total - 1) + experience.duration) / perf.total;

    this.workflowPerformance.set(workflowId, perf);
  }

  /**
   * Check if workflow can be optimized
   */
  private checkWorkflowOptimization(workflowId: string, workflow: string[]): Optimization | null {
    const perf = this.workflowPerformance.get(workflowId);
    if (!perf || perf.total < 3) return null;

    // Check if workflow is inefficient
    const successRate = perf.success / perf.total;

    if (successRate < 0.7) {
      // Suggest workflow reorganization
      const optimizedWorkflow = this.reorganizeWorkflow(workflow);

      return {
        id: crypto.randomUUID(),
        type: "workflow",
        target: workflowId,
        description: "Reorganize workflow for better success rate",
        before: workflow,
        after: optimizedWorkflow,
        improvement: 0.15,
        confidence: 0.75,
        timestamp: Date.now(),
        status: "proposed",
      };
    }

    if (perf.avgDuration > 300) {
      // Suggest workflow parallelization
      const optimizedWorkflow = this.parallelizeWorkflow(workflow);

      return {
        id: crypto.randomUUID(),
        type: "workflow",
        target: workflowId,
        description: "Parallelize workflow to reduce duration",
        before: workflow,
        after: optimizedWorkflow,
        improvement: 0.2,
        confidence: 0.7,
        timestamp: Date.now(),
        status: "proposed",
      };
    }

    return null;
  }

  /**
   * Reorganize workflow
   */
  private reorganizeWorkflow(workflow: string[]): string[] {
    // Simple reorganization: move validation steps earlier
    const validationSteps = workflow.filter(step => 
      step.toLowerCase().includes("validate") || 
      step.toLowerCase().includes("check")
    );
    
    const otherSteps = workflow.filter(step => 
      !step.toLowerCase().includes("validate") && 
      !step.toLowerCase().includes("check")
    );

    return [...validationSteps, ...otherSteps];
  }

  /**
   * Parallelize workflow
   */
  private parallelizeWorkflow(workflow: string[]): string[] {
    // Mark independent steps for parallelization
    return workflow.map((step, index) => {
      if (index > 0 && index < workflow.length - 1) {
        return `${step} (can be parallelized)`;
      }
      return step;
    });
  }

  /**
   * Get workflow performance
   */
  public getWorkflowPerformance(workflowId: string): any {
    return this.workflowPerformance.get(workflowId);
  }

  /**
   * Get all workflow performances
   */
  public getAllWorkflowPerformances(): Map<string, any> {
    return new Map(this.workflowPerformance);
  }
}
