interface ConstraintResult {
  known: string[];
  unknown: string[];
  riskFlags: string[];
  blockingQuestions: string[];
  shouldAskUser: boolean;
}

export function analyzeConstraints(normalizedInput: {
  intentType: string;
  entities: string[];
  complexityHint: string;
}): ConstraintResult {
  const known: string[] = [];
  const unknown: string[] = [];
  const riskFlags: string[] = [];
  const blockingQuestions: string[] = [];

  if (normalizedInput.intentType === "build_project") {
    // Do NOT ask for tech stack — auto‑pick Next.js if missing
    if (normalizedInput.entities.length === 0) {
      unknown.push("technology stack (auto‑selected: Next.js + TypeScript)");
    }
    unknown.push("deployment target");
    riskFlags.push("Possible overengineering if real‑time is not needed");
    // Only block if the user explicitly wants real‑time vs request‑response ambiguity
    // For now, never block for tech stack; proceed with defaults
  }

  if (normalizedInput.intentType === "fix_code") {
    unknown.push("root cause location");
    riskFlags.push("Fix may introduce new bugs");
  }

  if (normalizedInput.complexityHint === "high") {
    unknown.push("full architecture blueprint");
    // Don't block for high complexity; proceed with planning
  }

  return {
    known,
    unknown,
    riskFlags,
    blockingQuestions,
    shouldAskUser: false,   // ← never block for tech stack
  };
}