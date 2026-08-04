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
  webSearchLimitHours: number; // Time window in hours for web search limit
  webSearchProviders: ('serper' | 'tavily' | 'wikipedia')[];

  // Whether image generation is enabled
  imageGenerationEnabled: boolean;

  // Image analysis configuration
  imageAnalysisEnabled: boolean;
  imageAnalysisModel: string; // Gemini model name for vision
  imageAnalysisDailyLimit: number; // Max images per day
  imageAnalysisMonthlyTokenLimit: number; // Max tokens per month for image analysis

  // Context window size (in tokens) — optional, only for paid plans
  contextWindowSize?: number;
}

export const routerConfigs: Record<string, RouterConfig> = {
  // Router 1: Free Plan
  free: {
    allowedModelKeys: ['fast', 'plus', 'pro', 'code', 'live', 'aai'],
    dailyTokenLimit: 6800,
    monthlyTokenLimit: 204000,
    maxHistoryLength: 5,
    maxTokensPerRequest: 2000,
    webSearchEnabled: true,
    webSearchDailyLimit: 3,
    webSearchLimitHours: 24,
    webSearchProviders: ['tavily', 'wikipedia'],
    imageGenerationEnabled: false,
    imageAnalysisEnabled: true,
    imageAnalysisModel: 'gemini-2.5-flash-lite',
    imageAnalysisDailyLimit: 3,
    imageAnalysisMonthlyTokenLimit: 0, // Free plan: no monthly token limit, just daily image count
  },

  // Router 2: Go Plus Plan
  go_plus: {
    allowedModelKeys: ['go_plus'],
    dailyTokenLimit: 317000,
    monthlyTokenLimit: 9523810,
    maxHistoryLength: 40,
    maxTokensPerRequest: 3000,
    webSearchEnabled: true,
    webSearchDailyLimit: 100,
    webSearchLimitHours: 6,
    webSearchProviders: ['serper', 'tavily', 'wikipedia'],
    imageGenerationEnabled: false,
    imageAnalysisEnabled: true,
    imageAnalysisModel: 'gemini-2.5-flash',
    imageAnalysisDailyLimit: 15,
    imageAnalysisMonthlyTokenLimit: 300, // 15/day, 300/month for Go Plus
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
    webSearchDailyLimit: 200,
    webSearchLimitHours: 6,
    webSearchProviders: ['serper', 'tavily', 'wikipedia'],
    imageGenerationEnabled: false,
    imageAnalysisEnabled: true,
    imageAnalysisModel: 'gemini-2.5-flash',
    imageAnalysisDailyLimit: 30,
    imageAnalysisMonthlyTokenLimit: 600, // 30/day, 600/month for Pro
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
    webSearchDailyLimit: 250,
    webSearchLimitHours: 6,
    webSearchProviders: ['serper', 'tavily', 'wikipedia'],
    imageGenerationEnabled: true,
    imageAnalysisEnabled: true,
    imageAnalysisModel: 'gemini-2.5-flash',
    imageAnalysisDailyLimit: 30,
    imageAnalysisMonthlyTokenLimit: 600, // 30/day, 600/month for Plus Pro
    contextWindowSize: 32000,
  },
};
