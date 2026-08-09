// Router configuration for each subscription plan.
// Each plan has different models, limits, context window, and web search capabilities.
//
// LIMIT STRUCTURE (clean rebuild — 2025-08-07):
//
//   Free plan:    per-tier message limits (no token limit)
//     fast=15, plus=10, pro=5, code=5, aai=5, live=3 per 24h
//
//   Go Plus:      token-only (no message limit)
//     317,000/day, 9,523,810/month
//
//   Pro (NI):     per-LLM token limits (no message limit)
//     claude-opus-4.6: 10k/300k, claude-sonnet-4.6: 16k/480k,
//     deepseek-v4-pro: 34k/1.02M, gpt-5: 20k/600k,
//     gpt-5-mini: 34k/1.02M, deepseek-v4-flash: 35k/1.05M
//
//   Plus Pro:     per-LLM token limits (no message limit)
//     opus: 27,778/833,333, luna: 47,619/1,428,571,
//     deepseek: 204,342/6,130,268
//
//   Web search:   24h sliding window for ALL plans
//     Free 3, Go Plus 100, Pro 200, Plus Pro 250
//
//   Dive deep:    24h sliding window for ALL plans
//     Free 3, Go Plus 100, Pro 200, Plus Pro 250
//
//   Image analysis:
//     Free 4/day (no monthly), Go Plus 15/day 300/month,
//     Pro 30/day 600/month, Plus Pro 30/day 600/month

export interface RouterConfig {
  // Allowed model tiers for this plan
  allowedModelKeys: string[];

  // Daily token limit per user (Go Plus + Plus Pro aggregate)
  // Free plan: 0 = no token limit (message-only)
  // Pro plan: 0 here — per-LLM limits enforced via token-usage.ts (proTokenLimits)
  dailyTokenLimit: number;

  // Monthly token limit per user
  monthlyTokenLimit: number;

  // Per-model token limits (for Plus Pro)
  perModelTokenLimits?: Record<string, { daily: number; monthly: number }>;

  // Maximum number of conversation messages to include in context
  maxHistoryLength: number;

  // Maximum tokens per LLM request (output cap)
  maxTokensPerRequest: number;

  // Web search configuration
  webSearchEnabled: boolean;
  webSearchDailyLimit: number;
  webSearchLimitHours: number; // Time window in hours for web search limit

  // Dive Deep (N Live) configuration — same limit structure as web search
  diveDeepDailyLimit: number;
  diveDeepLimitHours: number;

  // Whether image generation is enabled
  imageGenerationEnabled: boolean;

  // Image analysis configuration
  imageAnalysisEnabled: boolean;
  imageAnalysisModel: string; // Gemini model name for vision
  imageAnalysisDailyLimit: number; // Max images per day
  imageAnalysisMonthlyLimit: number; // Max images per month (0 = no monthly limit)

  // Context window size (in tokens) — optional, only for paid plans
  contextWindowSize?: number;
}

export const routerConfigs: Record<string, RouterConfig> = {
  // ── Router 1: Free Plan ──
  // Per-tier message limits (no token limit). See model-limits.ts.
  free: {
    allowedModelKeys: ['fast', 'plus', 'pro', 'code', 'live', 'aai'],
    dailyTokenLimit: 0,           // No token limit on Free
    monthlyTokenLimit: 0,         // No token limit on Free
    maxHistoryLength: 5,
    maxTokensPerRequest: 2000,
    webSearchEnabled: true,
    webSearchDailyLimit: 3,
    webSearchLimitHours: 24,      // 24h window for all plans
    diveDeepDailyLimit: 3,
    diveDeepLimitHours: 24,
    imageGenerationEnabled: false,
    imageAnalysisEnabled: true,
    imageAnalysisModel: 'gemini-2.5-flash-lite',
    imageAnalysisDailyLimit: 4,
    imageAnalysisMonthlyLimit: 0, // Free: no monthly limit, just daily count
  },

  // ── Router 2: Go Plus Plan ──
  // Token-only limits (no message limit). Single model: deepseek-v4-flash.
  go_plus: {
    allowedModelKeys: ['go_plus'],
    dailyTokenLimit: 317000,
    monthlyTokenLimit: 9523810,
    maxHistoryLength: 40,
    maxTokensPerRequest: 3000,
    webSearchEnabled: true,
    webSearchDailyLimit: 100,
    webSearchLimitHours: 24,      // 24h window
    diveDeepDailyLimit: 100,
    diveDeepLimitHours: 24,
    imageGenerationEnabled: false,
    imageAnalysisEnabled: true,
    imageAnalysisModel: 'gemini-2.5-flash',
    imageAnalysisDailyLimit: 15,
    imageAnalysisMonthlyLimit: 300,
    contextWindowSize: 16000,
  },

  // ── Router 3: Pro Plan (NI tier) ──
  // Per-LLM token limits (no message limit). See token-usage.ts (proTokenLimits).
  // dailyTokenLimit/monthlyTokenLimit here are aggregate reference values;
  // actual enforcement is per-LLM via token-usage.ts using the model name as model_key.
  pro: {
    allowedModelKeys: ['ni'],
    dailyTokenLimit: 0,           // Per-LLM enforcement via token-usage.ts
    monthlyTokenLimit: 0,         // Per-LLM enforcement via token-usage.ts
    maxHistoryLength: 40,
    maxTokensPerRequest: 3000,
    webSearchEnabled: true,
    webSearchDailyLimit: 200,
    webSearchLimitHours: 24,      // 24h window
    diveDeepDailyLimit: 200,
    diveDeepLimitHours: 24,
    imageGenerationEnabled: false,
    imageAnalysisEnabled: true,
    imageAnalysisModel: 'gemini-2.5-flash',
    imageAnalysisDailyLimit: 30,
    imageAnalysisMonthlyLimit: 600,
    contextWindowSize: 32000,
  },

  // ── Router 4: + Pro Plan ──
  // Per-LLM token limits (no message limit). See token-usage.ts + perModelTokenLimits.
  plus_pro: {
    allowedModelKeys: ['plus_pro'],
    dailyTokenLimit: 279739,      // Sum of all daily limits (reference)
    monthlyTokenLimit: 8392172,   // Sum of all monthly limits (reference)
    perModelTokenLimits: {
      'plus_pro_opus':     { daily: 27778,  monthly: 833333 },   // Claude Opus 4.8 Coding
      'plus_pro_luna':     { daily: 47619,  monthly: 1428571 },  // GPT-5.6 Luna
      'plus_pro_deepseek': { daily: 204342, monthly: 6130268 },  // DeepSeek-V4-pro
    },
    maxHistoryLength: 40,
    maxTokensPerRequest: 4000,
    webSearchEnabled: true,
    webSearchDailyLimit: 250,
    webSearchLimitHours: 24,      // 24h window
    diveDeepDailyLimit: 250,
    diveDeepLimitHours: 24,
    imageGenerationEnabled: true,
    imageAnalysisEnabled: true,
    imageAnalysisModel: 'gemini-2.5-flash',
    imageAnalysisDailyLimit: 30,
    imageAnalysisMonthlyLimit: 600,
    contextWindowSize: 32000,
  },
};
