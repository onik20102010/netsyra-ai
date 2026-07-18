// ── 100+ intent categories (expand as needed) ──────────────────────────
const INTENTS = [
  "factual_knowledge",
  "comparison",
  "how_to_tutorial",
  "step_by_step_guide",
  "deep_explanation",
  "code_generation",
  "debugging_error",
  "code_review",
  "architecture_design",
  "system_design",
  "data_analysis",
  "math_calculation",
  "translation",
  "summarization",
  "creative_writing",
  "brainstorming",
  "planning",
  "prioritization",
  "decision_making",
  "pros_cons",
  "definitions",
  "historical_context",
  "future_predictions",
  "philosophical",
  "ethical_dilemma",
  "personal_advice",
  "emotional_support",
  "motivational",
  "interview_prep",
  "resume_review",
  "learning_path",
  "resource_recommendation",
  "comparison_of_methods",
  "troubleshooting",
  "setup_installation",
  "configuration",
  "security_advisory",
  "legal_disclaimer",
  "medical_disclaimer",
  "joke_humor",
  "riddle_puzzle",
  "role_play",
  "simulation",
  "text_analysis",
  "sentiment_analysis",
  "proofreading",
  "grammar_check",
  "paraphrasing",
  "citation_formatting",
  "academic_writing",
  "business_email",
  "report_writing",
  "presentation_outline",
  "meeting_agenda",
  "project_management",
  "risk_assessment",
  "budgeting",
  "negotiation_tips",
  "marketing_copy",
  "seo_optimization",
  "social_media_post",
  "blog_post_idea",
  "storytelling",
  "character_development",
  "world_building",
  "poetry",
  "song_lyrics",
  "recipe_cooking",
  "travel_planning",
  "fitness_advice",
  "nutrition_guide",
  "mental_health_resource",
  "relationship_advice",
  "parenting_tips",
  "pet_care",
  "home_improvement",
  "car_maintenance",
  "tech_support",
  "gaming_tips",
  "book_recommendation",
  "movie_recommendation",
  "music_recommendation",
  "product_review",
  "price_comparison",
  "shopping_advice",
  "investment_basics",
  "tax_help",
  "immigration_question",
  "language_learning",
  "exam_preparation",
  "certification_guide",
  "career_change",
  "freelancing_tips",
  "startup_advice",
  "fundraising_pitch",
  "legal_structure",
  "intellectual_property",
  "open_source_licensing",
  "api_integration",
  "cloud_deployment",
  "database_design",
  "ui_ux_advice",
  "accessibility_guidelines",
  "performance_optimization",
  "scaling_strategy",
  "disaster_recovery",
  "monitoring_alerting",
  "compliance_regulation",
  "environmental_impact",
  "sustainability",
  "general_inquiry",
] as const;

type Intent = (typeof INTENTS)[number];

