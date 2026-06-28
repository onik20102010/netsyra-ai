import { Goal, GoalPriority, GoalStatus } from "../planner-types";

export class GoalFactory {
  public static createGoal(
    title: string,
    description: string,
    priority: GoalPriority = "medium",
    parentGoalId?: string
  ): Goal {
    const now = new Date();
    return {
      id: crypto.randomUUID(),
      title,
      description,
      priority,
      parentGoalId,
      childGoalIds: [],
      status: "pending",
      confidence: 0.7,
      progress: 0,
      dependencies: [],
      createdAt: now,
      updatedAt: now,
      estimatedComplexity: 5,
      estimatedTasks: [],
    };
  }
}
