import { RiskAssessment, Task } from "../planner-types";

export class RiskAnalyzer {
  analyze(tasks: Task[]): RiskAssessment {
    let riskLevel = 0;
    const riskFactors: string[] = [];
    const mitigationSteps: string[] = [];

    for (const task of tasks) {
      if (task.estimatedRisk) {
        riskLevel += task.estimatedRisk;
      }
    }

    return {
      riskLevel: Math.min(1, riskLevel / tasks.length),
      riskFactors,
      mitigationSteps,
    };
  }
}
