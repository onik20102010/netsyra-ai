import {
  IntentAnalysis,
  PlanningStrategy,
  PlannerInput,
} from "../planner-types";

export class MetaPlanner {
  selectStrategy(input: PlannerInput, intent: IntentAnalysis): PlanningStrategy[] {
    const strategies: PlanningStrategy[] = [];

    if (intent.planningLevel === 0) {
      return strategies;
    }

    strategies.push("template");

    if (intent.intentType === "build_software" || intent.difficulty === "very_high") {
      strategies.push("htn");
    }
    if (intent.intentType === "debug_code") {
      strategies.push("goap");
    }
    if (intent.needsReasoning) {
      strategies.push("tree_search");
    }
    if (intent.needsTools) {
      strategies.push("resource");
    }
    if (input.deadline) {
      strategies.push("deadline");
    }
    if (intent.planningLevel >= 3) {
      strategies.push("monte_carlo");
    }

    strategies.push("utility");
    strategies.push("risk");
    strategies.push("parallel");

    return strategies;
  }
}
