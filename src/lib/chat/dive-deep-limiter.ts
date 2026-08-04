// Dive Deep (N Live) limiter — tracks usage in web_search_usage table
// (same table as web search, since dive deep IS a form of web search).
// We use a separate column `search_type` to distinguish dive deep from
// regular web search so the limits are tracked independently.

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface DiveDeepLimitResult {
  allowed: boolean;
  remaining: number;
  used: number;
  limit: number;
  windowHours: number;
}

export async function checkDiveDeepLimit(
  userId: string,
  limit: number,
  windowHours: number
): Promise<DiveDeepLimitResult> {
  const supabase = await createServerSupabaseClient();

  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("web_search_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("search_type", "dive_deep")
    .gte("created_at", windowStart);

  if (error) {
    console.error("Dive deep limit check error:", error);
    return { allowed: true, remaining: limit, used: 0, limit, windowHours };
  }

  const used = count || 0;
  const remaining = Math.max(0, limit - used);
  return {
    allowed: remaining > 0,
    remaining,
    used,
    limit,
    windowHours,
  };
}

export async function incrementDiveDeepUsage(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("web_search_usage")
    .insert({ user_id: userId, search_type: "dive_deep" });

  if (error) {
    console.error("Dive deep usage increment error:", error);
  }
}
