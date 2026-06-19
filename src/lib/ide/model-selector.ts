export interface IdeModelConfig {
  provider: "groq";
  model: string;
  apiKeyEnv: string;
  endpoint: string;
}

// Full chain used for complex tasks – all models are verified Groq IDs
export const IDE_MODEL_CHAIN: IdeModelConfig[] = [
  {
    provider: "groq",
    model: "qwen-2.5-coder-32b",          // Qwen 2.5 Coder 32B – fast & code‑focused
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    provider: "groq",
    model: "qwen-2.5-coder-32b",          // retry the same model
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    provider: "groq",
    model: "meta-llama/llama-4-maverick-17b-128e-instruct",
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    provider: "groq",
    model: "meta-llama/llama-4-maverick-17b-128e-instruct",   // retry
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    provider: "groq",
    model: "llama-3.3-70b-versatile",     // robust fallback (replaces non‑Groq model)
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    provider: "groq",
    model: "llama-3.3-70b-versatile",     // retry
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
];

// Smart model selection: use the smallest Groq model for simple asks
export function selectModelForComplexity(
  complexity: "low" | "medium" | "high"
): IdeModelConfig | null {
  if (complexity === "low") {
    return {
      provider: "groq",
      model: "llama-3.1-8b-instant",
      apiKeyEnv: "GROQ_API_KEY_2",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
    };
  }
  return null; // medium / high → use full chain
}