import { GoalStatus, Goal } from "../planner-types";

export class GoalLifecycleManager {
  public static transitionGoal(
    goal: Goal,
    newStatus: GoalStatus
  ): Goal {
    const now = new Date();
    return {
      ...goal,
      status: newStatus,
      updatedAt: now,
    };
  }

  public static updateProgress(
    goal: Goal,
    progress: number
  ): Goal {
    const clampedProgress = Math.max(0, Math.min(1, progress));
    let newStatus = goal.status;

    if (clampedProgress === 1) {
      newStatus = "completed";
    } else if (clampedProgress > 0 && goal.status === "pending") {
      newStatus = "in_progress";
    }

    return {
      ...goal,
      progress: clampedProgress,
      status: newStatus,
      updatedAt: new Date(),
    };
  }
}
