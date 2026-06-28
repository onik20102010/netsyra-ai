import {
  HTNTask,
  HTNCompoundTask,
  HTNPrimitiveTask,
  Task,
} from "../planner-types";
import { TaskSplitter } from "../decomposition/splitter";

export class HTNPlanner {
  private compoundTasks: HTNCompoundTask[] = [];

  addCompoundTask(task: HTNCompoundTask) {
    this.compoundTasks.push(task);
  }

  plan(goal: any): Task[] {
    const tasks: Task[] = [];
    return tasks;
  }
}
