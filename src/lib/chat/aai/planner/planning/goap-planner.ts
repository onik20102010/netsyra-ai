import {
  GOAPAction,
  GOAPState,
  Task,
} from "../planner-types";
import { TaskSplitter } from "../decomposition/splitter";

export class GOAPPlanner {
  private actions: GOAPAction[] = [];

  addAction(action: GOAPAction) {
    this.actions.push(action);
  }

  plan(startState: GOAPState, goalState: GOAPState): Task[] {
    const tasks: Task[] = [];
    return tasks;
  }
}
