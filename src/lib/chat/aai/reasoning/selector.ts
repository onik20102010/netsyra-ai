import { ReasoningType, ReasoningContext } from "./types";

export class ReasoningSelector {
  selectReasoningTypes(context: ReasoningContext): ReasoningType[] {
    const types: ReasoningType[] = [];
    const lower = context.userMessage.toLowerCase();

    if (lower.includes("why") || lower.includes("how")) {
      types.push("causal");
    }

    if (lower.includes("code") || lower.includes("bug") || lower.includes("program")) {
      types.push("programming");
    }

    if (lower.includes("what if")) {
      types.push("counterfactual");
    }

    if (lower.includes("math") || lower.includes("calculate") || lower.includes("solve")) {
      types.push("mathematical");
    }

    types.push("deduction");
    types.push("commonsense");

    return types;
  }
}
