import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface WebSearchLimitResult {
  allowed: boolean;
  remaining: number;
  used: number;
  limit: number;
  windowHours: number;
}

export async function checkWebSearchLimit(
  userId: string,
  limit: number,
  windowHours: number
): Promise<WebSearchLimitResult> {
  const supabase = await createServerSupabaseClient();

  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("web_search_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart);

  if (error) {
    console.error("Web search limit check error:", error);
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

export async function incrementWebSearchUsage(userId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();

  const { error } = await supabase
    .from("web_search_usage")
    .insert({ user_id: userId });

  if (error) {
    console.error("Web search usage increment error:", error);
  }
}
