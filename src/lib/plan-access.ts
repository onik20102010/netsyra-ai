// Plan to allowed model tier keys
// Keys must match the database `subscriptions.plan` column values
export const PLAN_TIER_MAP: Record<string, string[]> = {
  free: ["fast", "plus", "pro", "code", "live", "aai"],
  go_plus: ["go_plus"],
  pro: ["ni"],
  plus_pro: ["plus_pro"],
};

export function getAllowedTiers(plan: string): string[] {
  return PLAN_TIER_MAP[plan] || PLAN_TIER_MAP.free;
}

export const PLAN_DISPLAY_NAMES: Record<string, string> = {
  free: "Free",
  go_plus: "Go Plus",
  pro: "Pro",
  plus_pro: "+ Pro",
};

export function getPlanFromSubscription(subscription: any): string {
  return subscription?.plan || "free";
}

export function canUseModel(plan: string, modelTier: string): boolean {
  const allowed = getAllowedTiers(plan);
  return allowed.includes(modelTier);
}
