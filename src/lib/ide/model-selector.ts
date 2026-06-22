export interface IdeModelConfig {
  provider: "groq";
  model: string;
  apiKeyEnv: string;
  endpoint: string;
}

export const IDE_MODEL_CHAIN: IdeModelConfig[] = [
  {
    provider: "groq",
    model: "llama-3.1-8b-instant",
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    provider: "groq",
    model: "llama-3.1-8b-instant",
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    provider: "groq",
    model: "gemma2-9b-it",
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    provider: "groq",
    model: "gemma2-9b-it",
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    provider: "groq",
    model: "qwen-2.5-32b",
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    provider: "groq",
    model: "qwen-2.5-32b",
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
];

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
  return null;
}