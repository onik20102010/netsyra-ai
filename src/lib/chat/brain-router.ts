// src/lib/chat/brain-router.ts
//
// ── THE BRAIN ROUTER ──────────────────────────────────────────────
// Single unified counter that connects to Supabase for every user
// and decides whether a message should be sent to the LLM.
//
// FLOW:
//   1. Detect plan (free, go_plus, pro, plus_pro)
//   2. Detect model tier (fast, plus, pro, ni, go_plus, plus_pro, etc.)
//   3. Detect LLM model (claude-opus-4.6, gpt-5, deepseek-v4-flash, etc.)
//   4. Look up current limit for that model + plan
//   5. Detect user UUID
//   6. Calculate how many messages/tokens the user has used
//   7. Decide:
//      - Free plan: block if message limit reached (atomic check+increment)
//      - Paid plans: check token limits; if current model is out of tokens,
//        automatically shift to the next available model (fallback)
//
// All other limit files are replaced by this single module.
// ══════════════════════════════════════════════════════════════════

import { checkAndIncrementMessageUsage, freeTierLimits, MessageCheckResult } from "./model-limits";
import { checkTokenLimits, goPlusTokenLimits, plusProTokenLimits, proTokenLimits, TokenLimitConfig, TokenCheckResult } from "./token-usage";

// ── Fallback chains ──────────────────────────────────────────────
// When a model is out of tokens, try the next one in this order.

const PRO_FALLBACK_CHAIN: string[] = [
  "claude-opus-4.6",
  "claude-sonnet-4.6",
  "deepseek-v4-pro",
  "gpt-5",
  "gpt-5-mini",
  "deepseek-v4-flash",
];

const PLUS_PRO_FALLBACK_CHAIN: string[] = [
  "plus_pro_opus",
  "plus_pro_luna",
  "plus_pro_deepseek",
];

// ── Result types ─────────────────────────────────────────────────

export interface BrainRouterResult {
  allowed: boolean;
  /** The model key to use for token tracking (may differ from requested if fallback happened). */
  modelKey: string | null;
  /** The actual LLM model name (for NI tier, used to look up the model config). */
  modelName: string | null;
  /** Human-readable reason for the decision. */
  reason: string;
  /** Whether a fallback to a different model was used. */
  fallbackUsed: boolean;
  /** The original model that was requested (if fallback happened). */
  fallbackFrom: string | null;
  /** Usage info for the response (token-based plans). */
  tokenInfo?: TokenCheckResult;
  /** Usage info for the response (message-based Free plan). */
  messageInfo?: MessageCheckResult;
  /** HTTP status code for blocked responses. */
  statusCode: number;
  /** Error message for the client (if blocked). */
  clientError?: string;
  /** Reset time info for the client. */
  resetsAt?: string;
  dailyResetAt?: string | null;
  monthlyResetAt?: string | null;
}

// ── Main entry point ─────────────────────────────────────────────

/**
 * The Brain Router — evaluates limits and decides whether to proceed.
 *
 * @param supabase       Chat-schema Supabase client
 * @param userId         User UUID
 * @param userEmail      User email (for logging)
 * @param userPlan       "free" | "go_plus" | "pro" | "plus_pro"
 * @param modelTier      The tier being used (fast, plus, pro, ni, go_plus, plus_pro, etc.)
 * @param requestedModelKey  For Plus Pro: the user-selected model key. For Go Plus: "go_plus".
 * @param niModelName    For Pro (NI): the NI router's chosen LLM model name.
 */
