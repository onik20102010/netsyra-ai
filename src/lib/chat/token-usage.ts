// src/lib/chat/token-usage.ts
//
// Token limit enforcement for ALL paid plans (Go Plus, Pro, Plus Pro).
// All plans use the SAME chat.token_usage table — the model_key column
// distinguishes them:
//
//   Go Plus:    model_key = 'go_plus'
//   Pro (NI):   model_key = LLM model name (claude-opus-4.6, etc.)
//   Plus Pro:   model_key = plus_pro_opus, plus_pro_luna, plus_pro_deepseek
//
// No message limit on paid plans — only token limits.
//
// Enforcement: chat.check_token_limits (pre-flight) +
//              chat.increment_token_usage (post-LLM call).

export interface TokenLimitConfig {
  daily: number;
  monthly: number;
}

export interface TokenCheckResult {
  allowed: boolean;
  dailyUsed: number;
  dailyRemaining: number;
  monthlyUsed: number;
  monthlyRemaining: number;
  dailyResetAt: string | null;
  monthlyResetAt: string | null;
}

// ── Go Plus token limits (single model) ──
export const goPlusTokenLimits: TokenLimitConfig = {
  daily: 317000,
  monthly: 9523810,
};

// ── Pro plan per-LLM token limits (NI tier) ──
// Monthly = daily × 30.
export const proTokenLimits: Record<string, TokenLimitConfig> = {
  "claude-opus-4.6":   { daily: 10000, monthly: 300000 },
  "claude-sonnet-4.6": { daily: 16000, monthly: 480000 },
  "deepseek-v4-pro":   { daily: 34000, monthly: 1020000 },
  "gpt-5":             { daily: 20000, monthly: 600000 },
  "gpt-5-mini":        { daily: 34000, monthly: 1020000 },
  "deepseek-v4-flash": { daily: 35000, monthly: 1050000 },
};

// ── Plus Pro per-model token limits ──
export const plusProTokenLimits: Record<string, TokenLimitConfig> = {
  plus_pro_opus:     { daily: 27778,  monthly: 833333 },
  plus_pro_luna:     { daily: 47619,  monthly: 1428571 },
  plus_pro_deepseek: { daily: 204342, monthly: 6130268 },
};

/**
 * Pre-flight check: can the user spend tokens on this model?
 * Does NOT increment — call incrementTokenUsage after the LLM call.
 * Works for ALL paid plans.
 *
 * @param supabase   Chat-schema client (createChatServerClient)
 * @param userId     User UUID
 * @param modelKey   go_plus, claude-opus-4.6, plus_pro_opus, etc.
 * @param limits     { daily, monthly } token limits
 */
export async function checkTokenLimits(
  supabase: any,
  userId: string,
  modelKey: string,
  limits: TokenLimitConfig
): Promise<TokenCheckResult> {
  // ── PRIMARY: Atomic RPC ──
  const { data: rpcData, error: rpcError } = await supabase.rpc("check_token_limits", {
    p_user_id: userId,
    p_model_key: modelKey,
    p_daily_limit: limits.daily,
    p_monthly_limit: limits.monthly,
  });

  if (!rpcError && rpcData) {
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    return {
      allowed: row.allowed,
      dailyUsed: row.daily_used,
      dailyRemaining: row.daily_remaining,
      monthlyUsed: row.monthly_used,
      monthlyRemaining: row.monthly_remaining,
      dailyResetAt: row.daily_reset_at,
      monthlyResetAt: row.monthly_reset_at,
    };
  }

  // ── FALLBACK: direct read ──
  if (rpcError) {
    console.warn(`⚠️ check_token_limits: RPC not available, using fallback. Error: ${rpcError.message}`);
  }
  return await fallbackCheckTokenLimits(supabase, userId, modelKey, limits);
}

/**
 * Increment token usage after a successful LLM call.
 * Handles daily/monthly auto-reset inline (via RPC).
 * Works for ALL paid plans.
 *
 * @param supabase    Chat-schema client
 * @param userId      User UUID
 * @param modelKey    go_plus, claude-opus-4.6, plus_pro_opus, etc.
 * @param tokensUsed  Actual tokens consumed by the LLM call
 * @param limits      { daily, monthly } token limits
 */
