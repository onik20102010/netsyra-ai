// Image Analysis Limiter — plan-aware daily image count + monthly token limits
//
// Daily limit:   Max images per day per user
// Monthly limit: Max tokens per month for image analysis (0 = no monthly token limit, just daily count)
//
// Uses existing Supabase RPC functions from migration 20250725_create_image_analysis_limits.sql

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface ImageAnalysisLimitResult {
  allowed: boolean;
  dailyUsed: number;
  dailyLimit: number;
  dailyRemaining: number;
  monthlyTokensUsed: number;
  monthlyTokenLimit: number;
  monthlyTokensRemaining: number;
  reason?: string;
}

export async function checkImageAnalysisLimit(
  userId: string,
  dailyLimit: number,
  monthlyTokenLimit: number
): Promise<ImageAnalysisLimitResult> {
  const supabase = await createServerSupabaseClient();

  // ── Check daily image count by querying table directly ──
  const { data: usageData, error: usageError } = await supabase
    .from("image_analysis_usage")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (usageError) {
    console.error("Image analysis limit check error:", usageError);
    // Allow on error to not block users
    return {
      allowed: true,
      dailyUsed: 0,
      dailyLimit,
      dailyRemaining: dailyLimit,
      monthlyTokensUsed: 0,
      monthlyTokenLimit,
      monthlyTokensRemaining: monthlyTokenLimit,
    };
  }

  if (!usageData) {
    // No usage record yet, allow
    return {
      allowed: true,
      dailyUsed: 0,
      dailyLimit,
      dailyRemaining: dailyLimit,
      monthlyTokensUsed: 0,
      monthlyTokenLimit,
      monthlyTokensRemaining: monthlyTokenLimit,
    };
  }

  // Check if daily reset is needed (24 hours)
  const hoursSinceDailyReset = (Date.now() - new Date(usageData.last_daily_reset).getTime()) / (1000 * 60 * 60);
  let dailyUsed = usageData.daily_count || 0;
  
  if (hoursSinceDailyReset >= 24) {
    dailyUsed = 0; // Reset happened
  }

  const dailyRemaining = Math.max(0, dailyLimit - dailyUsed);

  if (dailyRemaining <= 0) {
    return {
      allowed: false,
      dailyUsed,
      dailyLimit,
      dailyRemaining: 0,
      monthlyTokensUsed: 0,
      monthlyTokenLimit,
      monthlyTokensRemaining: monthlyTokenLimit,
      reason: `Daily image limit reached (${dailyUsed}/${dailyLimit}). Try again tomorrow.`,
    };
  }

  // ── Check monthly token limit (skip if 0 = no monthly token limit) ──
  if (monthlyTokenLimit > 0) {
    // The existing schema doesn't track tokens, only image counts
    // For now, we'll use the monthly_count as a proxy for token usage
    const daysSinceMonthlyReset = (Date.now() - new Date(usageData.last_monthly_reset).getTime()) / (1000 * 60 * 60 * 24);
    let monthlyUsed = usageData.monthly_count || 0;
    
    if (daysSinceMonthlyReset >= 30) {
      monthlyUsed = 0; // Reset happened
    }
    
    const monthlyRemaining = Math.max(0, monthlyTokenLimit - monthlyUsed);

    if (monthlyRemaining <= 0) {
      return {
        allowed: false,
        dailyUsed,
        dailyLimit,
        dailyRemaining,
        monthlyTokensUsed: monthlyUsed,
        monthlyTokenLimit,
        monthlyTokensRemaining: 0,
        reason: `Monthly image analysis limit reached (${monthlyUsed}/${monthlyTokenLimit}). Resets next month.`,
      };
    }

    return {
      allowed: true,
      dailyUsed,
      dailyLimit,
      dailyRemaining,
      monthlyTokensUsed: monthlyUsed,
      monthlyTokenLimit,
      monthlyTokensRemaining: monthlyRemaining,
    };
  }

  // No monthly token limit (free plan — just daily image count)
  return {
    allowed: true,
    dailyUsed,
    dailyLimit,
    dailyRemaining,
    monthlyTokensUsed: 0,
    monthlyTokenLimit,
    monthlyTokensRemaining: monthlyTokenLimit,
  };
}

export async function incrementImageAnalysisUsage(
  userId: string,
  tokensUsed: number
): Promise<void> {
  const supabase = await createServerSupabaseClient();

  // Get current usage record
  const { data: usageData } = await supabase
    .from("image_analysis_usage")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const now = new Date();
  let dailyCount = 1;
  let monthlyCount = 1;
  let lastDailyReset = now.toISOString();
  let lastMonthlyReset = now.toISOString();

  if (usageData) {
    // Check if daily reset is needed (24 hours)
    const hoursSinceDailyReset = (Date.now() - new Date(usageData.last_daily_reset).getTime()) / (1000 * 60 * 60);
    if (hoursSinceDailyReset < 24) {
      dailyCount = (usageData.daily_count || 0) + 1;
      lastDailyReset = usageData.last_daily_reset;
    }

    // Check if monthly reset is needed (30 days)
    const daysSinceMonthlyReset = (Date.now() - new Date(usageData.last_monthly_reset).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceMonthlyReset < 30) {
      monthlyCount = (usageData.monthly_count || 0) + 1;
      lastMonthlyReset = usageData.last_monthly_reset;
    }

    // Update existing record
    const { error } = await supabase
      .from("image_analysis_usage")
      .update({
        daily_count: dailyCount,
        monthly_count: monthlyCount,
        last_daily_reset: lastDailyReset,
        last_monthly_reset: lastMonthlyReset,
        updated_at: now.toISOString(),
      })
      .eq("user_id", userId);

    if (error) {
      console.error("Image analysis usage increment error:", error);
    }
  } else {
    // Insert new record
    const { error } = await supabase
      .from("image_analysis_usage")
      .insert({
        user_id: userId,
        daily_count: dailyCount,
        monthly_count: monthlyCount,
        daily_limit: 30,
        monthly_limit: 600,
        last_daily_reset: lastDailyReset,
        last_monthly_reset: lastMonthlyReset,
      });

    if (error) {
      console.error("Image analysis usage increment error:", error);
    }
  }
}
