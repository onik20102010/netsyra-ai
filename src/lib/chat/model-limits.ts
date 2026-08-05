// src/lib/chat/model-limits.ts
//
// Free plan per-tier message limits.
// NO token limit on Free — only message counts per 24h per user UUID.
//
// Enforcement: chat.check_and_increment_message_usage RPC (atomic, race-free).

export interface FreeTierLimit {
  modelTier: string;
  label: string;
  messagesPerDay: number;
}

export interface MessageCheckResult {
  allowed: boolean;
  messagesSent: number;
  messagesRemaining: number;
  resetsAt: string;
}

/**
 * Free plan per-tier message limits (per 24h, per user UUID).
 * NO token limit — only message counts.
 */
export const freeTierLimits: Record<string, FreeTierLimit> = {
  fast: { modelTier: "fast", label: "N Fast",  messagesPerDay: 15 },
  plus: { modelTier: "plus", label: "N Plus",  messagesPerDay: 10 },
  pro:  { modelTier: "pro",  label: "N Pro",   messagesPerDay: 5 },
  code: { modelTier: "code", label: "N Code",  messagesPerDay: 5 },
  aai:  { modelTier: "aai",  label: "N AAI",   messagesPerDay: 5 },
  live: { modelTier: "live", label: "N Live",  messagesPerDay: 3 },
};

/**
 * Atomically check + increment message usage for a Free plan tier.
 * Uses the chat.check_and_increment_message_usage RPC (FOR UPDATE locking).
 *
 * @param supabase MUST be a chat-schema client (createChatServerClient)
 * @param userId   User UUID
 * @param modelTier  One of: fast, plus, pro, code, aai, live
 */
export async function checkAndIncrementMessageUsage(
  supabase: any,
  userId: string,
  modelTier: string
): Promise<MessageCheckResult> {
  const limit = freeTierLimits[modelTier];
  if (!limit) {
    // Unknown tier — allow (shouldn't happen in practice)
    return {
      allowed: true,
      messagesSent: 0,
      messagesRemaining: 9999,
      resetsAt: new Date(Date.now() + 86400000).toISOString(),
    };
  }

  // ── PRIMARY: Atomic RPC ──
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    "check_and_increment_message_usage",
    {
      p_user_id: userId,
      p_model_tier: modelTier,
      p_message_limit: limit.messagesPerDay,
    }
  );

  if (!rpcError && rpcData) {
    const row = Array.isArray(rpcData) ? rpcData[0] : rpcData;
    const result: MessageCheckResult = {
      allowed: row.allowed,
      messagesSent: row.messages_sent,
      messagesRemaining: row.messages_remaining,
      resetsAt: row.resets_at,
    };
    if (result.allowed) {
      console.log(
        `✅ Free tier [RPC]: ${modelTier} — sent ${result.messagesSent}/${limit.messagesPerDay}, remaining ${result.messagesRemaining}`
      );
    } else {
      console.log(
        `🚫 Free tier [RPC]: BLOCKED for ${modelTier}. Sent: ${result.messagesSent}/${limit.messagesPerDay}`
      );
    }
    return result;
  }

  // ── FALLBACK: RPC not available — direct read-then-write ──
  if (rpcError) {
    console.warn(
      `⚠️ check_and_increment_message_usage: RPC not available for ${modelTier}, using fallback. Error: ${rpcError.message}`
    );
  }
  return await fallbackCheckAndIncrement(supabase, userId, modelTier, limit.messagesPerDay);
}

/**
 * Fallback: direct read-then-write on user_message_usage.
 * Small race condition under high concurrency — acceptable for low traffic.
 */
async function fallbackCheckAndIncrement(
  supabase: any,
  userId: string,
  modelTier: string,
  messageLimit: number
): Promise<MessageCheckResult> {
  const now = new Date();

  const { data: usage, error: readError } = await supabase
    .from("user_message_usage")
    .select("messages_used, reset_at")
    .eq("user_id", userId)
    .eq("model_tier", modelTier)
    .maybeSingle();

  if (readError) {
    console.error(`❌ fallback: read error for ${modelTier}:`, readError);
    return {
      allowed: true,
      messagesSent: 0,
      messagesRemaining: messageLimit,
      resetsAt: new Date(now.getTime() + 86400000).toISOString(),
    };
  }

  // No record — first message
  if (!usage) {
    const resetAt = new Date(now.getTime() + 86400000).toISOString();
    await supabase.from("user_message_usage").insert({
      user_id: userId,
      model_tier: modelTier,
      messages_used: 1,
      reset_at: resetAt,
    });
    return { allowed: true, messagesSent: 1, messagesRemaining: messageLimit - 1, resetsAt: resetAt };
  }

  const resetAt = usage.reset_at ? new Date(usage.reset_at) : now;
  const hoursSinceReset = (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60);

  // 24h reset
  if (hoursSinceReset >= 24) {
    const newResetAt = new Date(now.getTime() + 86400000).toISOString();
    await supabase
      .from("user_message_usage")
      .update({ messages_used: 1, reset_at: newResetAt })
      .eq("user_id", userId)
      .eq("model_tier", modelTier);
    return { allowed: true, messagesSent: 1, messagesRemaining: messageLimit - 1, resetsAt: newResetAt };
  }

  // Limit reached?
  const messagesSent = usage.messages_used || 0;
  if (messagesSent >= messageLimit) {
    const nextReset = new Date(resetAt.getTime() + 86400000).toISOString();
    return { allowed: false, messagesSent, messagesRemaining: 0, resetsAt: nextReset };
  }

  // Increment
  const newCount = messagesSent + 1;
  await supabase
    .from("user_message_usage")
    .update({ messages_used: newCount })
    .eq("user_id", userId)
    .eq("model_tier", modelTier);

  return {
    allowed: true,
    messagesSent: newCount,
    messagesRemaining: messageLimit - newCount,
    resetsAt: resetAt.toISOString(),
  };
}
