interface NormalizedInput {
  clean: string;
  intentType: "build_project" | "fix_code" | "explain" | "plan" | "terminal";
  entities: string[];
  complexityHint: "low" | "medium" | "high";
}

export function normalizeInput(raw: string): NormalizedInput {
  const clean = raw.trim();
  const lower = clean.toLowerCase();

  // Detect terminal commands
  if (/^(npm|npx|yarn|pnpm|pip|git)\s/.test(clean)) {
    return {
      clean,
      intentType: "terminal",
      entities: clean.split(/\s+/).slice(1),
      complexityHint: "low",
    };
  }

  // Detect build / create keywords
  const buildWords = ["build", "create", "develop", "make", "generate"];
  if (buildWords.some(w => lower.includes(w))) {
    let entities = extractEntities(clean);
    if (entities.length === 0) {
      entities.push("full-stack project");
    }
    return {
      clean,
      intentType: "build_project",
      entities,
      complexityHint: entities.length > 2 ? "high" : "medium",
    };
  }

  // Detect fix / debug
  const fixWords = ["fix", "debug", "repair", "resolve"];
  if (fixWords.some(w => lower.includes(w))) {
    const entities = extractEntities(clean);
    return {
      clean,
      intentType: "fix_code",
      entities,
      complexityHint: "medium",
    };
  }

  // Detect explain / ask
  const explainWords = ["explain", "what is", "how does", "why", "describe"];
  if (explainWords.some(w => lower.includes(w))) {
    return {
      clean,
      intentType: "explain",
      entities: [],
      complexityHint: "low",
    };
  }

  // Default: plan if multi-sentence or long
  return {
    clean,
    intentType: clean.length > 100 ? "plan" : "explain",
    entities: extractEntities(clean),
    complexityHint: clean.length > 200 ? "high" : "low",
  };
}

function extractEntities(text: string): string[] {
  // Very simple: extract capitalized words and tech terms
  const words = text.split(/\s+/);
  return words.filter(w => /^[A-Z]/.test(w) || /\.(tsx?|jsx?|py|rb|go|java)$/.test(w));
}