// ── Slimmed‑down formatting instructions ───────────────────────────
const INSTRUCTIONS: Record<Intent, string> = {
  factual_knowledge: "Intent: factual_knowledge",
  comparison: "Intent: comparison",
  how_to_tutorial: "Intent: how_to_tutorial",
  step_by_step_guide: "Intent: step_by_step_guide",
  deep_explanation: "Intent: deep_explanation",
  code_generation: "Intent: code_generation",
  debugging_error: "Intent: debugging_error",
  code_review: "Intent: code_review",
  architecture_design: "Intent: architecture_design",
  system_design: "Intent: system_design",
  data_analysis: "Intent: data_analysis",
  math_calculation: "Intent: math_calculation",
  translation: "Intent: translation",
  summarization: "Intent: summarization",
  creative_writing: "Intent: creative_writing",
  brainstorming: "Intent: brainstorming",
  planning: "Intent: planning",
  prioritization: "Intent: prioritization",
  decision_making: "Intent: decision_making",
  pros_cons: "Intent: pros_cons",
  definitions: "Intent: definitions",
  historical_context: "Intent: historical_context",
  future_predictions: "Intent: future_predictions",
  philosophical: "Intent: philosophical",
  ethical_dilemma: "Intent: ethical_dilemma",
  personal_advice: "Intent: personal_advice",
  emotional_support: "Intent: emotional_support",
  motivational: "Intent: motivational",
  interview_prep: "Intent: interview_prep",
  resume_review: "Intent: resume_review",
  learning_path: "Intent: learning_path",
  resource_recommendation: "Intent: resource_recommendation",
  comparison_of_methods: "Intent: comparison_of_methods",
  troubleshooting: "Intent: troubleshooting",
  setup_installation: "Intent: setup_installation",
  configuration: "Intent: configuration",
  security_advisory: "Intent: security_advisory",
  legal_disclaimer: "Intent: legal_disclaimer",
  medical_disclaimer: "Intent: medical_disclaimer",
  joke_humor: "Intent: joke_humor",
  riddle_puzzle: "Intent: riddle_puzzle",
  role_play: "Intent: role_play",
  simulation: "Intent: simulation",
  text_analysis: "Intent: text_analysis",
  sentiment_analysis: "Intent: sentiment_analysis",
  proofreading: "Intent: proofreading",
  grammar_check: "Intent: grammar_check",
  paraphrasing: "Intent: paraphrasing",
  citation_formatting: "Intent: citation_formatting",
  academic_writing: "Intent: academic_writing",
  business_email: "Intent: business_email",
  report_writing: "Intent: report_writing",
  presentation_outline: "Intent: presentation_outline",
  meeting_agenda: "Intent: meeting_agenda",
  project_management: "Intent: project_management",
  risk_assessment: "Intent: risk_assessment",
  budgeting: "Intent: budgeting",
  negotiation_tips: "Intent: negotiation_tips",
  marketing_copy: "Intent: marketing_copy",
  seo_optimization: "Intent: seo_optimization",
  social_media_post: "Intent: social_media_post",
  blog_post_idea: "Intent: blog_post_idea",
  storytelling: "Intent: storytelling",
  character_development: "Intent: character_development",
  world_building: "Intent: world_building",
  poetry: "Intent: poetry",
  song_lyrics: "Intent: song_lyrics",
  recipe_cooking: "Intent: recipe_cooking",
  travel_planning: "Intent: travel_planning",
  fitness_advice: "Intent: fitness_advice",
  nutrition_guide: "Intent: nutrition_guide",
  mental_health_resource: "Intent: mental_health_resource",
  relationship_advice: "Intent: relationship_advice",
  parenting_tips: "Intent: parenting_tips",
  pet_care: "Intent: pet_care",
  home_improvement: "Intent: home_improvement",
  car_maintenance: "Intent: car_maintenance",
  tech_support: "Intent: tech_support",
  gaming_tips: "Intent: gaming_tips",
  book_recommendation: "Intent: book_recommendation",
  movie_recommendation: "Intent: movie_recommendation",
  music_recommendation: "Intent: music_recommendation",
  product_review: "Intent: product_review",
  price_comparison: "Intent: price_comparison",
  shopping_advice: "Intent: shopping_advice",
  investment_basics: "Intent: investment_basics",
  tax_help: "Intent: tax_help",
  immigration_question: "Intent: immigration_question",
  language_learning: "Intent: language_learning",
  exam_preparation: "Intent: exam_preparation",
  certification_guide: "Intent: certification_guide",
  career_change: "Intent: career_change",
  freelancing_tips: "Intent: freelancing_tips",
  startup_advice: "Intent: startup_advice",
  fundraising_pitch: "Intent: fundraising_pitch",
  legal_structure: "Intent: legal_structure",
  intellectual_property: "Intent: intellectual_property",
  open_source_licensing: "Intent: open_source_licensing",
  api_integration: "Intent: api_integration",
  cloud_deployment: "Intent: cloud_deployment",
  database_design: "Intent: database_design",
  ui_ux_advice: "Intent: ui_ux_advice",
  accessibility_guidelines: "Intent: accessibility_guidelines",
  performance_optimization: "Intent: performance_optimization",
  scaling_strategy: "Intent: scaling_strategy",
  disaster_recovery: "Intent: disaster_recovery",
  monitoring_alerting: "Intent: monitoring_alerting",
  compliance_regulation: "Intent: compliance_regulation",
  environmental_impact: "Intent: environmental_impact",
  sustainability: "Intent: sustainability",
  general_inquiry: "Intent: general_inquiry",
} as const;

// ── AI classifier configuration ─────────────────────────────────────────
// Tiny, fast model – only used when keyword matching is inconclusive.
const CLASSIFIER_MODEL = {
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  apiKeyEnv: "GROQ_API_KEY_3",   // ← third Groq key
  model: "llama-3.1-8b-instant",
};

// ── Cache to avoid re-classifying identical messages ────────────────────
const cache = new Map<string, Intent>();

