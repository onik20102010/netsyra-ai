import { GoalPriority } from "../planner-types";

export class GoalPriorityManager {
  public static getPriorityWeight(priority: GoalPriority): number {
    switch (priority) {
      case "critical":
        return 5;
      case "high":
        return 4;
      case "medium":
        return 3;
      case "low":
        return 2;
      case "trivial":
        return 1;
      default:
        return 3;
    }
  }

  public static getPriorityLabel(weight: number): GoalPriority {
    if (weight >= 5) return "critical";
    if (weight >= 4) return "high";
    if (weight >= 3) return "medium";
    if (weight >= 2) return "low";
    return "trivial";
  }
}