export async function evaluateLimits(
  supabase: any,
  userId: string,
  userEmail: string,
  userPlan: string,
  modelTier: string,
  requestedModelKey: string | null,
  niModelName: string | null
): Promise<BrainRouterResult> {
  console.log(`🧠 Brain Router: plan=${userPlan}, tier=${modelTier}, user=${userEmail?.slice(0, 20)}...`);

  // ═══════════════════════════════════════════════════════════════
  // FREE PLAN — per-tier message limits (atomic check + increment)
  // No token limit. No fallback. Block if daily message limit reached.
  // ═══════════════════════════════════════════════════════════════
  if (userPlan === "free") {
    const limit = freeTierLimits[modelTier];
    if (!limit) {
      // Unknown tier on free — allow (shouldn't happen)
      return {
        allowed: true,
        modelKey: null,
        modelName: null,
        reason: `Free plan, unknown tier "${modelTier}" — allowed (no limit defined)`,
        fallbackUsed: false,
        fallbackFrom: null,
        statusCode: 200,
      };
    }

    const msgCheck = await checkAndIncrementMessageUsage(supabase, userId, modelTier);

    if (!msgCheck.allowed) {
      const tierLabel = limit.label;
      return {
        allowed: false,
        modelKey: null,
        modelName: null,
        reason: `Free plan ${modelTier} limit reached (${msgCheck.messagesSent}/${limit.messagesPerDay})`,
        fallbackUsed: false,
        fallbackFrom: null,
        messageInfo: msgCheck,
        statusCode: 429,
        clientError: `You've reached the daily limit for ${tierLabel}. Try again tomorrow or upgrade for more access.`,
        resetsAt: msgCheck.resetsAt,
      };
    }

    console.log(`🧠 Brain Router: FREE ${modelTier} — ${msgCheck.messagesSent}/${limit.messagesPerDay} messages, ${msgCheck.messagesRemaining} remaining`);
    return {
      allowed: true,
      modelKey: null,
      modelName: null,
      reason: `Free plan ${modelTier} — ${msgCheck.messagesSent}/${limit.messagesPerDay} messages used`,
      fallbackUsed: false,
      fallbackFrom: null,
      messageInfo: msgCheck,
      statusCode: 200,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // GO PLUS PLAN — plan-level token limits (single model, no fallback)
  // If tokens exhausted, block.
  // ═══════════════════════════════════════════════════════════════
  if (userPlan === "go_plus" && modelTier === "go_plus") {
    const tokenCheck = await checkTokenLimits(supabase, userId, "go_plus", goPlusTokenLimits);

    if (!tokenCheck.allowed) {
      return {
        allowed: false,
        modelKey: "go_plus",
        modelName: null,
        reason: `Go Plus token limit reached: daily=${tokenCheck.dailyUsed}/${goPlusTokenLimits.daily}, monthly=${tokenCheck.monthlyUsed}/${goPlusTokenLimits.monthly}`,
        fallbackUsed: false,
        fallbackFrom: null,
        tokenInfo: tokenCheck,
        statusCode: 429,
        clientError: "You've reached your token limit for Go Plus. Your quota resets daily and monthly.",
        dailyResetAt: tokenCheck.dailyResetAt,
        monthlyResetAt: tokenCheck.monthlyResetAt,
      };
    }

    console.log(`🧠 Brain Router: GO PLUS — daily ${tokenCheck.dailyUsed}/${goPlusTokenLimits.daily} tokens, ${tokenCheck.dailyRemaining} remaining`);
    return {
      allowed: true,
      modelKey: "go_plus",
      modelName: null,
      reason: `Go Plus — ${tokenCheck.dailyUsed}/${goPlusTokenLimits.daily} daily tokens used`,
      fallbackUsed: false,
      fallbackFrom: null,
      tokenInfo: tokenCheck,
      statusCode: 200,
    };
  }

  // ═══════════════════════════════════════════════════════════════
  // PLUS PRO PLAN — per-model token limits with fallback
  // If the user-selected model is out of tokens, try the next plus_pro model.
  // ═══════════════════════════════════════════════════════════════
  if (userPlan === "plus_pro" && modelTier === "plus_pro") {
    const requestedKey = requestedModelKey || "plus_pro_opus";
    return await evaluateWithFallback(
      supabase, userId, "Plus Pro", requestedKey, PLUS_PRO_FALLBACK_CHAIN, plusProTokenLimits
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // PRO PLAN (NI tier) — per-LLM token limits with fallback
  // The NI router picks the best LLM for the task. If that LLM is out
  // of tokens, the brain router shifts to the next available LLM.
  // ═══════════════════════════════════════════════════════════════
  if (userPlan === "pro" && modelTier === "ni" && niModelName) {
    return await evaluateWithFallback(
      supabase, userId, "Pro (NI)", niModelName, PRO_FALLBACK_CHAIN, proTokenLimits
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // DEFAULT — no limit enforcement for this combination
  // (e.g. paid user using a free tier model, or unknown plan)
  // ═══════════════════════════════════════════════════════════════
  return {
    allowed: true,
    modelKey: requestedModelKey,
    modelName: niModelName,
    reason: `No limit enforcement for plan=${userPlan}, tier=${modelTier}`,
    fallbackUsed: false,
    fallbackFrom: null,
    statusCode: 200,
  };
}

// ── Fallback evaluator (shared by Pro and Plus Pro) ──────────────

async function evaluateWithFallback(
  supabase: any,
  userId: string,
  planLabel: string,
  requestedModel: string,
  fallbackChain: string[],
  limitsMap: Record<string, TokenLimitConfig>
): Promise<BrainRouterResult> {
  // Build the ordered list of models to try: requested first, then the rest
  const orderedModels = [requestedModel, ...fallbackChain.filter(m => m !== requestedModel)];

  let lastBlockedResult: TokenCheckResult | null = null;
  let lastBlockedModel: string | null = null;

  for (const modelKey of orderedModels) {
    const limits = limitsMap[modelKey];
    if (!limits) continue;

    const tokenCheck = await checkTokenLimits(supabase, userId, modelKey, limits);

    if (tokenCheck.allowed) {
      const fallbackUsed = modelKey !== requestedModel;
      if (fallbackUsed) {
        console.log(`🧠 Brain Router: ${planLabel} FALLBACK — ${requestedModel} → ${modelKey} (daily ${tokenCheck.dailyUsed}/${limits.daily}, ${tokenCheck.dailyRemaining} remaining)`);
      } else {
        console.log(`🧠 Brain Router: ${planLabel} ${modelKey} — daily ${tokenCheck.dailyUsed}/${limits.daily}, ${tokenCheck.dailyRemaining} remaining`);
      }
      return {
        allowed: true,
        modelKey,
        modelName: modelKey,
        reason: fallbackUsed
          ? `${planLabel} fallback: ${requestedModel} exhausted → using ${modelKey} (${tokenCheck.dailyRemaining}/${limits.daily} daily tokens remaining)`
          : `${planLabel} ${modelKey} — ${tokenCheck.dailyUsed}/${limits.daily} daily tokens used`,
        fallbackUsed,
        fallbackFrom: fallbackUsed ? requestedModel : null,
        tokenInfo: tokenCheck,
        statusCode: 200,
      };
    }

    // This model is blocked — remember and try next
    lastBlockedResult = tokenCheck;
    lastBlockedModel = modelKey;
    console.log(`🧠 Brain Router: ${planLabel} ${modelKey} BLOCKED (daily ${tokenCheck.dailyUsed}/${limits.daily}, monthly ${tokenCheck.monthlyUsed}/${limits.monthly}) — trying fallback...`);
  }

  // All models exhausted
  return {
    allowed: false,
    modelKey: lastBlockedModel,
    modelName: lastBlockedModel,
    reason: `${planLabel} — ALL models exhausted. Last blocked: ${lastBlockedModel}`,
    fallbackUsed: false,
    fallbackFrom: null,
    tokenInfo: lastBlockedResult || undefined,
    statusCode: 429,
    clientError: `You've reached the token limit for all available models. Your quota resets daily and monthly.`,
    dailyResetAt: lastBlockedResult?.dailyResetAt,
    monthlyResetAt: lastBlockedResult?.monthlyResetAt,
  };
}
