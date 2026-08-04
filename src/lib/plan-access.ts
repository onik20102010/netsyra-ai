// Plan access — single source of truth for plan → tier mapping.
//
// IMPORTANT: The plan→tier mapping is derived from `routerConfigs` in
// `@/lib/routers/router-config` so there is only ONE place to update when
// plans change. Both the client UI (chat/page.tsx) and the server
// (chat/route.ts via routerConfig.allowedModelKeys) read from the same data.

import { routerConfigs } from "@/lib/routers/router-config";

// Derive PLAN_TIER_MAP from routerConfigs — no manual duplication.
export const PLAN_TIER_MAP: Record<string, string[]> = Object.fromEntries(
  Object.entries(routerConfigs).map(([plan, cfg]) => [plan, cfg.allowedModelKeys])
);

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
