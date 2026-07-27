// Router configuration for each subscription plan
// Each plan has different models, limits, context window, and web search capabilities

export interface RouterConfig {
  // Allowed model tiers for this plan
  allowedModelKeys: string[];

  // Daily token limit per user
  dailyTokenLimit: number;

  // Monthly token limit per user
  monthlyTokenLimit: number;

  // Per-model token limits (for Plus Pro)
  perModelTokenLimits?: Record<string, { daily: number; monthly: number }>;

  // Maximum number of conversation messages to include in context
  maxHistoryLength: number;

  // Maximum tokens per LLM request
  maxTokensPerRequest: number;

  // Web search configuration
  webSearchEnabled: boolean;
  webSearchDailyLimit: number;
  webSearchProviders: ('serper' | 'tavily' | 'wikipedia')[];

  // Whether image generation is enabled
  imageGenerationEnabled: boolean;

  // Context window size (in tokens)
  contextWindowSize: number;
}

export const routerConfigs: Record<string, RouterConfig> = {
  // Router 1: Free Plan
  free: {
    allowedModelKeys: ['fast', 'plus', 'pro', 'code', 'live', 'aai'],
    dailyTokenLimit: 100000,
    monthlyTokenLimit: 3000000,
    maxHistoryLength: 5,
    maxTokensPerRequest: 2000,
    webSearchEnabled: true,
    webSearchDailyLimit: 3,
    webSearchProviders: ['tavily', 'wikipedia'],
    imageGenerationEnabled: false,
    contextWindowSize: 8000,
  },

  // Router 2: Go Plus Plan
  go_plus: {
    allowedModelKeys: ['go_plus'],
    dailyTokenLimit: 317000,
    monthlyTokenLimit: 9523810,
    maxHistoryLength: 40,
    maxTokensPerRequest: 3000,
    webSearchEnabled: true,
    webSearchDailyLimit: 10,
    webSearchProviders: ['serper', 'tavily', 'wikipedia'],
    imageGenerationEnabled: false,
    contextWindowSize: 16000,
  },

  // Router 3: Pro Plan
  pro: {
    allowedModelKeys: ['ni'],
    dailyTokenLimit: 500000,
    monthlyTokenLimit: 15000000,
    maxHistoryLength: 40,
    maxTokensPerRequest: 3000,
    webSearchEnabled: true,
    webSearchDailyLimit: 50,
    webSearchProviders: ['serper', 'tavily', 'wikipedia'],
    imageGenerationEnabled: false,
    contextWindowSize: 32000,
  },

  // Router 4: + Pro Plan
  plus_pro: {
    allowedModelKeys: ['plus_pro'],
    dailyTokenLimit: 279739, // Sum of all daily limits
    monthlyTokenLimit: 8392172, // Sum of all monthly limits
    perModelTokenLimits: {
      'plus_pro_opus': { daily: 27778, monthly: 833333 }, // Claude Opus 4.8 Coding
      'plus_pro_luna': { daily: 47619, monthly: 1428571 }, // GPT-5.6 Luna
      'plus_pro_deepseek': { daily: 204342, monthly: 6130268 }, // DeepSeek-V4-pro
    },
    maxHistoryLength: 40,
    maxTokensPerRequest: 4000,
    webSearchEnabled: true,
    webSearchDailyLimit: 100,
    webSearchProviders: ['serper', 'tavily', 'wikipedia'],
    imageGenerationEnabled: true,
    contextWindowSize: 32000,
  },
};