export async function incrementTokenUsage(
  supabase: any,
  userId: string,
  modelKey: string,
  tokensUsed: number,
  limits: TokenLimitConfig
): Promise<void> {
  // ── PRIMARY: Atomic RPC ──
  const { error: rpcError } = await supabase.rpc("increment_token_usage", {
    p_user_id: userId,
    p_model_key: modelKey,
    p_tokens_used: tokensUsed,
    p_daily_limit: limits.daily,
    p_monthly_limit: limits.monthly,
  });

  if (!rpcError) return;

  // ── FALLBACK: direct read-then-write ──
  console.warn(`⚠️ increment_token_usage: RPC not available, using fallback. Error: ${rpcError.message}`);
  await fallbackIncrementTokenUsage(supabase, userId, modelKey, tokensUsed, limits);
}

// ── Fallback implementations ──

async function fallbackCheckTokenLimits(
  supabase: any,
  userId: string,
  modelKey: string,
  limits: TokenLimitConfig
): Promise<TokenCheckResult> {
  const now = new Date();

  const { data: usage, error: readError } = await supabase
    .from("token_usage")
    .select("tokens_used_today, tokens_used_month, daily_reset_at, monthly_reset_at")
    .eq("user_id", userId)
    .eq("model_key", modelKey)
    .maybeSingle();

  if (readError) {
    console.error(`❌ fallbackCheckTokenLimits: read error for ${modelKey}:`, readError);
    // FAIL CLOSED: deny on error so limits are enforced even if DB is unreachable.
    return {
      allowed: false,
      dailyUsed: 0,
      dailyRemaining: 0,
      monthlyUsed: 0,
      monthlyRemaining: 0,
      dailyResetAt: new Date(now.getTime() + 86400000).toISOString(),
      monthlyResetAt: new Date(now.getTime() + 30 * 86400000).toISOString(),
    };
  }

  if (!usage) {
    return {
      allowed: true,
      dailyUsed: 0,
      dailyRemaining: limits.daily,
      monthlyUsed: 0,
      monthlyRemaining: limits.monthly,
      dailyResetAt: new Date(now.getTime() + 86400000).toISOString(),
      monthlyResetAt: new Date(now.getTime() + 30 * 86400000).toISOString(),
    };
  }

  const dailyReset = new Date(usage.daily_reset_at);
  const monthlyReset = new Date(usage.monthly_reset_at);
  let dailyUsed = usage.tokens_used_today || 0;
  let monthlyUsed = usage.tokens_used_month || 0;

  if (now >= dailyReset) dailyUsed = 0;
  if (now >= monthlyReset) monthlyUsed = 0;

  const allowed = dailyUsed < limits.daily && monthlyUsed < limits.monthly;

  return {
    allowed,
    dailyUsed,
    dailyRemaining: Math.max(0, limits.daily - dailyUsed),
    monthlyUsed,
    monthlyRemaining: Math.max(0, limits.monthly - monthlyUsed),
    dailyResetAt: usage.daily_reset_at,
    monthlyResetAt: usage.monthly_reset_at,
  };
}

async function fallbackIncrementTokenUsage(
  supabase: any,
  userId: string,
  modelKey: string,
  tokensUsed: number,
  limits: TokenLimitConfig
): Promise<void> {
  const now = new Date();

  const { data: usage } = await supabase
    .from("token_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("model_key", modelKey)
    .maybeSingle();

  if (!usage) {
    await supabase.from("token_usage").insert({
      user_id: userId,
      model_key: modelKey,
      tokens_used_today: tokensUsed,
      tokens_used_month: tokensUsed,
      daily_reset_at: new Date(now.getTime() + 86400000).toISOString(),
      monthly_reset_at: new Date(now.getTime() + 30 * 86400000).toISOString(),
    });
    return;
  }

  const dailyReset = new Date(usage.daily_reset_at);
  const monthlyReset = new Date(usage.monthly_reset_at);
  let dailyUsed = usage.tokens_used_today || 0;
  let monthlyUsed = usage.tokens_used_month || 0;
  let dailyResetAt = usage.daily_reset_at;
  let monthlyResetAt = usage.monthly_reset_at;

  if (now >= dailyReset) {
    dailyUsed = 0;
    dailyResetAt = new Date(now.getTime() + 86400000).toISOString();
  }
  if (now >= monthlyReset) {
    monthlyUsed = 0;
    monthlyResetAt = new Date(now.getTime() + 30 * 86400000).toISOString();
  }

  await supabase
    .from("token_usage")
    .update({
      tokens_used_today: dailyUsed + tokensUsed,
      tokens_used_month: monthlyUsed + tokensUsed,
      daily_reset_at: dailyResetAt,
      monthly_reset_at: monthlyResetAt,
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId)
    .eq("model_key", modelKey);
}
