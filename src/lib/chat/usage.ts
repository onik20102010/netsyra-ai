// src/lib/chat-usage.ts
// Shared per-user per-tier message usage counter.
// NOTE: This still has a read-update race. For production scale, use a Postgres
// function or RPC call that increments atomically.

export const MODEL_LIMITS: Record<string, number> = {
  fast: 10,
  plus: 10,
  pro: 10,
  code: 10,
  live: 10,
  aai: 10,
  group: 10,
  web_search: 10,
};

export async function checkAndUpdateUsage(
  supabase: any,
  userId: string,
  modelTier: string
): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  const { data: usage } = await supabase
    .from("chat_usage")
    .select("messages_used, reset_at")
    .eq("user_id", userId)
    .eq("model_tier", modelTier)
    .single();

  const now = new Date();
  const limit = MODEL_LIMITS[modelTier] || 10;

  if (!usage || new Date(usage.reset_at) < now) {
    const resetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("chat_usage")
      .upsert(
        { user_id: userId, model_tier: modelTier, messages_used: 1, reset_at: resetAt },
        { onConflict: "user_id, model_tier" }
      );
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (usage.messages_used >= limit) {
    return { allowed: false, remaining: 0, resetAt: usage.reset_at };
  }

  await supabase
    .from("chat_usage")
    .update({ messages_used: usage.messages_used + 1 })
    .eq("user_id", userId)
    .eq("model_tier", modelTier);

  return { allowed: true, remaining: limit - (usage.messages_used + 1), resetAt: usage.reset_at };
}
