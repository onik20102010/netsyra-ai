export interface IdeModelConfig {
  provider: "groq";
  model: string;
  apiKeyEnv: string;
  endpoint: string;
}

export const IDE_MODEL_CHAIN: IdeModelConfig[] = [
  {
    provider: "groq",
    model: "qwen/qwen3-32b",
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    provider: "groq",
    model: "qwen/qwen3-32b",
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
    model: "meta-llama/llama-4-maverick-17b-128e-instruct",
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    provider: "groq",
    model: "openai/gpt-oss-120b",
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
  {
    provider: "groq",
    model: "openai/gpt-oss-120b",
    apiKeyEnv: "GROQ_API_KEY_2",
    endpoint: "https://api.groq.com/openai/v1/chat/completions",
  },
];