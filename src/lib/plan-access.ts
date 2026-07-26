export const PLAN_MODEL_ACCESS: Record<string, string[]> = {
  free: ["fast", "plus", "pro", "live", "code", "aai"], // N Fast, N Plus, N Pro, N Live, N Code, N AAI, N Auto
  "Go Plus": ["fast", "plus", "pro", "live", "code", "aai", "gemini", "image_generation", "image_analysis"],
  Pro: ["ni"], // ALL LLM models from NI Pro (sonnet 4.6, opus 4.6, GPT 5, deepseek V4 Pro, deepseek V4 Pro flash, Gemini 2.5 flash lite) - no image gen
  "+ Pro": ["ni", "image_generation"], // ALL NI Pro models + image generation
};

export function getPlanFromSubscription(subscription: any): string {
  return subscription?.plan || "free";
}

export function canUseModel(plan: string, modelTier: string): boolean {
  const allowed = PLAN_MODEL_ACCESS[plan] || PLAN_MODEL_ACCESS.free;
  return allowed.includes(modelTier);
}
