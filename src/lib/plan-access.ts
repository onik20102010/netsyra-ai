// Plan to allowed model tier keys
export const PLAN_TIER_MAP: Record<string, string[]> = {
  free: ["fast", "plus", "pro", "code", "live", "aai"],
  "Go Plus": ["go_plus"],
  Pro: ["ni"],
  "+ Pro": ["plus_pro"],
};

export function getAllowedTiers(plan: string): string[] {
  return PLAN_TIER_MAP[plan] || PLAN_TIER_MAP.free;
}

export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  free: "Free",
  go_plus: "Go Plus",
  pro: "Pro",
  plus_pro: "+Pro",
  "Go Plus": "Go Plus",
  Pro: "Pro",
  "+ Pro": "+Pro",
};

export function getPlanFromSubscription(subscription: any): string {
  return subscription?.plan || "free";
}

export function canUseModel(plan: string, modelTier: string): boolean {
  const allowed = getAllowedTiers(plan);
  return allowed.includes(modelTier);
}
