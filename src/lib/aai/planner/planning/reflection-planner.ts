import { ReflectionResult, ExecutionPlan } from "../planner-types";

export class ReflectionPlanner {
  reflect(plan: ExecutionPlan, success: boolean): ReflectionResult {
    return {
      success,
      efficiencyScore: success ? 0.9 : 0.5,
      failures: success ? [] : ["Plan failed"],
      lessonsLearned: success ? ["Plan worked well"] : ["Need to improve plan"],
      improvements: success ? [] : ["Try alternative strategy"],
    };
  }
}
