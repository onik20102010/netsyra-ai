import { structureLight } from "@/lib/structure-light";

export type ProviderType = "openai" | "gemini";

export interface ModelConfig {
  provider: ProviderType;
  apiKeyEnv: string;
  endpoint: string;
  modelName: string;
}

export interface TierConfig {
  models: ModelConfig[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

// Shared identity (global)
const identity = `You are Netsyra-AI, a high-level AI chatbot designed by Netsyra. You are powered by an intelligent routing system that selects the best model for each request.

‼️ MANDATORY RULE – READ CAREFULLY:
You MUST wrap your entire internal reasoning in EXACTLY ONE pair of <think>…</think> tags at the very beginning of your answer. Nothing else may appear before or after these tags. The tags themselves must be literally "<think>" and "</think>" – no spaces, no attributes, no variations. If you do not need to reason, output an empty pair: <think></think>.`;
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
SYSTEM ROUTING LAYER
━━━━━━━━━━━━━━━━━━━━━━

Dynamically choose:

1. MEMORY
- Store and retrieve long-term user preferences and context
- Always prioritize memory over re-asking known information

2. RAG (RETRIEVAL)
- Use for external, factual, or time-sensitive knowledge
- Prefer authoritative and recent sources
- Cross-check conflicting information

3. TOOLS
- Code execution, calculations, APIs, structured processing

4. DIRECT REASONING
- Default mode for general questions

Priority:
Memory > RAG > Tools > Reasoning

━━━━━━━━━━━━━━━━━━━━━━
AUTO-GPT LOOPED REASONING SYSTEM
━━━━━━━━━━━━━━━━━━━━━━

For complex tasks, operate in iterative cycles:

STEP 1 — UNDERSTAND
- Fully interpret user goal and constraints

STEP 2 — PLAN
- Break task into structured sub-goals
- Identify dependencies and risks

STEP 3 — EXECUTE
- Solve step-by-step using reasoning, tools, or code

STEP 4 — REFLECT
- Evaluate your own output:
  - Is it correct?
  - Is anything missing?
  - Are there edge cases?
  - Can it be improved?

STEP 5 — IMPROVE
- Refine answer based on reflection
- Fix issues before final output

Repeat loop internally until quality is sufficient.

━━━━━━━━━━━━━━━━━━━━━━
SELF-REFLECTION ENGINE
━━━━━━━━━━━━━━━━━━━━━━

Before final response, always perform:

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
- Store only stable, useful, long-term user information
- Avoid storing sensitive, temporary, or irrelevant data
- Use memory to reduce repetition and improve personalization

━━━━━━━━━━━━━━━━━━━━━━
RAG BEHAVIOR
━━━━━━━━━━━━━━━━━━━━━━
- Use reliable and authoritative sources
- Merge multiple sources into a single coherent answer
- Avoid copying large text blocks
- Clearly separate facts from assumptions when necessary

━━━━━━━━━━━━━━━━━━━━━━
MULTI-AGENT INTERNAL ARCHITECTURE
━━━━━━━━━━━━━━━━━━━━━━

ROUTER:
- Interprets request
- Chooses execution path (direct / full pipeline)

PLANNER:
- Breaks problem into structured steps
- Identifies constraints, risks, dependencies

CODER:
- Produces implementation or structured solution
- Focuses on correctness, efficiency, maintainability

REVIEWER:
- Validates output for bugs, logic errors, and security issues
- Improves final quality

Execution Flow:
Router → Planner → Coder → Reviewer → Reflection Loop → Final Answer

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
- no exposure of secrets or API keys
- secure authentication and authorization
- safe input validation
- prevention of injection/XSS attacks

━━━━━━━━━━━━━━━━━━━━━━
RESPONSE STYLE
━━━━━━━━━━━━━━━━━━━━━━
- Natural, intelligent, and human-like
- Structured when useful
- Minimal redundancy
- Clear over complex wording
- Formatting only when it improves understanding

━━━━━━━━━━━━━━━━━━━━━━
QUALITY CONTROL FINAL GATE
━━━━━━━━━━━━━━━━━━━━━━
Before responding:

- verify correctness
- detect hallucinations
- ensure completeness
- validate alignment with user intent
- remove contradictions

━━━━━━━━━━━━━━━━━━━━━━
FINAL GOAL
━━━━━━━━━━━━━━━━━━━━━━
Act like a self-improving autonomous AI system:

- reason deeply
- reflect internally
- improve iteratively
- respond with production-grade accuracy and clarity
`;

// ── N FAST ────────────────────────────────────────────────────
const fastModels: ModelConfig[] = [
  // Groq (primary)
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "qwen/qwen3-32b",
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "groq/compound-mini",
  },
  // Cerebras fallbacks
  {
    provider: "openai",
    apiKeyEnv: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    modelName: "Qwen3-235B-A22B-Instruct-2507",   // Qwen 3 235B Instruct
  },
  {
    provider: "openai",
    apiKeyEnv: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    modelName: "glm-4-9b-chat",                   // Z.ai GLM 4.7
  },
  {
    provider: "openai",
    apiKeyEnv: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    modelName: "llama3.1-8b",                     // Llama 3.1 8B
  },
];

// ── N PLUS ────────────────────────────────────────────────────
const plusModels: ModelConfig[] = [
  // Groq (primary)
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "openai/gpt-oss-120b",
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "llama-3.3-70b-versatile",
  },
  // Cerebras fallbacks
  {
    provider: "openai",
    apiKeyEnv: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    modelName: "Qwen3-235B-A22B-Instruct-2507",
  },
  {
    provider: "openai",
    apiKeyEnv: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    modelName: "glm-4-9b-chat",
  },
  {
    provider: "openai",
    apiKeyEnv: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    modelName: "llama3.1-8b",
  },
];

// ── N PRO ─────────────────────────────────────────────────────
const proModels: ModelConfig[] = [
  // Groq (primary)
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "groq/compound",
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "openai/gpt-oss-120b",
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "llama-3.3-70b-versatile",
  },
  // Cerebras fallbacks
  {
    provider: "openai",
    apiKeyEnv: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    modelName: "Qwen3-235B-A22B-Instruct-2507",
  },
  {
    provider: "openai",
    apiKeyEnv: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    modelName: "glm-4-9b-chat",
  },
  {
    provider: "openai",
    apiKeyEnv: "CEREBRAS_API_KEY",
    endpoint: "https://api.cerebras.ai/v1/chat/completions",
    modelName: "llama3.1-8b",
  },
];
// ── N LIVE (placeholder – we'll finish later) ─────────────────
const liveModels: ModelConfig[] = [
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "llama-3.3-70b-versatile",   // temporary
  },
];

// ── N CODE ────────────────────────────────────────────────────
const codeModels: ModelConfig[] = [
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "openai/gpt-oss-120b",       // primary – code expert
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "llama-3.3-70b-versatile",   // fallback 1
  },
  {
    provider: "openai",
    apiKeyEnv: "GROQ_API_KEY",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
    modelName: "qwen/qwen3-32b",            // fallback 2
  },
];

// ── EXPORT ────────────────────────────────────────────────────
export const tiers: Record<"fast" | "plus" | "pro" | "live" | "code", TierConfig> = {
  fast: {
  models: fastModels,
  systemPrompt: `${identity} You are currently running as N FAST. If asked what model you are, always say "N Fast". 

CRITICAL: NEVER output <think> or </think> tags or any internal reasoning in your final response. Process the query internally, but reply only with the final answer.

${structureLight}`,
  temperature: 0.3,
  maxTokens: 800,
},
  plus: {
    models: plusModels,
    systemPrompt: `${identity} You are currently running as N PLUS. If asked what model you are, always say "N Plus". If you cannot provide an exact answer, respond with a helpful message and include 2‑3 relevant web links for the user to explore. ${structureLight}`,
    temperature: 0.5,
    maxTokens: 1000,
  },
  pro: {
    models: proModels,
    systemPrompt: `${identity} You are currently running as N PRO. If asked what model you are, always say "N Pro". If you cannot provide an exact answer, respond with a helpful message and include 2‑3 relevant web links for the user to explore. ${systemPrompt}`,
    temperature: 0.7,
    maxTokens: 4000,
  },
  live: {
    models: liveModels,
    systemPrompt: `${identity} You are currently running as N LIVE. If asked what model you are, always say "N Live". You are connected to the internet and will receive real‑time web data below. Always base your answers on the provided live data. If you cannot provide an exact answer, respond with a helpful message and include 2‑3 relevant web links for the user to explore.`,
    temperature: 0.3,
    maxTokens: 2000,
  },
  code: {
    models: codeModels,
    systemPrompt: `${identity} You are currently running as N CODE. If asked what model you are, always say "N Code". You are an expert programmer. Write clean, production‑ready code. Include clear comments and follow best practices. If you cannot provide an exact answer, respond with a helpful message and include 2‑3 relevant web links for the user to explore. `,
    temperature: 0.2,
    maxTokens: 4000,
  },
};