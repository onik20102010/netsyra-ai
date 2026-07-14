// src/lib/model-limits.ts

export interface ModelLimit {
  modelId: string;
  label: string;
  tokensPerDay: number;
  messagesPerDay: number;
}

export const modelLimits: Record<string, ModelLimit> = {
  fast: {
    modelId: "fast",
    label: "N Fast",
    tokensPerDay: 1500,
    messagesPerDay: 40,  // not message-limited
  },
  plus: {
    modelId: "plus",
    label: "N Plus",
    tokensPerDay: 1400,      // primary
    messagesPerDay: 35,
  },
  plus_fallback: {
    modelId: "plus",
    label: "N Plus (fallback)",
    tokensPerDay: 1600,
    messagesPerDay: 35,
  },
  pro: {
    modelId: "pro",
    label: "N Pro",
    tokensPerDay: 2000,      // primary
    messagesPerDay: 30,
  },
  pro_fallback: {
    modelId: "pro",
    label: "N Pro (fallback)",
    tokensPerDay: 18000,
    messagesPerDay: 30,
  },
  live: {
    modelId: "live",
    label: "N Live",
    tokensPerDay: 800,    // not token-limited
    messagesPerDay: 50,
  },
  live_fallback: {
    modelId: "live",
    label: "N Live (fallback)",
    tokensPerDay: 800,
    messagesPerDay: 50,
  },
  code: {
    modelId: "code",
    label: "N Code",
    tokensPerDay: 2500,    // not limited (adjust if needed)
    messagesPerDay: 30,
  },
  aai: {
    modelId: "aai",
    label: "N AAI",
    tokensPerDay: 5000,    // higher limit for AAI
    messagesPerDay: 25,   // fewer messages due to complexity
  },
  aai_fallback: {
    modelId: "aai",
    label: "N AAI (fallback)",
    tokensPerDay: 5000,
    messagesPerDay: 25,
  },
};

/**
 * Check if a user can use a specific model, and return remaining usage.
 */
export async function checkModelLimit(
  supabase: any,
  userId: string,
  modelKey: string
): Promise<{ allowed: boolean; remaining: number; resetsAt: string }> {
  const now = new Date();
  const limit = modelLimits[modelKey];
  if (!limit) return { allowed: true, remaining: 9999, resetsAt: now.toISOString() };

  const { data: usage } = await supabase
    .from("user_model_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("model_id", modelKey)
    .single();

  const resetAt = usage?.reset_at ? new Date(usage.reset_at) : now;
  const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceReset >= 24) {
    // Reset the window
    await supabase
      .from("user_model_usage")
      .upsert(
        { user_id: userId, model_id: modelKey, tokens_used: 0, messages_sent: 0, reset_at: now.toISOString() },
        { onConflict: "user_id,model_id" }
      );
    return { allowed: true, remaining: limit.tokensPerDay, resetsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString() };
  }

  const tokensUsed = usage?.tokens_used || 0;
  const messagesUsed = usage?.messages_sent || 0;

  if (tokensUsed >= limit.tokensPerDay || messagesUsed >= limit.messagesPerDay) {
    const nextReset = new Date(resetAt.getTime() + 24 * 60 * 60 * 1000);
    return { allowed: false, remaining: 0, resetsAt: nextReset.toISOString() };
  }

  return {
    allowed: true,
    remaining: Math.min(limit.tokensPerDay - tokensUsed, limit.messagesPerDay - messagesUsed),
    resetsAt: new Date(resetAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
  };
}

/**
 * Increment usage after a successful API response.
 */
export async function incrementModelUsage(
  supabase: any,
  userId: string,
  modelKey: string,
  tokensUsed: number
) {
  const now = new Date();
  const limit = modelLimits[modelKey];
  if (!limit) return;

  // Get current usage
  const { data: usage } = await supabase
    .from("user_model_usage")
    .select("*")
    .eq("user_id", userId)
    .eq("model_id", modelKey)
    .single();

  const currentTokens = usage?.tokens_used || 0;
  const currentMessages = usage?.messages_sent || 0;
  const resetAt = usage?.reset_at || now.toISOString();

  await supabase
    .from("user_model_usage")
    .upsert(
      {
        user_id: userId,
        model_id: modelKey,
        tokens_used: currentTokens + tokensUsed,
        messages_sent: currentMessages + 1,
        reset_at: resetAt,
      },
      { onConflict: "user_id,model_id" }
    );
}