// ── Keyword-first classifier (0 tokens, 0 latency) ──────────────────────
// Maps high-frequency intents to trigger keywords. Ordered by specificity:
// earlier entries win when multiple match.
const KEYWORD_RULES: Array<{ intent: Intent; keywords: string[] }> = [
  { intent: "debugging_error", keywords: ["error", "bug", "not working", "doesn't work", "traceback", "exception", "stack trace", "fix this", "why is my"] },
  { intent: "code_generation", keywords: ["write code", "write a function", "code for", "implement", "create a component", "build a", "script to", "function that", "class that", "```"] },
  { intent: "code_review", keywords: ["review my code", "refactor", "improve this code", "optimize this", "code review"] },
  { intent: "translation", keywords: ["translate", "translation", "in spanish", "in french", "in german", "to english", "meaning in"] },
  { intent: "summarization", keywords: ["summarize", "summary of", "tl;dr", "tldr", "in short", "brief overview"] },
  { intent: "math_calculation", keywords: ["calculate", "solve", "equation", "derivative", "integral", "what is the sum", "multiply", "percentage of"] },
  { intent: "step_by_step_guide", keywords: ["step by step", "step-by-step", "how do i", "how to", "guide to", "walk me through", "tutorial"] },
  { intent: "comparison", keywords: [" vs ", "versus", "difference between", "compare", "better than", "pros and cons"] },
  { intent: "definitions", keywords: ["what is a", "what is an", "define", "definition of", "what does", "meaning of"] },
  { intent: "planning", keywords: ["plan for", "roadmap", "schedule", "learning path", "study plan", "30 day", "weekly plan"] },
  { intent: "creative_writing", keywords: ["write a story", "write a poem", "poem about", "story about", "song", "lyrics", "essay about"] },
  { intent: "business_email", keywords: ["write an email", "email to", "draft an email", "reply to this email"] },
  { intent: "resume_review", keywords: ["resume", "cv ", "cover letter"] },
  { intent: "personal_advice", keywords: ["should i", "advice on", "help me decide", "what would you do"] },
  { intent: "recipe_cooking", keywords: ["recipe", "how to cook", "how to make", "ingredients for"] },
  { intent: "joke_humor", keywords: ["tell me a joke", "make me laugh", "funny"] },
];

function keywordIntent(message: string): Intent | null {
  const lower = message.toLowerCase();
  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule.intent;
  }
  // Very short / casual messages don't need a model call.
  if (lower.trim().length <= 12) return "general_inquiry";
  return null;
}

// ── Main export: classifies user message into one of 100+ intents ───────
export async function classifyIntent(message: string): Promise<Intent> {
  if (cache.has(message)) return cache.get(message)!;

  // 1. Keyword-first pass — resolves the majority of messages with no LLM call.
  const kw = keywordIntent(message);
  if (kw) {
    cache.set(message, kw);
    return kw;
  }

  // 2. Fallback: tiny model only when keywords are inconclusive.
  const apiKey = process.env[CLASSIFIER_MODEL.apiKeyEnv];
  if (!apiKey) {
    console.warn("Intent classifier missing API key, falling back to 'general_inquiry'");
    return "general_inquiry";
  }

  const intentList = INTENTS.join(", ");
  const systemPrompt = `You are a query classifier. Given a user message, output exactly one of the following intent labels (no explanation, just the label): ${intentList}. The message may be in any language; classify by meaning, not by language.`;

  try {
    const res = await fetch(CLASSIFIER_MODEL.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CLASSIFIER_MODEL.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0,
        max_tokens: 20,
        stop: ["\n"],
      }),
    });

    if (!res.ok) {
      console.warn("Intent classifier API error, falling back to 'general_inquiry'");
      return "general_inquiry";
    }

    const data = await res.json();
    const label = data.choices?.[0]?.message?.content?.trim();

    if (label && INTENTS.includes(label as Intent)) {
      cache.set(message, label as Intent);
      return label as Intent;
    }

    return "general_inquiry";
  } catch (err) {
    console.warn("Intent classifier error, falling back to 'general_inquiry':", err);
    return "general_inquiry";
  }
}

// ── Returns the formatting instruction for a given intent ───────────────
export function getIntentInstruction(intent: Intent): string {
  return INSTRUCTIONS[intent] || INSTRUCTIONS.general_inquiry;
}

// ── Optional: sync helper for non‑async callers (uses cache only) ───────
export function getCachedIntent(message: string): Intent | undefined {
  return cache.get(message);
}