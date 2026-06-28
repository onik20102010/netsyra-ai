import { Goal, Task, IntentAnalysis } from "../planner-types";
import { TaskSplitter } from "./splitter";

export class TaskDecomposer {
  public static decomposeGoal(
    goal: Goal,
    intentAnalysis: IntentAnalysis
  ): Task[] {
    const tasks: Task[] = [];

    // Simple keyword-based decomposition for now (will use LLM later)
    if (intentAnalysis.intentType === "simple_question" || intentAnalysis.planningLevel === 0) {
      // Just one task to get answer
      tasks.push(
        TaskSplitter.createTask(
          "Answer user's question",
          `Provide a direct answer to the user: ${goal.description}`,
          "llm_call"
        )
      );
    } else if (intentAnalysis.intentType === "simple_task" || intentAnalysis.planningLevel === 1) {
      // Simple task list
      tasks.push(
        TaskSplitter.createTask(
          "Plan and execute task",
          `Complete the task: ${goal.title}`,
          "llm_call"
        )
      );
    } else if (intentAnalysis.planningLevel >= 2) {
      // More complex planning
      tasks.push(
        TaskSplitter.createTask(
          "Analyze requirements",
          "Analyze what needs to be done",
          "llm_call"
        )
      );
      const reqTaskId = tasks[0].id;

      tasks.push(
        TaskSplitter.createTask(
          "Create plan",
          "Create a detailed plan",
          "llm_call",
          "medium",
          [reqTaskId]
        )
      );
      const planTaskId = tasks[1].id;

      tasks.push(
        TaskSplitter.createTask(
          "Execute plan",
          "Execute the created plan step by step",
          "llm_call",
          "medium",
          [planTaskId]
        )
      );
    }

    return tasks;
  }
}
