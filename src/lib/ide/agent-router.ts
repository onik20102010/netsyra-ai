export async function classifyIntent(message: string, context: any) {
  const lower = message.toLowerCase();
  if (lower.includes("fix") || lower.includes("bug")) return { intent: "debug", complexity: "medium" };
  if (lower.includes("refactor")) return { intent: "refactor", complexity: "high" };
  if (lower.includes("plan") || lower.includes("architecture")) return { intent: "plan", complexity: "high" };
  return { intent: "chat", complexity: "low" };
}

export function selectAgent(intent: any, mode: string) {
  if (mode === "plan") return "planning-agent";
  if (mode === "agent") {
    if (intent.intent === "debug") return "debug-agent";
    if (intent.intent === "refactor") return "refactor-agent";
    return "coding-agent";
  }
  return "chat-agent";
}