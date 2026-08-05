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
    tokensPerDay: 6800,
    messagesPerDay: 15,
  },
  plus: {
    modelId: "plus",
    label: "N Plus",
    tokensPerDay: 6800,
    messagesPerDay: 10,
  },
  plus_fallback: {
    modelId: "plus",
    label: "N Plus (fallback)",
    tokensPerDay: 6800,
    messagesPerDay: 10,
  },
  pro: {
    modelId: "pro",
    label: "N Pro",
    tokensPerDay: 6800,
    messagesPerDay: 5,
  },
  pro_fallback: {
    modelId: "pro",
    label: "N Pro (fallback)",
    tokensPerDay: 6800,
    messagesPerDay: 5,
  },
  live: {
    modelId: "live",
    label: "N Live",
    tokensPerDay: 6800,
    messagesPerDay: 5,
  },
  live_fallback: {
    modelId: "live",
    label: "N Live (fallback)",
    tokensPerDay: 6800,
    messagesPerDay: 5,
  },
  code: {
    modelId: "code",
    label: "N Code",
    tokensPerDay: 6800,
    messagesPerDay: 5,
  },
  aai: {
    modelId: "aai",
    label: "N AAI",
    tokensPerDay: 6800,
    messagesPerDay: 5,
  },
  aai_fallback: {
    modelId: "aai",
    label: "N AAI (fallback)",
    tokensPerDay: 6800,
    messagesPerDay: 5,
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
    .maybeSingle();

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
 * Check all model limits in a single DB query (batched).
 */
export async function checkAllModelLimits(
  supabase: any,
  userId: string
): Promise<Record<string, { allowed: boolean; remaining: number; resetsAt: string; label: string }>> {
  const now = new Date();

  // Single query: fetch all usage rows for this user
  const { data: usageRows } = await supabase
    .from("user_model_usage")
    .select("*")
    .eq("user_id", userId);

  const usageMap = new Map<string, any>();
  if (usageRows) {
    for (const row of usageRows) {
      usageMap.set(row.model_id, row);
    }
  }

  const statuses: Record<string, { allowed: boolean; remaining: number; resetsAt: string; label: string }> = {};
  const resetsToUpsert: Array<{ user_id: string; model_id: string; tokens_used: number; messages_sent: number; reset_at: string }> = [];

  for (const [key, limit] of Object.entries(modelLimits)) {
    const usage = usageMap.get(key);
    const resetAt = usage?.reset_at ? new Date(usage.reset_at) : now;
    const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset >= 24) {
      resetsToUpsert.push({
        user_id: userId,
        model_id: key,
        tokens_used: 0,
        messages_sent: 0,
        reset_at: now.toISOString(),
      });
      statuses[key] = {
        allowed: true,
        remaining: limit.tokensPerDay,
        resetsAt: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        label: limit.label,
      };
      continue;
    }

    const tokensUsed = usage?.tokens_used || 0;
    const messagesUsed = usage?.messages_sent || 0;

    if (tokensUsed >= limit.tokensPerDay || messagesUsed >= limit.messagesPerDay) {
      const nextReset = new Date(resetAt.getTime() + 24 * 60 * 60 * 1000);
      statuses[key] = { allowed: false, remaining: 0, resetsAt: nextReset.toISOString(), label: limit.label };
    } else {
      statuses[key] = {
        allowed: true,
        remaining: Math.min(limit.tokensPerDay - tokensUsed, limit.messagesPerDay - messagesUsed),
        resetsAt: new Date(resetAt.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        label: limit.label,
      };
    }
  }

  // Batch upsert any resets
  if (resetsToUpsert.length > 0) {
    await supabase
      .from("user_model_usage")
      .upsert(resetsToUpsert, { onConflict: "user_id,model_id" });
  }

  return statuses;
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
    .maybeSingle();

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