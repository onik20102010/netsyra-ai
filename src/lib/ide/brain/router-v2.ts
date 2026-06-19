interface RouteOption {
  mode: string;
  confidence: number;
}

interface RouterResult {
  options: RouteOption[];
  selected: string;
  reason: string;
  needsUserInput: boolean;
  complexity: "low" | "medium" | "high";
}

export function routeRequest(
  normalizedInput: { intentType: string; complexityHint: string },
  constraints: { shouldAskUser: boolean }
): RouterResult {
  const options: RouteOption[] = [];

  switch (normalizedInput.intentType) {
    case "build_project":
      options.push({ mode: "plan", confidence: 0.92 });
      options.push({ mode: "agent_swarm", confidence: 0.88 });
      options.push({ mode: "ask_user", confidence: 0.74 });
      break;
    case "fix_code":
      options.push({ mode: "debug", confidence: 0.95 });
      options.push({ mode: "agent_swarm", confidence: 0.82 });
      break;
    case "explain":
      options.push({ mode: "ask", confidence: 0.98 });
      break;
    case "plan":
      options.push({ mode: "plan", confidence: 0.90 });
      break;
    case "terminal":
      options.push({ mode: "terminal", confidence: 1.0 });
      break;
    default:
      options.push({ mode: "ask", confidence: 0.7 });
      options.push({ mode: "plan", confidence: 0.5 });
  }

  // If constraints suggest user input, prioritize asking
  const selected = constraints.shouldAskUser
    ? "ask_user"
    : options[0]?.mode || "ask";

  const complexity = (normalizedInput.complexityHint as "low" | "medium" | "high") || "medium";

  return {
    options,
    selected,
    reason: selected === "ask_user" ? "Uncertain constraints require user clarification." : `Best mode for intent type '${normalizedInput.intentType}'`,
    needsUserInput: selected === "ask_user",
    complexity,
  };
}