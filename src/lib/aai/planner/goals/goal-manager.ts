import { Goal, GoalPriority } from "../planner-types";
import { GoalFactory } from "./goal";
import { GoalLifecycleManager } from "./goal-lifecycle";
import { GoalPriorityManager } from "./goal-priority";
import { GoalValidator } from "./goal-validator";

export class GoalManager {
  private goals: Map<string, Goal> = new Map();
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  public createGoal(
    title: string,
    description: string,
    priority: GoalPriority = "medium",
    parentGoalId?: string
  ): Goal {
    const goal = GoalFactory.createGoal(title, description, priority, parentGoalId);
    this.goals.set(goal.id, goal);

    // If this is a child goal, add it to its parent
    if (parentGoalId) {
      const parent = this.goals.get(parentGoalId);
      if (parent) {
        parent.childGoalIds.push(goal.id);
        parent.updatedAt = new Date();
      }
    }

    return goal;
  }

  public getGoal(id: string): Goal | undefined {
    return this.goals.get(id);
  }

  public getAllGoals(): Goal[] {
    return Array.from(this.goals.values());
  }

  public getTopLevelGoals(): Goal[] {
    return Array.from(this.goals.values()).filter((g) => !g.parentGoalId);
  }

  public getChildGoals(parentId: string): Goal[] {
    const parent = this.goals.get(parentId);
    if (!parent) return [];
    return parent.childGoalIds.map((id) => this.goals.get(id)).filter((g) => g !== undefined) as Goal[];
  }

  public updateGoal(id: string, updates: Partial<Goal>): Goal | undefined {
    const goal = this.goals.get(id);
    if (!goal) return undefined;

    const updatedGoal = { ...goal, ...updates, updatedAt: new Date() };
    this.goals.set(id, updatedGoal);
    return updatedGoal;
  }

  public validateGoal(id: string) {
    const goal = this.goals.get(id);
    if (!goal) return { valid: false, issues: ["Goal not found"] };
    return GoalValidator.validateGoal(goal);
  }

  public transitionGoal(id: string, newStatus: Goal["status"]): Goal | undefined {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    const updated = GoalLifecycleManager.transitionGoal(goal, newStatus);
    this.goals.set(id, updated);
    return updated;
  }

  public updateGoalProgress(id: string, progress: number): Goal | undefined {
    const goal = this.goals.get(id);
    if (!goal) return undefined;
    const updated = GoalLifecycleManager.updateProgress(goal, progress);
    this.goals.set(id, updated);
    return updated;
  }
}
