// src/lib/model-limits.ts

export interface ModelLimit {
  modelId: string;
  label: string;
  tokensPerDay: number;
  messagesPerDay: number;
}

export interface AtomicCheckResult {
  allowed: boolean;
  messagesSent: number;
  messagesRemaining: number;
  resetsAt: string;
}

/**
 * Check remaining messages for a Free plan tier AND increment immediately.
 *
 * TWO MODES:
 * 1. PRIMARY (scalable): Calls SQL RPC `chat.check_and_increment_model_usage`
 *    which uses FOR UPDATE row locking — truly atomic, safe under concurrent
 *    requests. Works at any scale (millions of users).
 * 2. FALLBACK (works without migration): Direct read-then-write on
 *    chat.user_model_usage. Has a small race condition under high concurrency
 *    but works correctly for normal usage. Used only if the RPC doesn't exist.
 *
 * The increment is FULLY AWAITED before returning, so the next message
 * will see the updated count. This is called BEFORE the LLM API call.
 *
 * @param supabase MUST be a chat-schema client (createChatServerClient)
 */
export async function atomicCheckAndIncrement(
  supabase: any,
  userId: string,
  modelKey: string
): Promise<AtomicCheckResult> {
  const limit = modelLimits[modelKey];
  if (!limit) {
    return { allowed: true, messagesSent: 0, messagesRemaining: 9999, resetsAt: new Date(Date.now() + 86400000).toISOString() };
  }

  const estimatedTokens = 500;

  // ── PRIMARY: Try the atomic RPC first (scalable, race-condition-free) ──
  const { data: rpcData, error: rpcError } = await supabase.rpc('check_and_increment_model_usage', {
    p_user_id: userId,
    p_model_id: modelKey,
    p_message_limit: limit.messagesPerDay,
    p_token_limit: limit.tokensPerDay,
    p_estimated_tokens: estimatedTokens,
  });

  if (!rpcError && rpcData) {
    // RPC succeeded — use the atomic result
    const result: AtomicCheckResult = {
      allowed: rpcData.allowed,
      messagesSent: rpcData.messages_sent,
      messagesRemaining: rpcData.messages_remaining,
      resetsAt: rpcData.resets_at,
    };
    if (result.allowed) {
      console.log(`✅ atomicCheckAndIncrement [RPC]: ${modelKey} — sent ${result.messagesSent}/${limit.messagesPerDay}, remaining ${result.messagesRemaining}`);
    } else {
      console.log(`🚫 atomicCheckAndIncrement [RPC]: BLOCKED for ${modelKey}. Sent: ${result.messagesSent}/${limit.messagesPerDay}`);
    }
    return result;
  }

  // ── FALLBACK: RPC doesn't exist or failed — use direct queries ──
  if (rpcError) {
    console.warn(`⚠️ atomicCheckAndIncrement: RPC not available for ${modelKey}, using fallback. Error: ${rpcError.message}`);
  }

  return await fallbackCheckAndIncrement(supabase, userId, modelKey, limit.messagesPerDay, limit.tokensPerDay, estimatedTokens);
}

/**
 * Fallback: direct read-then-write on user_model_usage.
 * Works without the SQL migration but has a small race condition
 * under high concurrency. Acceptable for low-traffic scenarios.
 */
async function fallbackCheckAndIncrement(
  supabase: any,
  userId: string,
  modelKey: string,
  messageLimit: number,
  tokenLimit: number,
  estimatedTokens: number
): Promise<AtomicCheckResult> {
  const now = new Date();

  // Step 1: Read current usage (awaited)
  const { data: usage, error: readError } = await supabase
    .from("user_model_usage")
    .select("messages_sent, tokens_used, reset_at")
    .eq("user_id", userId)
    .eq("model_id", modelKey)
    .maybeSingle();

  if (readError) {
    console.error(`❌ fallbackCheckAndIncrement: read error for ${modelKey}:`, readError);
    return { allowed: true, messagesSent: 0, messagesRemaining: messageLimit, resetsAt: new Date(now.getTime() + 86400000).toISOString() };
  }

  // No record exists — first message on this model
  if (!usage) {
    const resetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const { error: insertError } = await supabase
      .from("user_model_usage")
      .insert({
        user_id: userId,
        model_id: modelKey,
        tokens_used: estimatedTokens,
        messages_sent: 1,
        reset_at: resetAt,
      });

    if (insertError) {
      console.error(`❌ fallbackCheckAndIncrement: insert error for ${modelKey}:`, insertError);
    }

    console.log(`✅ fallbackCheckAndIncrement: First message on ${modelKey}. Remaining: ${messageLimit - 1}/${messageLimit}`);
    return { allowed: true, messagesSent: 1, messagesRemaining: messageLimit - 1, resetsAt: resetAt };
  }

  // Step 2: Check if 24h reset is needed
  const resetAt = usage.reset_at ? new Date(usage.reset_at) : now;
  const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60);

  if (hoursSinceReset >= 24) {
    const newResetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const { error: updateError } = await supabase
      .from("user_model_usage")
      .update({
        messages_sent: 1,
        tokens_used: estimatedTokens,
        reset_at: newResetAt,
      })
      .eq("user_id", userId)
      .eq("model_id", modelKey);

    if (updateError) {
      console.error(`❌ fallbackCheckAndIncrement: reset error for ${modelKey}:`, updateError);
    }

    console.log(`✅ fallbackCheckAndIncrement: Window reset for ${modelKey}. Remaining: ${messageLimit - 1}/${messageLimit}`);
    return { allowed: true, messagesSent: 1, messagesRemaining: messageLimit - 1, resetsAt: newResetAt };
  }

  // Step 3: Check if limit is reached
  const messagesSent = usage.messages_sent || 0;
  const tokensUsed = usage.tokens_used || 0;

  if (messagesSent >= messageLimit || tokensUsed >= tokenLimit) {
    const nextReset = new Date(resetAt.getTime() + 24 * 60 * 60 * 1000).toISOString();
    console.log(`🚫 fallbackCheckAndIncrement: BLOCKED for ${modelKey}. Sent: ${messagesSent}/${messageLimit}`);
    return { allowed: false, messagesSent, messagesRemaining: 0, resetsAt: nextReset };
  }

  // Step 4: Limit not reached — increment NOW (awaited)
  const newMessagesSent = messagesSent + 1;
  const newResetAt = resetAt.toISOString();

  const { error: incrementError } = await supabase
    .from("user_model_usage")
    .update({
      messages_sent: newMessagesSent,
      tokens_used: tokensUsed + estimatedTokens,
    })
    .eq("user_id", userId)
    .eq("model_id", modelKey);

  if (incrementError) {
    console.error(`❌ fallbackCheckAndIncrement: increment error for ${modelKey}:`, incrementError);
  }

  const remaining = messageLimit - newMessagesSent;
  console.log(`✅ fallbackCheckAndIncrement: ${modelKey} — sent ${newMessagesSent}/${messageLimit}, remaining ${remaining}`);
  return { allowed: true, messagesSent: newMessagesSent, messagesRemaining: remaining, resetsAt: newResetAt };
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