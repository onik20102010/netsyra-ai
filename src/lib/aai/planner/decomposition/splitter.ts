import { Task, GoalPriority } from "../planner-types";

export class TaskSplitter {
  public static createTask(
    title: string,
    description: string,
    type: Task["type"],
    priority: GoalPriority = "medium",
    dependencies: string[] = []
  ): Task {
    const now = new Date();
    return {
      id: crypto.randomUUID(),
      title,
      description,
      type,
      status: "pending",
      dependencies,
      priority: 3,
      priorityLevel: priority,
      assignedCapability: "llm",
      attempts: 0,
      maxAttempts: 3,
      retryable: true,
      createdAt: now,
      updatedAt: now,
    };
  }
}
