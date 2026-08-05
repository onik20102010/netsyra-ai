// Returns the user's current limit status across all models/tiers.
// Used by the frontend to show a countdown timer when limits are exhausted.
// IMPORTANT: Never exposes LLM model names — only the earliest reset time.

import { NextResponse } from "next/server";
import { createChatServerClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { getRouterConfig } from "@/lib/routers/router-factory";
import { freeTierLimits } from "@/lib/chat/model-limits";
import { checkTokenLimits, goPlusTokenLimits, plusProTokenLimits, proTokenLimits } from "@/lib/chat/token-usage";

export async function GET() {
  const supabase = await createChatServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get user's plan
  const serverClient = await createServerSupabaseClient();
  const { data: sub } = await serverClient
    .from("subscriptions")
    .select("plan, status")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  const userPlan = sub?.plan || "free";
  const routerConfig = getRouterConfig(userPlan);

  // ── Free plan: check message limits for all allowed tiers ──
  if (userPlan === "free") {
    let earliestReset: string | null = null;
    let exhaustedCount = 0;
    const allowedTiers = routerConfig.allowedModelKeys;
    const now = new Date();

    // Fetch all usage rows for this user in one query
    const { data: usageRows } = await supabase
      .from("user_message_usage")
      .select("model_tier, messages_used, reset_at")
      .eq("user_id", user.id);

    const usageMap = new Map<string, any>();
    if (usageRows) {
      for (const row of usageRows) {
        usageMap.set(row.model_tier, row);
      }
    }

    // Build per-tier remaining info for the UI
    const tierStatus: Record<string, { remaining: number; total: number; label: string; exhausted: boolean; resetsAt: string | null }> = {};

    for (const tier of allowedTiers) {
      const limit = freeTierLimits[tier];
      if (!limit) continue;

      const usage = usageMap.get(tier);
      const resetAt = usage?.reset_at ? new Date(usage.reset_at) : now;
      const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60);

      // Window expired or no usage — full quota available
      if (!usage || hoursSinceReset >= 24) {
        tierStatus[tier] = { remaining: limit.messagesPerDay, total: limit.messagesPerDay, label: limit.label, exhausted: false, resetsAt: null };
        continue;
      }

      const messagesSent = usage.messages_used || 0;
      const isExhausted = messagesSent >= limit.messagesPerDay;
      const remaining = Math.max(0, limit.messagesPerDay - messagesSent);
      const nextReset = new Date(resetAt.getTime() + 24 * 60 * 60 * 1000).toISOString();

      tierStatus[tier] = { remaining, total: limit.messagesPerDay, label: limit.label, exhausted: isExhausted, resetsAt: isExhausted ? nextReset : null };

      if (isExhausted) {
        exhaustedCount++;
        if (!earliestReset || new Date(nextReset) < new Date(earliestReset)) {
          earliestReset = nextReset;
        }
      }
    }

    return NextResponse.json({
      plan: "free",
      allExhausted: exhaustedCount === allowedTiers.length,
      anyExhausted: exhaustedCount > 0,
      exhaustedCount,
      totalTiers: allowedTiers.length,
      resetsAt: earliestReset,
      tierStatus,
    });
  }

  // ── Go Plus: check plan-level token limits ──
  if (userPlan === "go_plus") {
    const check = await checkTokenLimits(supabase, user.id, "go_plus", goPlusTokenLimits);
    return NextResponse.json({
      plan: "go_plus",
      allExhausted: !check.allowed,
      anyExhausted: !check.allowed,
      exhaustedCount: check.allowed ? 0 : 1,
      totalModels: 1,
      resetsAt: check.allowed ? null : (check.dailyResetAt || check.monthlyResetAt),
      dailyUsed: check.dailyUsed,
      dailyRemaining: check.dailyRemaining,
      monthlyUsed: check.monthlyUsed,
      monthlyRemaining: check.monthlyRemaining,
    });
  }

  // ── Pro plan: check per-LLM token limits (same token_usage table) ──
  if (userPlan === "pro") {
    let exhaustedCount = 0;
    let earliestReset: string | null = null;
    const modelNames = Object.keys(proTokenLimits);

    for (const modelName of modelNames) {
      const limits = proTokenLimits[modelName];
      const check = await checkTokenLimits(supabase, user.id, modelName, limits);
      if (!check.allowed) {
        exhaustedCount++;
        const reset = check.dailyResetAt || check.monthlyResetAt;
        if (reset && (!earliestReset || new Date(reset) < new Date(earliestReset))) {
          earliestReset = reset;
        }
      }
    }

    return NextResponse.json({
      plan: "pro",
      allExhausted: exhaustedCount === modelNames.length,
      anyExhausted: exhaustedCount > 0,
      exhaustedCount,
      totalModels: modelNames.length,
      resetsAt: earliestReset,
    });
  }

  // ── Plus Pro: check per-model token limits ──
  if (userPlan === "plus_pro" && routerConfig.perModelTokenLimits) {
    let earliestReset: string | null = null;
    let exhaustedCount = 0;
    const modelKeys = Object.keys(routerConfig.perModelTokenLimits);

    for (const modelKey of modelKeys) {
      const limits = routerConfig.perModelTokenLimits[modelKey];
      const check = await checkTokenLimits(supabase, user.id, modelKey, limits);
      if (!check.allowed) {
        exhaustedCount++;
        const reset = check.dailyResetAt || check.monthlyResetAt;
        if (reset && (!earliestReset || new Date(reset) < new Date(earliestReset))) {
          earliestReset = reset;
        }
      }
    }

    return NextResponse.json({
      plan: "plus_pro",
      allExhausted: exhaustedCount === modelKeys.length,
      anyExhausted: exhaustedCount > 0,
      exhaustedCount,
      totalModels: modelKeys.length,
      resetsAt: earliestReset,
    });
  }

  return NextResponse.json({ plan: userPlan, allExhausted: false, anyExhausted: false, resetsAt: null });
}
