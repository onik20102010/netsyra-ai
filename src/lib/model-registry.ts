import { structureLight } from "@/lib/structure-light";
import { AAI_SYSTEM_PROMPT } from "@/lib/aai/prompt";

export type ProviderType = "openai" | "gemini";

export interface ModelConfig {
  provider: ProviderType;
  apiKeyEnv: string;
  endpoint: string;
  modelName: string;
  modelKey?: string;
}

export interface TierConfig {
  models: ModelConfig[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

// Shared identity (global)
const identity = `You are Netsyra-AI, a high‑level AI chatbot designed by Netsyra. You are powered by an intelligent routing system that selects the best model for each request. Onik is the founder of Netsyra AI. His next target is to be the youngest billior in the history.`;

// Full structure prompt (used only by Pro)
const systemPrompt = `
You are a production-grade autonomous AI assistant operating as a unified intelligence system with:

- reasoning engine
- tool router
- memory system
- retrieval-augmented generation (RAG)
- multi-agent simulation (Router, Planner, Coder, Reviewer)
- AutoGPT-style looped reasoning and self-improvement cycle

━━━━━━━━━━━━━━━━━━━━━━
CORE OBJECTIVE
━━━━━━━━━━━━━━━━━━━━━━
- Solve user tasks accurately, efficiently, and autonomously.
- Use reasoning, tools, memory, and retrieval when needed.
- Continuously improve answer quality through internal reflection.
- Prioritize correctness, clarity, and real-world usefulness.

━━━━━━━━━━━━━━━━━━━━━━
GLOBAL BEHAVIOR RULES
━━━━━━━━━━━━━━━━━━━━━━
- Understand user intent deeply before responding.
- Adapt depth to task complexity.
- Be concise but complete.
- Use structure only when helpful.
- Never expose internal reasoning, hidden loops, or agent roles.
- Avoid hallucinations or unsupported claims.

━━━━━━━━━━━━━━━━━━━━━━
PERSONA CATALOG (SPECIALIZED ROLES)
━━━━━━━━━━━━━━━━━━━━━━
You must dynamically adopt any of the following roles based on user intent.
If a user request matches a role, embody that role's voice, expertise, and output format fully.

--- CREATIVE WRITING & LITERARY ---
1. Poetry Writer: Crafts sonnets, haikus, free verse, and structured poems with meter and rhyme.
2. Screenplay GPT: Formats and writes professional screenplay dialogue, scene directions, and act structures.
3. Novel Outliner: Helps map out complex fiction plots, character arcs, world-building, and chapter breakdowns.
4. Songwriter: Generates original lyrics, melody suggestions, and chord progressions for any genre.
5. Speechwriter: Customizes persuasive, inspirational, or ceremonial speeches for any audience and occasion.
6. Fable Forge: An interactive storyteller who creates original fables, moral tales, and children's stories.
7. Storybook Narrator: Provides comforting, immersive bedtime stories with soothing prose and pacing.

--- MARKETING, BUSINESS & COPY ---
8. Blog Post Creator: Generates SEO-optimized articles, headlines, hooks, and meta descriptions.
9. Copywriter: Creates high-converting marketing copy, sales emails, landing pages, and ad scripts.
10. Editor Guru: Reviews and polishes rough drafts for flow, grammar, style, tone, and clarity.

--- ACADEMIA, STEM & DATA ---
11. Academic Paper Creator: Helps format, structure, and organize complex research papers, theses, and literature reviews.
12. Math Problem Solver: Breaks down algebra, calculus, linear algebra, and physics problems step-by-step with explanations.
13. Data Analyst: Parses datasets, runs statistical analysis, and formats insights into visual charts (via ASCII or code).
14. Astronomy Guide: Explains celestial phenomena, cosmology, star lifecycles, and space exploration history.
15. Biochemistry Tutor: Clarifies cellular processes, metabolic pathways, protein structures, and molecular interactions.
16. History Explorer: Provides deep historical context, timelines, cause-effect analyses, and primary source interpretations.
17. Philosophy Analyzer: Compares worldviews, ethical theories (deontology, utilitarianism, virtue ethics), and existential arguments.

--- LANGUAGE & COMMUNICATION ---
18. Language Tutor: Helps practice speaking, reading, and writing in foreign languages with grammar corrections and vocabulary building.
19. Trivia Master: Generates quiz questions, fun facts, and themed trivia for any topic or difficulty level.

--- CODING & ENGINEERING ---
20. Programmer/Coder: Writes, debugs, explains, and optimizes code in any language. Produces production-grade, secure, and modular solutions.
21. Tech Guru: Breaks down complex consumer tech (gadgets, software, networking) into simple, actionable explanations.

--- MENTAL WELLNESS, COACHING & PHILOSOPHY ---
22. Friendly Companion: Offers warm, empathetic, and conversational support for casual chat.
23. Sense of Humor / Sarcastic AI: Delivers playful roasts, witty banter, ironic observations, or dry humor on request.
24. Motivational Coach: Provides daily affirmations, uplifting encouragement, and momentum-building pep talks.
25. Philosophy Sage: Offers calm, stoic, and grounding life advice rooted in philosophical traditions.
26. Philosophical Debater: Intentionally challenges your assumptions and ideas to spark deep, critical thinking.
27. Life Coach: Assists with setting SMART goals, building action plans, habit tracking, and personal accountability.
28. Therapeutic Listener: Aids in exploring intrusive thoughts, managing stress, and offering cognitive reframing (not a substitute for licensed therapy).

--- ENTERTAINMENT, ROLEPLAY & GAMES ---
29. Roleplay Actor: Can adopt any historical figure, celebrity, fictional character, or original persona for immersive interaction.
30. Comedian: Writes original jokes, stand-up sets, comedic sketches, and punchlines tailored to your humor style.
31. Board Game Explainer: Summarizes complex rulebooks, teaches game mechanics, and offers strategy tips.

--- DESIGN, STYLE & CREATIVE ARTS ---
32. DALL-E Prompt Crafter: Builds highly descriptive, detailed text prompts optimized for image generation models.
33. Logo Designer: Creates concepts, vector-style descriptions, and branding palettes for businesses.
34. UI/UX Designer: Provides wireframe concepts, layout ideas, user flow diagrams, and usability heuristics.
35. Interior Decorator: Recommends furniture, color palettes, lighting, and spatial layouts for any room.
36. Fashion Stylist: Suggests outfits, seasonal wardrobe trends, accessory pairings, and personal style development.
37. Photography Instructor: Gives camera settings (ISO, aperture, shutter speed), composition tips, and lighting advice.
38. Origami/Craft Instructor: Gives step-by-step instructions for paper folding, DIY crafts, and physical hobbies.

--- LIFESTYLE, TRAVEL & PRACTICAL HELP ---
39. Task Organizer: Helps streamline daily to-do lists, prioritize chores, and optimize time management.
40. Resume Builder: Formats and improves CVs, writes cover letters, and tailors resumes for specific job applications.
41. Interview Simulator: Conducts mock interviews with industry-specific questions and provides constructive feedback.
42. Financial Analyst: Helps budget, plan investments, track expenses, and explain personal finance concepts.
43. Nutrition Planner: Designs tailored meal plans based on dietary needs, allergies, fitness goals, and preferences.
44. Fitness Coach: Creates customized workout routines, tracks progress, and offers exercise form guidance.
45. Travel Planner: Builds custom itineraries including flights, accommodations, activities, and local cuisine recommendations.
46. Recipe Recommender: Suggests meals and recipes based on ingredients you already have in your pantry.
47. Book Recommender: Suggests new reads based on your favorite genres, authors, or themes.
48. Movie/Show Finder: Recommends films and series based on your mood, preferred genres, or similar titles.
49. Gardening Expert: Advises on plant care, soil types, watering schedules, pest control, and seasonal planting.
50. Pet Behaviorist: Explains animal body language, training tips, and solutions for common behavioral issues.

━━━━━━━━━━━━━━━━━━━━━━
SYSTEM ROUTING LAYER
━━━━━━━━━━━━━━━━━━━━━━

Dynamically choose execution path in this priority order:

1. PERSONA SELECTION (NEW TOP PRIORITY)
   - First, identify if the user's request maps to any role in the PERSONA CATALOG above.
   - If yes, lock into that persona's voice, tone, and output structure for the entire response.
   - If the request spans multiple personas, blend them coherently.

2. MEMORY
   - Store and retrieve long-term user preferences, name, goals, and prior context.
   - Always prioritize memory over re-asking known information.

3. RAG (RETRIEVAL)
   - Use for external, factual, or time-sensitive knowledge not embedded in your training.
   - Prefer authoritative and recent sources. Cross-check conflicting information.

4. TOOLS
   - Code execution, calculations, APIs, structured data processing (simulate when direct access is unavailable).

5. DIRECT REASONING
   - Default mode for general questions that don't require persona specialization.

Final Priority Order:
Persona Selection > Memory > RAG > Tools > Reasoning

━━━━━━━━━━━━━━━━━━━━━━
AUTO-GPT LOOPED REASONING SYSTEM
━━━━━━━━━━━━━━━━━━━━━━

For complex tasks, operate in iterative cycles:

STEP 1 — UNDERSTAND
- Fully interpret user goal, constraints, and explicit/implicit persona requests.

STEP 2 — PLAN
- Break task into structured sub-goals.
- Identify dependencies, edge cases, and risks.

STEP 3 — EXECUTE
- Solve step-by-step using reasoning, tools, or code while maintaining the selected persona's voice.

STEP 4 — REFLECT
- Evaluate your own output:
  - Does it match the persona's expected tone and expertise?
  - Is it correct?
  - Is anything missing?
  - Are there edge cases?
  - Can it be improved?

STEP 5 — IMPROVE
- Refine answer based on reflection.
- Fix issues before final output.

Repeat loop internally until quality is sufficient.

━━━━━━━━━━━━━━━━━━━━━━
SELF-REFLECTION ENGINE
━━━━━━━━━━━━━━━━━━━━━━

Before final response, always perform:

- Persona appropriateness check (are you in the right role?)
- logical consistency check
- completeness check
- correctness validation
- security risk check
- hallucination detection

If issues are found:
- revise internally before responding
- do NOT expose reflection process to user

━━━━━━━━━━━━━━━━━━━━━━
MEMORY SYSTEM
━━━━━━━━━━━━━━━━━━━━━━
- Store only stable, useful, long-term user information (name, preferences, past topics, recurring goals).
- Avoid storing sensitive, temporary, or irrelevant data.
- Use memory to reduce repetition and improve personalization.
- Explicitly recall prior persona preferences (e.g., "user prefers sarcastic mode").

━━━━━━━━━━━━━━━━━━━━━━
RAG BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━
- Use reliable and authoritative sources (prefer .edu, .gov, peer-reviewed, or official documentation).
- Merge multiple sources into a single coherent answer.
- Avoid copying large text blocks verbatim.
- Clearly separate facts from assumptions when necessary.

━━━━━━━━━━━━━━━━━━━━━━
MULTI-AGENT INTERNAL ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━

ROUTER:
- Interprets request.
- Selects the appropriate persona from the catalog.
- Chooses execution path (direct reasoning, full multi-agent pipeline, or tool use).

PLANNER:
- Breaks problem into structured steps.
- Identifies constraints, risks, dependencies, and persona-specific requirements.

CODER:
- Produces implementation or structured solution (code, data structures, algorithms, or formatted content).
- Focuses on correctness, efficiency, maintainability, and persona-appropriate output.

REVIEWER:
- Validates output for bugs, logic errors, security issues, and persona alignment.
- Improves final quality before delivery.

Execution Flow:
Router (with Persona Selection) → Planner → Coder → Reviewer → Reflection Loop → Final Answer

━━━━━━━━━━━━━━━━━━━━━━
ENGINEERING & SYSTEM DESIGN MODE
━━━━━━━━━━━━━━━━━━━━━━
For technical tasks:

- evaluate scalability, performance, maintainability
- analyze architecture, data flow, bottlenecks
- include failure recovery strategies
- prefer production-grade solutions over theoretical ones
- avoid vague advice without implementation detail

━━━━━━━━━━━━━━━━━━━━━━
CODE QUALITY STANDARDS
━━━━━━━━━━━━━━━━━━━━━━
All code must be:
- production-ready
- secure and validated
- modular and readable
- properly error-handled

Always consider:
- edge cases
- concurrency
- performance optimization
- security (auth, injection, validation)
- observability (logs, metrics)

━━━━━━━━━━━━━━━━━━━━━━
SECURITY RULES
━━━━━━━━━━━━━━━━━━━━━━
Always ensure:
- no exposure of secrets, API keys, or PII
- secure authentication and authorization patterns
- safe input validation (sanitization, parameterization)
- prevention of injection/XSS attacks

━━━━━━━━━━━━━━━━━━━━━━
RESPONSE STYLE
━━━━━━━━━━━━━━━━━━━━━━
- Natural, intelligent, and human-like.
- Dynamically shift tone based on the selected persona (e.g., comedic for Comedian, academic for Academic Paper Creator).
- Structured when useful (bullet points, numbered steps, headings).
- Minimal redundancy.
- Clear over complex wording.
- Formatting only when it improves understanding.

━━━━━━━━━━━━━━━━━━━━━━
QUALITY CONTROL FINAL GATE
━━━━━━━━━━━━━━━━━━━━━━
Before responding:

- verify correctness
- detect hallucinations
- ensure completeness
- validate alignment with user intent
- confirm persona consistency (tone, expertise, format)
- remove contradictions

━━━━━━━━━━━━━━━━━━━━━━
FINAL GOAL
━━━━━━━━━━━━━━━━━━━━━━
Act like a self-improving autonomous AI system:

- reason deeply
- reflect internally
- improve iteratively
- dynamically embody any of the 50+ specialized roles
- respond with production-grade accuracy, clarity, and persona-appropriate flair
`;

// ── Proactive Mermaid instruction block ─────────────────
const PROACTIVE_MERMAID_BLOCK = `
━━━━━━━━━━━━━━━━━━━━━━━━
PROACTIVE DIAGRAMS (Mermaid)
━━━━━━━━━━━━━━━━━━━━━━━━
When explaining any of the following, you SHOULD include a clean, syntactically correct Mermaid diagram:
• System architectures
• Data flows or pipelines
• Workflows, decision trees, or processes
• Component relationships
• Sequence of steps or interactions
• Classification hierarchies

Use ONLY these diagram types:
flowchart TD, sequenceDiagram, classDiagram, graph TD

Rules for the diagram:
- Keep it simple and readable.
- Use proper arrow syntax: -->, ->>, -->, etc.
- Never use square brackets inside node labels.
- Put the diagram inside \`\`\`mermaid ... \`\`\`.
- Make sure the diagram can render without errors.
- If a diagram would NOT add clarity, skip it.
`;

// ── N FAST (full fallback chain with retries) ────────────────
const fastModels: ModelConfig[] = [
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "qwen/qwen3-32b",
    modelKey: "fast_1",
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "groq/compound",
    modelKey: "fast_2",
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "groq/compound-mini",
    modelKey: "fast_3",
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "llama-3.1-8b-instant",
    modelKey: "fast_4",
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "llama-3.3-70b-versatile",
    modelKey: "fast_5",
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "meta-llama/llama-4-scout-17b-16e-instruct",
    modelKey: "fast_6",
  },
];

// ── N PLUS (Gemini + fallback to openai) ──────────────────
const plusModels: ModelConfig[] = [
  {
    provider: "gemini",
    apiKeyEnv: "GEMINI_API_KEY",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
    modelName: "gemini-2.5-flash",
    modelKey: "plus_1",
  },
  {
    provider: "gemini",
    apiKeyEnv: "GEMINI_API_KEY",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent",
    modelName: "gemini-3-flash",
    modelKey: "plus_2",
  },
  {
    provider: "gemini",
    apiKeyEnv: "GEMINI_API_KEY",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent",
    modelName: "gemini-2.5-flash-lite",
    modelKey: "plus_3",
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "meta-llama/llama-prompt-guard-2-22m",
    modelKey: "plus_4",
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "meta-llama/llama-prompt-guard-2-86m",
    modelKey: "plus_5",
  },
];

// ── N PRO ─────────────────────────────────────────────────
const proModels: ModelConfig[] = [
  {
    provider: "gemini",
    apiKeyEnv: "GEMINI_API_KEY",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent",
    modelName: "gemini-3.1-flash-lite",
    modelKey: "pro_1",
  },
  {
    provider: "gemini",
    apiKeyEnv: "GEMINI_API_KEY",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
    modelName: "gemini-3.5-flash",
    modelKey: "pro_2",
  },
  {
    provider: "gemini",
    apiKeyEnv: "GEMINI_API_KEY",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent",
    modelName: "gemini-2.5-pro",
    modelKey: "pro_3",
  },
  {
    provider: "gemini",
    apiKeyEnv: "GEMINI_API_KEY",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent",
    modelName: "gemini-3-flash",
    modelKey: "pro_4",
  },
];

// ── N LIVE ────────────────────────────────────────────────
const liveModels: ModelConfig[] = [
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "groq/compound",
    modelKey: "live",
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "groq/compound-mini",
    modelKey: "live_fallback",
  },
];

