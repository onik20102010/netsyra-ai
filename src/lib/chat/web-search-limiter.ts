// src/lib/chat/web-search-limiter.ts
//
// Web search + Dive deep limit enforcement.
// Uses a sliding time window (24h for all plans) and row-per-action tracking.
//
// Limits:
//   Free:     3 / 24h
//   Go Plus:  100 / 24h
//   Pro:      200 / 24h
//   Plus Pro: 250 / 24h
//
// Enforcement: chat.check_web_search_limit (pre-flight) +
//              chat.record_web_search (post-success).

export interface SearchLimitResult {
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
  windowHours: number;
}

/**
 * Check if a user can perform a web search or dive deep action.
 * Does NOT record the action — call recordWebSearch after success.
 *
 * @param supabase     Chat-schema client (createChatServerClient)
 * @param userId       User UUID
 * @param searchType   "web_search" or "dive_deep"
 * @param limit        Max actions in the window
 * @param windowHours  Sliding window length in hours (24 for all plans)
 */
export async function checkWebSearchLimit(
  supabase: any,
  userId: string,
  searchType: "web_search" | "dive_deep",
  limit: number,
  windowHours: number = 24
): Promise<SearchLimitResult> {
  // ── PRIMARY: Atomic RPC ──
  const { data: rpcData, error: rpcError } = await supabase.rpc("check_web_search_limit", {
    p_user_id: userId,
    p_search_type: searchType,
    p_limit: limit,
    p_window_hours: windowHours,
  });

  if (!rpcError && rpcData) {
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    return {
      allowed: row.allowed,
      used: row.used,
      remaining: row.remaining,
      limit: row.limit_val,
      windowHours: row.window_hours,
    };
  }

  // ── FALLBACK: direct row count ──
  if (rpcError) {
    console.warn(`⚠️ check_web_search_limit: RPC not available, using fallback. Error: ${rpcError.message}`);
  }
  return await fallbackCheckWebSearchLimit(supabase, userId, searchType, limit, windowHours);
}

/**
 * Record a successful web search or dive deep action.
 * Call this AFTER the search succeeds.
 *
 * @param supabase    Chat-schema client
 * @param userId      User UUID
 * @param searchType  "web_search" or "dive_deep"
 */
export async function recordWebSearch(
  supabase: any,
  userId: string,
  searchType: "web_search" | "dive_deep"
): Promise<void> {
  // ── PRIMARY: Atomic RPC ──
  const { error: rpcError } = await supabase.rpc("record_web_search", {
    p_user_id: userId,
    p_search_type: searchType,
  });

  if (!rpcError) return;

  // ── FALLBACK: direct insert ──
  console.warn(`⚠️ record_web_search: RPC not available, using fallback. Error: ${rpcError.message}`);
  await supabase.from("web_search_usage").insert({
    user_id: userId,
    search_type: searchType,
  });
}

// ── Convenience wrappers ──

export async function checkDiveDeepLimit(
  supabase: any,
  userId: string,
  limit: number,
  windowHours: number = 24
): Promise<SearchLimitResult> {
  return checkWebSearchLimit(supabase, userId, "dive_deep", limit, windowHours);
}

export async function recordDiveDeep(
  supabase: any,
  userId: string
): Promise<void> {
  return recordWebSearch(supabase, userId, "dive_deep");
}

// ── Fallback ──

async function fallbackCheckWebSearchLimit(
  supabase: any,
  userId: string,
  searchType: string,
  limit: number,
  windowHours: number
): Promise<SearchLimitResult> {
  const windowStart = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("web_search_usage")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("search_type", searchType)
    .gte("created_at", windowStart);

  if (error) {
    console.error("❌ fallbackCheckWebSearchLimit:", error);
    return { allowed: true, used: 0, remaining: limit, limit, windowHours };
  }

  const used = count || 0;
  return {
    allowed: used < limit,
    used,
    remaining: Math.max(0, limit - used),
    limit,
    windowHours,
  };
}
