// Returns the user's current limit status across all models/tiers.
// Used by the frontend to show a countdown timer when limits are exhausted.
// IMPORTANT: Never exposes LLM model names — only the earliest reset time.

import { NextResponse } from "next/server";
import { createChatServerClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { getRouterConfig } from "@/lib/routers/router-factory";
import { checkTokenLimits } from "@/lib/chat/token-usage";

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
  // IMPORTANT: user_model_usage is in the CHAT schema, must use chat client.
  // Direct table query — no RPC needed.
  if (userPlan === "free") {
    let earliestReset: string | null = null;
    let exhaustedCount = 0;
    const allowedTiers = routerConfig.allowedModelKeys;
    const now = new Date();

    // Fetch all usage rows for this user in one query
    const { data: usageRows } = await supabase
      .from("user_model_usage")
      .select("model_id, messages_sent, tokens_used, reset_at")
      .eq("user_id", user.id);

    const usageMap = new Map<string, any>();
    if (usageRows) {
      for (const row of usageRows) {
        usageMap.set(row.model_id, row);
      }
    }

    // Per-model limits (must match model-limits.ts)
    const freeLimits: Record<string, { messages: number; tokens: number; label: string }> = {
      fast: { messages: 15, tokens: 6800, label: "N Fast" },
      plus: { messages: 10, tokens: 6800, label: "N Plus" },
      pro: { messages: 5, tokens: 6800, label: "N Pro" },
      code: { messages: 5, tokens: 6800, label: "N Code" },
      live: { messages: 5, tokens: 6800, label: "N Live" },
      aai: { messages: 5, tokens: 6800, label: "N AAI" },
    };

    // Build per-tier remaining info for the UI
    const tierStatus: Record<string, { remaining: number; total: number; label: string; exhausted: boolean; resetsAt: string | null }> = {};

    for (const tier of allowedTiers) {
      const limit = freeLimits[tier];
      if (!limit) continue;

      const usage = usageMap.get(tier);
      const resetAt = usage?.reset_at ? new Date(usage.reset_at) : now;
      const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60);

      // Window expired or no usage — full quota available
      if (!usage || hoursSinceReset >= 24) {
        tierStatus[tier] = { remaining: limit.messages, total: limit.messages, label: limit.label, exhausted: false, resetsAt: null };
        continue;
      }

      const messagesSent = usage.messages_sent || 0;
      const tokensUsed = usage.tokens_used || 0;
      const isExhausted = messagesSent >= limit.messages || tokensUsed >= limit.tokens;
      const remaining = Math.max(0, limit.messages - messagesSent);
      const nextReset = new Date(resetAt.getTime() + 24 * 60 * 60 * 1000).toISOString();

      tierStatus[tier] = { remaining, total: limit.messages, label: limit.label, exhausted: isExhausted, resetsAt: isExhausted ? nextReset : null };

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

  // ── Pro plan: check per-LLM SQL limits (ni_token_usage + gpt5_token_usage) ──
  // Pro uses separate SQL tables with hardcoded daily limits, NOT the generic
  // token_usage table. deepseek-v4-flash is unlimited (not tracked).
  if (userPlan === "pro") {
    // 5 tracked models: opus(10k), sonnet(16k), deepseek-pro(34k), gpt-5(20k), gpt-5-mini(34k)
    const niModels = ['claude-opus-4.6', 'claude-sonnet-4.6', 'deepseek-v4-pro'];
    const gpt5Models = ['gpt-5', 'gpt-5-mini'];
    let exhaustedCount = 0;
    let earliestReset: string | null = null;

    // Check NI models
    for (const modelType of niModels) {
      const { data, error } = await serverClient.rpc('get_or_reset_ni_token_usage', {
        p_user_id: user.id,
        p_model_type: modelType,
      });
      if (error) continue;
      const remaining = data?.[0]?.remaining_tokens ?? 0;
      const lastReset = data?.[0]?.last_reset_at;
      if (remaining <= 0) {
        exhaustedCount++;
        // Reset is 24h after last_reset_at
        if (lastReset) {
          const resetAt = new Date(new Date(lastReset).getTime() + 24 * 60 * 60 * 1000).toISOString();
          if (!earliestReset || new Date(resetAt) < new Date(earliestReset)) {
            earliestReset = resetAt;
          }
        }
      }
    }

    // Check GPT-5 models
    for (const modelType of gpt5Models) {
      const { data, error } = await serverClient.rpc('get_or_reset_gpt5_token_usage', {
        p_user_id: user.id,
        p_model_type: modelType,
      });
      if (error) continue;
      const remaining = data?.[0]?.remaining_tokens ?? 0;
      const lastReset = data?.[0]?.last_reset_at;
      if (remaining <= 0) {
        exhaustedCount++;
        if (lastReset) {
          const resetAt = new Date(new Date(lastReset).getTime() + 24 * 60 * 60 * 1000).toISOString();
          if (!earliestReset || new Date(resetAt) < new Date(earliestReset)) {
            earliestReset = resetAt;
          }
        }
      }
    }

    const totalTrackedModels = niModels.length + gpt5Models.length;
    return NextResponse.json({
      plan: "pro",
      allExhausted: exhaustedCount === totalTrackedModels,
      anyExhausted: exhaustedCount > 0,
      exhaustedCount,
      totalModels: totalTrackedModels,
      resetsAt: earliestReset,
    });
  }

  // ── Plus Pro: check per-model token limits via generic token_usage table ──
  if (userPlan === "plus_pro" && routerConfig.perModelTokenLimits) {
    const modelTier = "plus_pro";
    let earliestReset: string | null = null;
    let exhaustedCount = 0;
    const modelKeys = Object.keys(routerConfig.perModelTokenLimits);

    for (const modelKey of modelKeys) {
      const limits = routerConfig.perModelTokenLimits[modelKey];
      const check = await checkTokenLimits(
        serverClient,
        user.id,
        modelTier,
        limits.daily,
        limits.monthly,
        modelKey
      );
      if (!check.allowed) {
        exhaustedCount++;
        const reset = check.dailyResetAt || check.monthlyResetAt;
        if (reset && (!earliestReset || new Date(reset) < new Date(earliestReset))) {
          earliestReset = reset;
        }
      }
    }

    return NextResponse.json({
      plan: userPlan,
      allExhausted: exhaustedCount === modelKeys.length,
      anyExhausted: exhaustedCount > 0,
      exhaustedCount,
      totalModels: modelKeys.length,
      resetsAt: earliestReset,
    });
  }

  // ── Go Plus: single model, check tier-level token limits ──
  if (userPlan === "go_plus") {
    const check = await checkTokenLimits(
      serverClient,
      user.id,
      "go_plus",
      routerConfig.dailyTokenLimit,
      routerConfig.monthlyTokenLimit
    );
    return NextResponse.json({
      plan: "go_plus",
      allExhausted: !check.allowed,
      anyExhausted: !check.allowed,
      exhaustedCount: check.allowed ? 0 : 1,
      totalModels: 1,
      resetsAt: check.allowed ? null : (check.dailyResetAt || check.monthlyResetAt),
    });
  }

  return NextResponse.json({ plan: userPlan, allExhausted: false, anyExhausted: false, resetsAt: null });
}