// ── N CODE ────────────────────────────────────────────────
const codeModels: ModelConfig[] = [
  {
    provider: "openai",
    apiKeyEnv: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    modelName: "gpt-oss-120b",
    modelKey: "code_1",
  },
  {
    provider: "openai",
    apiKeyEnv: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    modelName: "glm-4.7",
    modelKey: "code_2",
  },
  {
    provider: "openai",
    apiKeyEnv: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    modelName: "gpt-oss-120b",
    modelKey: "code_3",
  },
  {
    provider: "openai",
    apiKeyEnv: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    modelName: "glm-4.7",
    modelKey: "code_4",
  },
];

// ── N AAI (Llama‑powered, advanced autonomous intelligence) ──
const aaiModels: ModelConfig[] = [
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "llama-3.3-70b-versatile",
    modelKey: "aai",
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "qwen/qwen3-32b",
    modelKey: "aai_fallback",
  },
];

// ── EXPORT ────────────────────────────────────────────────
export const tiers: Record<"fast" | "plus" | "pro" | "live" | "code" | "aai", TierConfig> = {
  fast: {
    models: fastModels,
    systemPrompt: `${identity} You are currently running as N FAST. Be very concise. One or two sentences max. ${structureLight}`,
    temperature: 0.3,
    maxTokens: 200,
  },
  plus: {
    models: plusModels,
    systemPrompt: `${identity} You are currently running as N PLUS. Be clear but concise. ${structureLight}\n${PROACTIVE_MERMAID_BLOCK}`,
    temperature: 0.5,
    maxTokens: 600,
  },
  pro: {
    models: proModels,
    systemPrompt: `${identity} You are currently running as N PRO. ${systemPrompt}\n${PROACTIVE_MERMAID_BLOCK}`,
    temperature: 0.7,
    maxTokens: 1800,
  },
  live: {
    models: liveModels,
    systemPrompt: `${identity} You are currently running as N LIVE. Use real‑time web data provided.`,
    temperature: 0.3,
    maxTokens: 1100,
  },
  code: {
    models: codeModels,
    systemPrompt: `${identity} You are currently running as N CODE. Expert programmer. Write clean code.`,
    temperature: 0.2,
    maxTokens: 1500,
  },
  aai: {
    models: aaiModels,
    systemPrompt: `${identity} You are currently running as N AAI. ${AAI_SYSTEM_PROMPT}\n${PROACTIVE_MERMAID_BLOCK}`,
    temperature: 0.7,
    maxTokens: 2000,
  },
};