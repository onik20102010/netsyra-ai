// src/lib/chat-usage.ts
// Shared per-user per-tier message usage counter.
// NOTE: This still has a read-update race. For production scale, use a Postgres
// function or RPC call that increments atomically.

export const MODEL_LIMITS: Record<string, number> = {
  fast: 15,
  plus: 10,
  pro: 5,
  code: 5,
  live: 5,
  aai: 5,
  group: 10,
  web_search: 10,
};

export async function checkAndUpdateUsage(
  supabase: any,
  userId: string,
  modelTier: string
): Promise<{ allowed: boolean; remaining: number; resetAt: string }> {
  const now = new Date();
  const limit = MODEL_LIMITS[modelTier] || 10;

  console.log(`🔍 Usage check: userId=${userId}, tier=${modelTier}, limit=${limit}`);

  // Validate inputs
  if (!userId || !modelTier) {
    throw new Error("userId and modelTier are required");
  }

  if (!MODEL_LIMITS[modelTier]) {
    console.warn(`Unknown model tier: ${modelTier}, using default limit of 10`);
  }

  // Get current usage with retry logic for race conditions
  let usage;
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      const { data: usageData, error } = await supabase
        .from("chat_usage")
        .select("messages_used, reset_at")
        .eq("user_id", userId)
        .eq("model_tier", modelTier)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      usage = usageData;
      console.log(`📊 Current usage:`, usage);
      break;
    } catch (error) {
      retries++;
      if (retries >= maxRetries) {
        console.error("Failed to fetch usage after retries:", error);
        throw error;
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, retries)));
    }
  }

  // Check if reset is needed (no record or expired)
  const needsReset = !usage || new Date(usage.reset_at) < now;

  if (needsReset) {
    const resetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    console.log(`🔄 Reset needed. New reset time: ${resetAt}`);
    
    // Use atomic upsert with conflict resolution
    const { error: upsertError } = await supabase
      .from("chat_usage")
      .upsert(
        { 
          user_id: userId, 
          model_tier: modelTier, 
          messages_used: 1, 
          reset_at: resetAt 
        },
        { 
          onConflict: "user_id,model_tier",
          ignoreDuplicates: false
        }
      );

    if (upsertError) {
      console.error("Failed to upsert usage record:", upsertError);
      throw new Error("Failed to initialize usage tracking");
    }

    console.log(`✅ Usage reset successful. Remaining: ${limit - 1}`);
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  // Check if limit is reached
  if (usage.messages_used >= limit) {
    const resetTime = new Date(usage.reset_at);
    const timeUntilReset = resetTime.getTime() - now.getTime();
    const hoursUntilReset = Math.floor(timeUntilReset / (1000 * 60 * 60));
    const minutesUntilReset = Math.floor((timeUntilReset % (1000 * 60 * 60)) / (1000 * 60));

    console.log(`🚫 LIMIT REACHED for ${modelTier}. Used: ${usage.messages_used}/${limit}. Resets in ${hoursUntilReset}h ${minutesUntilReset}m`);
    return { allowed: false, remaining: 0, resetAt: usage.reset_at };
  }

  console.log(`✅ Limit not reached. Used: ${usage.messages_used}/${limit}. Incrementing...`);

  // Atomic increment using PostgreSQL function
  const { data: incrementData, error: incrementError } = await supabase.rpc(
    'increment_chat_usage',
    {
      p_user_id: userId,
      p_model_tier: modelTier
    }
  );

  // Fallback to direct update if RPC doesn't exist
  if (incrementError) {
    console.warn("RPC increment_chat_usage not available, using direct update");
    const { error: updateError } = await supabase
      .from("chat_usage")
      .update({ messages_used: usage.messages_used + 1 })
      .eq("user_id", userId)
      .eq("model_tier", modelTier)
      .lt('messages_used', limit); // Ensure we don't exceed limit

    if (updateError) {
      console.error("Failed to increment usage:", updateError);
      throw new Error("Failed to update usage tracking");
    }

    console.log(`✅ Usage incremented via direct update. Remaining: ${limit - (usage.messages_used + 1)}`);
    return { allowed: true, remaining: limit - (usage.messages_used + 1), resetAt: usage.reset_at };
  }

  const newCount = incrementData || usage.messages_used + 1;
  console.log(`✅ Usage incremented via RPC. New count: ${newCount}. Remaining: ${Math.max(0, limit - newCount)}`);
  return { allowed: true, remaining: Math.max(0, limit - newCount), resetAt: usage.reset_at };
}
