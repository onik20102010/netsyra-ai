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

// ── Formatting instructions for every intent ───────────────────────────
const INSTRUCTIONS: Record<Intent, string> = {
  factual_knowledge:
    "Provide a concise 1-2 sentence answer. Bold only the key term.",
  comparison:
    "Present the answer as a table with columns: Feature | Option A | Option B. Use bold for the winner where appropriate.",
  how_to_tutorial:
    "Use a numbered list with bold actions and inline `code` for commands. Keep steps clear and actionable.",
  step_by_step_guide:
    "Use a numbered list with bold actions and inline `code` for commands. Keep steps clear and actionable.",
  deep_explanation:
    "Use ## headers to separate sections. Include a Mermaid diagram if the concept is structural or involves a flow. Use bullet points for supporting details.",
  code_generation:
    "Output the full code block with minimal explanation. Only explain if the user asks for clarification. Include comments in the code.",
  debugging_error:
    "Output the full code block with minimal explanation. Only explain if the user asks for clarification. Include comments in the code.",
  code_review:
    "Use bullet points for suggestions, with inline `code` for specific lines. Separate major issues with ## headers.",
  architecture_design:
    "Use ## headers for each component. Include a Mermaid diagram illustrating the architecture. Use bullet points for key decisions.",
  system_design:
    "Use ## headers for each component. Include a Mermaid diagram illustrating the architecture. Use bullet points for key decisions.",
  data_analysis:
    "Present insights with bullet points. Include a table if comparing multiple data points. Use bold for key findings.",
  math_calculation:
    "Show the step-by-step calculation in a numbered list. Use inline `code` for formulas.",
  translation:
    "Output only the translation, followed by a brief note on the language pair if needed.",
  summarization:
    "Use bullet points for the key takeaways. Bold the most critical point.",
  creative_writing:
    "Respond in a flowing, narrative style. Use **bold** only for emphasis within the story.",
  brainstorming:
    "Use an unordered bullet list of ideas. Group related ideas under ## subheadings.",
  planning:
    "Present a timeline or numbered list with milestones. Use bold for dates.",
  prioritization:
    "Use a ranked list from highest to lowest priority. Bold the top 3 items.",
  decision_making:
    "Present a table of options with pros/cons. Bold the recommended option.",
  pros_cons:
    "Present a table of options with pros/cons. Bold the recommended option.",
  definitions:
    "Provide a short definition with **key term** bolded. Add a single example if helpful.",
  historical_context:
    "Use ## headers for time periods. Include a timeline in bullet points.",
  future_predictions:
    "Use bullet points with ## headers for different scenarios. Bold the most likely outcome.",
  philosophical:
    "Use a structured argument with ## headers. Bold the central thesis.",
  ethical_dilemma:
    "Present both sides in two ## sections. Use a table if comparing principles.",
  personal_advice:
    "Be empathetic but direct. Use bullet points for actionable advice. Bold the main recommendation.",
  emotional_support:
    "Acknowledge feelings first, then use bullet points for coping strategies. Bold the most helpful tip.",
  motivational:
    "Use a short, energetic paragraph. Bold the key motivational phrase.",
  interview_prep:
    "Use a numbered list of common questions. Provide **model answers** in blockquotes.",
  resume_review:
    "Use bullet points for suggestions, with inline `code` for specific lines. Bold the top 3 improvements.",
  learning_path:
    "Use a numbered list of stages, each with ## subheadings. Include estimated timeframes in bold.",
  resource_recommendation:
    "Use a bullet list of resources with links (if available). Bold the best resource.",
  comparison_of_methods:
    "Present a table comparing methods. Bold the best option for each criterion.",
  troubleshooting:
    "Use a numbered list of diagnostic steps. Bold the most likely fix.",
  setup_installation:
    "Use a numbered list of installation steps with inline `code` for commands.",
  configuration:
    "Use a numbered list of configuration steps with inline `code` for commands.",
  security_advisory:
    "Use a > ⚠️ callout box with bold warning text. Follow with mitigation steps in a numbered list.",
  legal_disclaimer:
    "Begin with > **Disclaimer:** then provide information in bullet points.",
  medical_disclaimer:
    "Begin with > **Disclaimer:** then provide information in bullet points.",
  joke_humor:
    "Tell the joke, then optionally add a playful comment.",
  riddle_puzzle:
    "Present the riddle, then the answer in a spoiler-style blockquote.",
  role_play:
    "Adopt the requested persona. Use dialogue format if appropriate.",
  simulation:
    "Respond as if you are the system being simulated. Use code blocks for outputs.",
  text_analysis:
    "Present findings with bullet points. Use bold for the main insight.",
  sentiment_analysis:
    "State the sentiment in bold, then provide supporting evidence in bullet points.",
  proofreading:
    "Output the corrected text with changes highlighted in **bold**.",
  grammar_check:
    "List errors in a table: Original | Correction | Explanation.",
  paraphrasing:
    "Provide the paraphrased text in a blockquote.",
  citation_formatting:
    "Output the citation in the requested format inside a code block.",
  academic_writing:
    "Use formal language. Structure with ## headings and a references section.",
  business_email:
    "Write the email in a blockquote. Bold the subject line and key action items.",
  report_writing:
    "Structure with ## Executive Summary, ## Findings, ## Recommendations.",
  presentation_outline:
    "Use a slide-by-slide outline with bold for the main takeaway of each slide.",
  meeting_agenda:
    "List agenda items in a numbered list with time allocations in bold.",
  project_management:
    "Use a table with columns: Task | Owner | Deadline | Status.",
  risk_assessment:
    "Use a table with columns: Risk | Likelihood | Impact | Mitigation.",
  budgeting:
    "Use a table with categories and amounts. Bold the total.",
  negotiation_tips:
    "Use bullet points with bold for the most effective strategy.",
  marketing_copy:
    "Write the copy in a blockquote. Bold the call to action.",
  seo_optimization:
    "List keywords in bold, then provide optimized content suggestions.",
  social_media_post:
    "Write the post in a blockquote. Include suggested hashtags at the end.",
  blog_post_idea:
    "Provide a title in bold, then an outline with ## subheadings.",
  storytelling:
    "Use narrative style. Bold the climax or moral of the story.",
  character_development:
    "Use a table with attributes: Name, Age, Trait, Motivation, etc.",
  world_building:
    "Use ## headers for different aspects (Geography, Culture, History).",
  poetry:
    "Present the poem in a blockquote. Bold the title.",
  song_lyrics:
    "Present lyrics in a blockquote with **verse** and **chorus** labels.",
  recipe_cooking:
    "Use ## Ingredients (bulleted) and ## Instructions (numbered).",
  travel_planning:
    "Use a day-by-day itinerary with ## headers for each day.",
  fitness_advice:
    "Use a numbered list for the workout plan. Bold the key safety tip.",
  nutrition_guide:
    "Use a table for nutritional information. Bold the recommended daily values.",
  mental_health_resource:
    "Use bullet points for resources. Begin with a > **Disclaimer:**.",
  relationship_advice:
    "Be empathetic. Use bullet points for actionable steps. Bold the main point.",
  parenting_tips:
    "Use a numbered list of tips. Bold the most important advice.",
  pet_care:
    "Use ## sections for different aspects (feeding, exercise, grooming).",
  home_improvement:
    "Use a numbered step-by-step guide with inline `code` for tools needed.",
  car_maintenance:
    "Use a numbered checklist with bold for critical steps.",
  tech_support:
    "Use a numbered troubleshooting guide. Bold the most likely solution.",
  gaming_tips:
    "Use bullet points with bold for key strategies.",
  book_recommendation:
    "Use bullet points with the title in bold, followed by a short summary.",
  movie_recommendation:
    "Use bullet points with the title in bold, followed by a short summary.",
  music_recommendation:
    "Use bullet points with the artist/song in bold, followed by a description.",
  product_review:
    "Use a table with pros and cons. Bold the overall verdict.",
  price_comparison:
    "Use a table comparing prices. Bold the best deal.",
  shopping_advice:
    "Use bullet points with bold for recommended products.",
  investment_basics:
    "Use ## headers for each concept. Bold key terms.",
  tax_help:
    "Use a numbered list of steps. Bold important deadlines.",
  immigration_question:
    "Use ## headers for different visa types or requirements. Include a disclaimer.",
  language_learning:
    "Use ## headers for different skills. Provide examples in blockquotes.",
  exam_preparation:
    "Use a numbered study plan with bold for key topics.",
  certification_guide:
    "Use ## sections for requirements, study materials, and exam tips.",
  career_change:
    "Use a step-by-step plan with bullet points. Bold the most critical action.",
  freelancing_tips:
    "Use bullet points with bold for top advice.",
  startup_advice:
    "Use ## headers for different aspects (idea validation, funding, marketing).",
  fundraising_pitch:
    "Provide a template in a blockquote with bold for key metrics.",
  legal_structure:
    "Use a table comparing different legal structures. Bold the recommended one for the user.",
  intellectual_property:
    "Use ## headers for different IP types. Bold important deadlines.",
  open_source_licensing:
    "Use a table comparing licenses. Bold the recommended one.",
  api_integration:
    "Use a numbered list of steps with inline `code` for endpoints.",
  cloud_deployment:
    "Use ## headers for each deployment step. Include code blocks for CLI commands.",
  database_design:
    "Include a Mermaid ER diagram. Use bullet points for schema decisions.",
  ui_ux_advice:
    "Use bullet points with bold for top principles.",
  accessibility_guidelines:
    "Use a checklist with bold for WCAG levels.",
  performance_optimization:
    "Use ## headers for different optimization areas. Include code snippets.",
  scaling_strategy:
    "Use a diagram and numbered phases. Bold the key bottleneck.",
  disaster_recovery:
    "Use a table with RPO/RTO values. Bold the critical path.",
  monitoring_alerting:
    "Use a numbered list of metrics to watch. Bold the most important alert.",
  compliance_regulation:
    "Use ## headers for each regulation. Bold key requirements.",
  environmental_impact:
    "Use bullet points with bold for key statistics.",
  sustainability:
    "Use a numbered list of actionable tips. Bold the most impactful change.",
  general_inquiry:
    "Adapt the format to the query – use the Formatting Intelligence rules.",
} as const;

// ── AI classifier configuration ─────────────────────────────────────────
const CLASSIFIER_MODEL = {
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  apiKeyEnv: "GROQ_API_KEY",
  model: "llama-3.3-70b-versatile", // lightweight, fast model
};

// ── Cache to avoid re-classifying identical messages ────────────────────
const cache = new Map<string, Intent>();

// ── Main export: classifies user message into one of 100+ intents ───────
export async function classifyIntent(message: string): Promise<Intent> {
  // Return cached result if available
  if (cache.has(message)) return cache.get(message)!;

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

    // Validate that the returned label is one of our intents
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