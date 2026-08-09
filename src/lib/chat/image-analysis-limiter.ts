// src/lib/chat/image-analysis-limiter.ts
//
// Image analysis limit enforcement — plan-aware daily + monthly limits.
//
//   Free:     4/day,  no monthly
//   Go Plus:  15/day, 300/month
//   Pro:      30/day, 600/month
//   Plus Pro: 30/day, 600/month
//
// Daily reset: 24h. Monthly reset: 30 days.
//
// Enforcement: chat.check_image_analysis_limit (pre-flight) +
//              chat.increment_image_analysis_usage (post-success).

export interface ImageAnalysisLimitResult {
  allowed: boolean;
  dailyUsed: number;
  dailyLimit: number;
  dailyRemaining: number;
  monthlyUsed: number;
  monthlyLimit: number;
  monthlyRemaining: number;
  reason?: string;
}

/**
 * Check if a user can perform image analysis (WITHOUT incrementing).
 * Call incrementImageAnalysisUsage after the analysis succeeds.
 *
 * @param supabase           Chat-schema client (createChatServerClient)
 * @param userId             User UUID
 * @param dailyLimit         Max images per 24h
 * @param monthlyLimit       Max images per 30 days (0 = no monthly limit)
 */
export async function checkImageAnalysisLimit(
  supabase: any,
  userId: string,
  dailyLimit: number,
  monthlyLimit: number
): Promise<ImageAnalysisLimitResult> {
  // ── PRIMARY: Atomic RPC ──
  const { data: rpcData, error: rpcError } = await supabase.rpc("check_image_analysis_limit", {
    p_user_id: userId,
    p_daily_limit: dailyLimit,
    p_monthly_limit: monthlyLimit,
  });

  if (!rpcError && rpcData) {
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const allowed = row.allowed;
    const result: ImageAnalysisLimitResult = {
      allowed,
      dailyUsed: row.daily_used,
      dailyLimit,
      dailyRemaining: row.daily_remaining,
      monthlyUsed: row.monthly_used,
      monthlyLimit,
      monthlyRemaining: row.monthly_remaining,
    };
    if (!allowed) {
      result.reason = row.daily_remaining <= 0
        ? `Daily image limit reached (${row.daily_used}/${dailyLimit}). Try again tomorrow.`
        : `Monthly image analysis limit reached (${row.monthly_used}/${monthlyLimit}). Resets next month.`;
    }
    return result;
  }

  // ── FALLBACK: direct read ──
  if (rpcError) {
    console.warn(`⚠️ check_image_analysis_limit: RPC not available, using fallback. Error: ${rpcError.message}`);
  }
  return await fallbackCheckImageAnalysisLimit(supabase, userId, dailyLimit, monthlyLimit);
}

/**
 * Increment image analysis usage after a successful analysis.
 *
 * @param supabase       Chat-schema client
 * @param userId         User UUID
 * @param dailyLimit     Max images per 24h
 * @param monthlyLimit   Max images per 30 days (0 = no monthly limit)
 */
export async function incrementImageAnalysisUsage(
  supabase: any,
  userId: string,
  dailyLimit: number,
  monthlyLimit: number
): Promise<void> {
  // ── PRIMARY: Atomic RPC ──
  const { error: rpcError } = await supabase.rpc("increment_image_analysis_usage", {
    p_user_id: userId,
    p_daily_limit: dailyLimit,
    p_monthly_limit: monthlyLimit,
  });

  if (!rpcError) return;

  // ── FALLBACK: direct read-then-write ──
  console.warn(`⚠️ increment_image_analysis_usage: RPC not available, using fallback. Error: ${rpcError.message}`);
  await fallbackIncrementImageAnalysisUsage(supabase, userId, dailyLimit, monthlyLimit);
}

// ── Fallback implementations ──

