export type AgentMode = "ask" | "plan" | "coding" | "debug" | "refactor" | "review" | "project" | "terminal" | "builder" | "patch" | "feature";

interface RouterResult {
  mode: AgentMode;
  complexity: "low" | "medium" | "high";
  reason: string;
}

export function classifyIntent(prompt: string): RouterResult {
  const lower = prompt.toLowerCase();

  // Terminal commands
  if (lower.startsWith("npm ") || lower.startsWith("npx ") || lower.startsWith("git ") ||
      lower.startsWith("pip ") || lower.startsWith("yarn ") || lower.startsWith("pnpm ")) {
    return { mode: "terminal", complexity: "low", reason: "Terminal command detected." };
  }

  // Debug
  if (lower.includes("fix") || lower.includes("bug") || lower.includes("error") ||
      lower.includes("debug") || lower.includes("not working") || lower.includes("issue")) {
    return { mode: "debug", complexity: "medium", reason: "Debug/fix request." };
  }

  // Refactor
  if (lower.includes("refactor") || lower.includes("rewrite") || lower.includes("clean up") ||
      lower.includes("restructure") || lower.includes("optimize")) {
    return { mode: "refactor", complexity: "high", reason: "Refactoring request." };
  }

  // Review
  if (lower.includes("review") || lower.includes("check") || lower.includes("audit") ||
      lower.includes("inspect") || lower.includes("examine")) {
    return { mode: "review", complexity: "medium", reason: "Code review request." };
  }

  // Build‑It Mode – explicit full project requests
  const buildItKeywords = [
    "build a", "create a full", "develop a", "saas", "dashboard",
    "entire project", "full project", "clone",
  ];
  if (buildItKeywords.some(kw => lower.includes(kw)) && lower.length > 30) {
    return { mode: "builder", complexity: "high", reason: "Full project build requested." };
  }

  // Plan / Project (large tasks)
  const planKeywords = ["build a", "create a full", "develop a", "saas", "architecture",
    "design a system", "project plan", "blueprint", "roadmap", "clone", "entire project"];
  if (planKeywords.some(kw => lower.includes(kw))) {
    if (lower.includes("build") || lower.includes("create")) {
      return { mode: "project", complexity: "high", reason: "Full project creation." };
    }
    return { mode: "plan", complexity: "high", reason: "Large project scope." };
  }

  // Coding / Agent (file changes)
  const codeKeywords = ["add", "create", "implement", "modify", "change", "update",
    "component", "page", "api", "endpoint", "route", "style"];
  if (codeKeywords.some(kw => lower.includes(kw))) {
    return { mode: "coding", complexity: "medium", reason: "Requires file modifications." };
  }

  // Rename detection
  const renameKeywords = ["rename", "rename to", "change name from", "change name to"];
  if (renameKeywords.some(kw => lower.includes(kw)) && lower.includes(" to ")) {
    return { mode: "refactor", complexity: "medium", reason: "Rename request detected." };
  }

  // Default: ask
  return { mode: "ask", complexity: "low", reason: "General question." };
}

// ── Confidence‑scored classification ──────────────
export type IntentScores = Record<AgentMode, number>;

export async function classifyIntentWithConfidence(
  userMessage: string,
  conversationHistory?: string
): Promise<{ mode: AgentMode; confidence: number; scores: IntentScores }> {
  // Try LLM classification first (very fast, small model)
  const apiKey = process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY;
  if (apiKey) {
    try {
      const prompt = `Classify the following user request into ONE of these intents: ask, plan, coding, debug, refactor, review, project, terminal.
Return ONLY a JSON object with the intent and a confidence score (0-1).
Example: {"intent":"coding","confidence":0.95,"scores":{"ask":0.02,"plan":0.01,"coding":0.95,"debug":0.01,"refactor":0.01,"review":0,"project":0,"terminal":0}}

Context: ${conversationHistory?.slice(-200) || "none"}

User: "${userMessage}"`;

      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0,
          max_tokens: 150,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const raw = data.choices[0].message.content;
        const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] || "{}");
        if (json.intent && json.confidence) {
          return {
            mode: json.intent as AgentMode,
            confidence: json.confidence,
            scores: json.scores || defaultScores(json.intent, json.confidence),
          };
        }
      }
    } catch {
      // Fall back to keyword-based
    }
  }

  // Keyword‑based fallback
  const result = classifyIntent(userMessage);
  const confidence = 0.8; // keyword confidence
  const scores = defaultScores(result.mode, confidence);
  return { mode: result.mode, confidence, scores };
}

function defaultScores(mode: AgentMode, confidence: number): IntentScores {
  const allModes: AgentMode[] = [
    "ask", "plan", "coding", "debug", "refactor", "review", "project", "terminal",
    "builder", "patch", "feature",
  ];
  const scores = {} as IntentScores;
  for (const m of allModes) {
    scores[m] = m === mode ? confidence : 0.05;
  }
  return scores;
}