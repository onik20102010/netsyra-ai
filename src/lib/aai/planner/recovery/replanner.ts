import { ExecutionPlan, Task } from "../planner-types";
import { TaskSplitter } from "../decomposition/splitter";

export class Replanner {
  replan(
    currentPlan: ExecutionPlan,
    failedTask: Task
  ): ExecutionPlan {
    return currentPlan;
  }
}