async function fallbackCheckImageAnalysisLimit(
  supabase: any,
  userId: string,
  dailyLimit: number,
  monthlyLimit: number
): Promise<ImageAnalysisLimitResult> {
  const now = new Date();

  const { data: usage } = await supabase
    .from("image_analysis_usage")
    .select("daily_count, monthly_count, last_daily_reset, last_monthly_reset")
    .eq("user_id", userId)
    .maybeSingle();

  if (!usage) {
    return {
      allowed: true,
      dailyUsed: 0,
      dailyLimit,
      dailyRemaining: dailyLimit,
      monthlyUsed: 0,
      monthlyLimit,
      monthlyRemaining: Math.max(monthlyLimit, 0),
    };
  }

  const dailyReset = new Date(usage.last_daily_reset);
  const monthlyReset = new Date(usage.last_monthly_reset);
  let dailyUsed = usage.daily_count || 0;
  let monthlyUsed = usage.monthly_count || 0;

  if (now >= dailyReset) dailyUsed = 0;
  if (monthlyLimit > 0 && now >= new Date(monthlyReset.getTime() + 30 * 86400000)) monthlyUsed = 0;

  if (dailyUsed >= dailyLimit) {
    return {
      allowed: false,
      dailyUsed,
      dailyLimit,
      dailyRemaining: 0,
      monthlyUsed,
      monthlyLimit,
      monthlyRemaining: Math.max(monthlyLimit - monthlyUsed, 0),
      reason: `Daily image limit reached (${dailyUsed}/${dailyLimit}). Try again tomorrow.`,
    };
  }

  if (monthlyLimit > 0 && monthlyUsed >= monthlyLimit) {
    return {
      allowed: false,
      dailyUsed,
      dailyLimit,
      dailyRemaining: dailyLimit - dailyUsed,
      monthlyUsed,
      monthlyLimit,
      monthlyRemaining: 0,
      reason: `Monthly image analysis limit reached (${monthlyUsed}/${monthlyLimit}). Resets next month.`,
    };
  }

  return {
    allowed: true,
    dailyUsed,
    dailyLimit,
    dailyRemaining: dailyLimit - dailyUsed,
    monthlyUsed,
    monthlyLimit,
    monthlyRemaining: Math.max(monthlyLimit - monthlyUsed, 0),
  };
}

async function fallbackIncrementImageAnalysisUsage(
  supabase: any,
  userId: string,
  dailyLimit: number,
  monthlyLimit: number
): Promise<void> {
  const now = new Date();

  const { data: usage } = await supabase
    .from("image_analysis_usage")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!usage) {
    await supabase.from("image_analysis_usage").insert({
      user_id: userId,
      daily_count: 1,
      monthly_count: 1,
      daily_limit: dailyLimit,
      monthly_limit: monthlyLimit,
      last_daily_reset: now.toISOString(),
      last_monthly_reset: now.toISOString(),
    });
    return;
  }

  const dailyReset = new Date(usage.last_daily_reset);
  const monthlyReset = new Date(usage.last_monthly_reset);
  let dailyCount = usage.daily_count || 0;
  let monthlyCount = usage.monthly_count || 0;
  let lastDailyReset = usage.last_daily_reset;
  let lastMonthlyReset = usage.last_monthly_reset;

  if (now >= dailyReset) {
    dailyCount = 0;
    lastDailyReset = now.toISOString();
  }
  if (monthlyLimit > 0 && now >= new Date(monthlyReset.getTime() + 30 * 86400000)) {
    monthlyCount = 0;
    lastMonthlyReset = now.toISOString();
  }

  await supabase
    .from("image_analysis_usage")
    .update({
      daily_count: dailyCount + 1,
      monthly_count: monthlyCount + 1,
      daily_limit: dailyLimit,
      monthly_limit: monthlyLimit,
      last_daily_reset: lastDailyReset,
      last_monthly_reset: lastMonthlyReset,
      updated_at: now.toISOString(),
    })
    .eq("user_id", userId);
}
