// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createChatServerClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { aaiRuntime } from "@/lib/chat/aai";
import { tiers } from "@/lib/chat/model-registry";
import { classifyIntent } from "@/lib/intent-classifier";
import { getWeatherData, getCurrentTimeAndLocation } from "@/lib/time-utils";
import { getCurrentTimeCard, getCurrentCalendarCard, fetchTimeData } from "@/lib/chat/services/real-time";
import { performNLiveSearch } from "@/lib/chat/services/live-data";
import { getRouterConfig } from "@/lib/routers/router-factory";
import { checkTokenLimits, incrementTokenUsage } from "@/lib/chat/token-usage";
import { incrementModelUsage, checkModelLimit } from "@/lib/chat/model-limits";
import { selectAvailablePlusProModel } from "@/lib/chat/model-selector-fallback";
import FirecrawlApp from "@mendable/firecrawl-js";
import { safeFetch } from "@/lib/safe-fetch";
import { getUserMemorySummary, generateMemorySummary } from "@/lib/chat/memory";
import { buildMessageContext, generateConversationSummary } from "@/lib/chat/conversation-summary";
import { getUserSummary, generateUserSummary, shouldUseUserSummary } from "@/lib/chat/user-summary";
import { routeModel } from "@/lib/chat/router";
import { checkCache, storeInCache } from "@/lib/chat/semantic-cache";
import { getSystemPrompt } from "@/lib/chat/model-registry";
import { trimContextByTokens } from "@/lib/chat/token-counter";
import { executeWebSearch } from "@/lib/chat/tools/execute-web-search";
import { shouldWebSearch } from "@/lib/chat/web-search-decision";
import { checkDiveDeepLimit, incrementDiveDeepUsage } from "@/lib/chat/dive-deep-limiter";
import { checkWebSearchLimit } from "@/lib/chat/web-search-limiter";
import { compressHistory } from "@/lib/chat/context-compression";
import { getCachedReply, setCachedReply } from "@/lib/scale";
import { verifyAnswer } from "@/lib/verifier";
import { analyzeTask, routeTask, getRoutingExplanation, checkAndDeductTokens, checkAllLimitsExhausted, getTotalNiRemaining, estimateTokensNeeded, checkGPT5LimitsExhausted, getTotalGPT5Remaining } from "@/lib/chat/ni-router";

// ── DB helpers ──────────────────────────────
async function createConversation(supabase: any, userId: string, id: string, title?: string) {
  console.log(`Creating conversation: id=${id}, userId=${userId}, title=${title}`);
  const { error } = await supabase.from("conversations").insert({
    id,
    user_id: userId,
    title: title?.slice(0, 100) || "New conversation",
  });
  if (error) {
    console.error("Failed to create conversation:", error);
    throw new Error(`Failed to create conversation: ${error.message}`);
  }
  console.log(`Conversation created successfully: ${id}`);
}

async function saveMessage(supabase: any, userId: string, conversationId: string, role: string, content: string) {
  console.log(`Saving message: conversationId=${conversationId}, userId=${userId}, role=${role}`);
  
  // Verify conversation exists, create if not (handles race conditions / RLS timing on Vercel)
  const { data: conv } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", conversationId)
    .maybeSingle();
  
  if (!conv) {
    console.log(`Conversation ${conversationId} not found, creating it now...`);
    const { error: createError } = await supabase.from("conversations").insert({
      id: conversationId,
      user_id: userId,
      title: content?.slice(0, 100) || "New conversation",
    });
    if (createError) {
      console.error("Failed to auto-create conversation:", createError);
      throw new Error(`Failed to create conversation: ${createError.message}`);
    }
    console.log(`Conversation ${conversationId} auto-created in saveMessage`);
  }
  
  const { error } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
  });
  if (error) {
    console.error("Failed to save message:", error);
    throw new Error(`Failed to save message: ${error.message}`);
  }
  console.log(`Message saved successfully`);
}

async function getUserTotalMessageCount(supabase: any, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return error ? 0 : (count || 0);
}

// ── Track usage in chat schema tables (chat_usage + user_model_usage) ──
// Fire-and-forget: never blocks the response. Uses a chat-schema client.
async function trackChatUsage(
  userId: string,
  modelTier: string,
  responseContent: string,
  userContent: string
): Promise<void> {
  try {
    const chatSupabase = await createChatServerClient();
    const estimatedTokens = Math.ceil((userContent.length + responseContent.length) / 4);

    // 1. Increment chat_usage (message count per tier, 24h window)
    const now = new Date();
    const resetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    const { data: existing } = await chatSupabase
      .from("chat_usage")
      .select("messages_used, reset_at")
      .eq("user_id", userId)
      .eq("model_tier", modelTier)
      .maybeSingle();

    if (existing && new Date(existing.reset_at) > now) {
      await chatSupabase
        .from("chat_usage")
        .update({ messages_used: (existing.messages_used || 0) + 1 })
        .eq("user_id", userId)
        .eq("model_tier", modelTier);
    } else {
      await chatSupabase
        .from("chat_usage")
        .upsert(
          { user_id: userId, model_tier: modelTier, messages_used: 1, reset_at: resetAt },
          { onConflict: "user_id,model_tier" }
        );
    }

    // 2. Increment user_model_usage (tokens + messages per model, 24h window)
    await incrementModelUsage(chatSupabase, userId, modelTier, estimatedTokens);
  } catch (err) {
    console.error(`Usage tracking failed for tier ${modelTier}:`, err);
  }
}

// ── Updated scrapePage with Firecrawl → direct fetch → Groq scraper fallback ──
async function scrapePage(url: string): Promise<string> {
  // 1. Try Firecrawl
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (apiKey) {
    try {
      const fc = new FirecrawlApp({ apiKey });
      const doc = await fc.scrapeUrl(url, {
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 12000,
      });
      const md = (doc as any).markdown || "";
      if (md.trim().length > 200) return md.slice(0, 5000);
    } catch {
      console.log("⚡ Firecrawl failed, trying direct fetch...");
    }
  }

  // 2. Fallback: direct fetch with browser‑like headers
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await safeFetch(url, 5, controller.signal);
    clearTimeout(timeout);
    if (!res.ok) return "";
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);
    return text;
  } catch {
    // 3. Final fallback: Groq‑based scraper
    console.log("⚡ Direct fetch failed, trying Groq scraper...");
    const { groqScrape } = await import("@/lib/chat/services/groq-scraper");
    return await groqScrape(url);
  }
}

// ── Dynamic Rich Content Engine ──────────────────────────────
const DYNAMIC_RICH_CONTENT_ENGINE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DYNAMIC RICH CONTENT ENGINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
When the user asks for a plan, guide, tutorial, learning path, or any multi‑step
process that spans days/weeks/steps, automatically apply the following rules.
Do NOT wait for the user to request "detail" – provide it proactively.

1. STRUCTURE EVERY DAY / STEP
   - Use a table with columns: Day/Step, Topic, Detailed Activities, Resources, Time.
   - Each row must contain specific actions (e.g., "Read Chapter 2 and build the login form"),
     not vague instructions (e.g., "Study HTML forms").
   - Include real, searchable resource titles (e.g., "MDN Web Docs: HTML Forms").
   - Add a ⏱️ Time column with realistic estimates.

2. VISUAL BREAKDOWN
   - Add a progress tracker using text-based bars:
     \`\`\`
     Week 1  [████░░░░] Foundation
     Week 2  [██████░░] Core Skills
     \`\`\`
   - Mark milestone achievements with 🎯 (e.g., "🎯 Day 10 – Build your first responsive page").
   - Use emojis (📋, ⚠️, ✅, 💡, 📅, 🚀) as visual anchors, but never more than one per paragraph.

3. AVOID BOOK‑LIKE TEXT
   - Never output a plain paragraph when a table, list, or code block would be clearer.
   - Use blockquotes (>) for key takeaways or important notes.
   - Use --- dividers to separate major phases (Foundation, Intermediate, Advanced).
   - Keep paragraphs short (max 3 sentences). Prefer bullet points.

4. MAKE IT ACTIONABLE
   - Every day/step must end with a concrete deliverable (e.g., "✅ Done: A working contact form").
   - Include a final checklist so the user can verify their progress.

5. ADAPT TO THE REQUEST’S SCALE
   - For short tasks (≤5 steps), use a numbered list with bold actions.
   - For medium tasks (6–20 steps), use a detailed table as described.
   - For long plans (>20 days), split into phases with separate tables for each phase.

This engine activates automatically for any request that involves:
- multi‑day/week plans
- learning paths
- step‑by‑step tutorials
- project roadmaps
- habit‑building schedules
- any query where the user expects a structured, long‑form guide.

FORMATTING RULES FOR RICH CONTENT:
- Use bullet points (•) for feature lists and option summaries within each day/step.
- Use numbered lists for sequential actions within each step.
- Use bold for key terms, deliverables, and milestone names.
- Use blockquotes (>) for key takeaways or important tips per section.
- Use horizontal rules (---) to separate major phases (Foundation, Intermediate, Advanced).
- Use headings (##) for phase titles, (###) for day/step titles.
- Use tables for comparing options, resources, or schedules within a phase.
- Use italic for new terminology or foreign words introduced in the guide.
- Use emojis (📋, ⚠️, ✅, 💡, 📅, 🚀) as visual anchors — max 1 per paragraph, 3–8 total.
- Keep paragraphs short (2–4 sentences). Prefer bullets over prose.
- End each phase with a brief summary or checklist.
- Match response length to the scope: short tasks (≤5 steps) stay concise, long plans (>20 days) split into phases.
`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Detect user timezone from request headers
    const userTimezone = req.headers.get('x-user-timezone') || 
                        req.headers.get('timezone') || 
                        Intl.DateTimeFormat().resolvedOptions().timeZone;

    const body = await req.json();
    const {
      messages,
      modelTier: requestedTier = "fast",
      conversationId,
      newConversation,
      diveDeep,
      webSearch: webSearchEnabled = false,
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing messages" }, { status: 400 });
    }

    const lastUserMsg = messages.filter(m => m.role === "user").pop();

    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content;
    const convId = conversationId || crypto.randomUUID();

    // ── Detect if message contains image analysis ──
    const hasImageAnalysis = userMessage.includes('[Image Analysis:');
    const useGeminiVision = hasImageAnalysis;

    // ── Auto-router: resolve "auto" to a concrete tier (manual tiers pass through) ──
    let modelTier: string = requestedTier;
    
    // Override to use plus tier for image analysis (gemini-2.5-flash, non-streaming)
    if (useGeminiVision) {
      modelTier = 'plus';
      console.log(`🖼️ Image analysis detected, using plus tier (non-streaming)`);
    }
    if (requestedTier === "auto") {
      const routed = routeModel(userMessage, { historyLength: messages.length });
      modelTier = routed.tier;
      console.log(`🧭 Auto-router: "${userMessage.slice(0, 60)}" → N ${modelTier} (${routed.reason})`);

      // Low-confidence fallback: use tiny model to re-classify on ambiguous cases
      if (routed.confidence && routed.confidence < 0.6) {
        console.log(`⚠️ Low router confidence (${routed.confidence}), using tiny-model fallback`);
        try {
          const lastTwoMessages = messages.slice(-2).map((m: any) => `${m.role}: ${m.content}`).join("\n");
          const fallbackPrompt = `You are a tier classifier. Given this conversation context, classify the last user message into one of: fast, plus, pro, code, aai. Return ONLY the tier name.\n\nConversation:\n${lastTwoMessages}\n\nTier:`;
          
          const fallbackRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [{ role: "user", content: fallbackPrompt }],
              temperature: 0.1,
              max_tokens: 10,
            }),
          });

          if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            const fallbackTier = fallbackData.choices?.[0]?.message?.content?.trim().toLowerCase();
            console.log(`✅ LLM Response (auto-router classifier): llama-3.1-8b-instant | API Key: GROQ_API_KEY | Provider: groq | Result: ${fallbackTier}`);
            if (fallbackTier && ["fast", "plus", "pro", "code", "aai"].includes(fallbackTier)) {
              console.log(`🔄 Tiny-model override: ${modelTier} → ${fallbackTier}`);
              modelTier = fallbackTier;
            }
          }
        } catch (err) {
          console.warn("Tiny-model fallback failed, using original tier:", err);
        }
      }
    }

    // N Live activation conditions
    const isGreeting = /^(hi|hello|hey|sup|yo|ok|okay|thanks|thank you|bye|goodbye)[\s!.]*$/i.test(userMessage.trim());

    // ── Check if user has active subscription ──
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", user.id)
      .eq("status", "active")
      .maybeSingle();

    const isPaidUser = !!sub;
    const userPlan = sub?.plan || "free";
    const routerConfig = getRouterConfig(userPlan);

    // ── Time/Weather/Date Query Detection (needed early for search decision) ──
    const isWeatherQuery = /^(what'?s the )?weather|temperature|rain|forecast/i.test(userMessage.trim());
    const isTimeQuery = /^(what( i|')?s the )?time|clock|what is it time/i.test(userMessage.trim());
    const isDateQuery = /^(what( i|')?s (the )?date|today'?s date|what day)/i.test(userMessage.trim());
    const isWidgetQuery = isWeatherQuery || isTimeQuery || isDateQuery;

    // ── Dive Deep limit check (3/24h on Free, higher on paid) ──
    // If the user has hit their dive deep limit, force-disable it.
    let diveDeepActive = diveDeep && !isGreeting;
    let diveDeepRemaining = -1;
    if (diveDeepActive) {
      const diveDeepLimitResult = await checkDiveDeepLimit(
        user.id,
        routerConfig.diveDeepDailyLimit,
        routerConfig.diveDeepLimitHours
      );
      diveDeepRemaining = diveDeepLimitResult.remaining;
      if (!diveDeepLimitResult.allowed) {
        console.log(`🌐 Dive Deep limit reached (${diveDeepLimitResult.used}/${diveDeepLimitResult.limit}) — auto-disabling for this message`);
        diveDeepActive = false;
      }
    }
    const shouldUseNLive = diveDeepActive;

    // ── Auto web search decision (intent-based) ──
    // If the user didn't toggle the web search button, check if the message
    // intent requires real-time/external data. If so, auto-trigger a search
    // (subject to the same web search limit as the button toggle).
    let autoSearchDecision: { shouldSearch: boolean; reason: string } | null = null;
    if (!webSearchEnabled && !shouldUseNLive && !isWidgetQuery) {
      const decision = shouldWebSearch(userMessage);
      if (decision.shouldSearch) {
        // Check web search limit before auto-triggering
        const wsLimit = await checkWebSearchLimit(
          user.id,
          routerConfig.webSearchDailyLimit,
          routerConfig.webSearchLimitHours
        );
        if (wsLimit.allowed) {
          autoSearchDecision = decision;
          console.log(`🔍 Auto web search triggered: ${decision.reason}`);
        } else {
          console.log(`🔍 Auto web search skipped — limit reached (${wsLimit.used}/${wsLimit.limit})`);
        }
      }
    }

    // ── For Plus Pro, select model based on complexity and token availability ──
    let selectedModelKey = modelTier;
    if (userPlan === 'plus_pro' && routerConfig.perModelTokenLimits) {
      console.log(`🎯 Using Plus Pro model selection fallback logic`);
      try {
        const modelSelection = await selectAvailablePlusProModel(
          supabase,
          user.id,
          userMessage,
          modelTier,
          routerConfig.perModelTokenLimits
        );
        selectedModelKey = modelSelection.modelKey;
        console.log(`🎯 Selected model: ${selectedModelKey}, Reason: ${modelSelection.reason}`);
      } catch (error) {
        console.error(`🔴 Model selection failed, using default:`, error);
        selectedModelKey = 'plus_pro_deepseek'; // Fallback to DeepSeek
      }
    }

    // ── Check if user's plan allows the requested model tier ──
    if (!routerConfig.allowedModelKeys.includes(modelTier)) {
      return NextResponse.json(
        { error: `The ${modelTier} tier is not available on your plan. Upgrade to access it.` },
        { status: 403 }
      );
    }

    // ── Intent classification ─────────────────
    const intent = await classifyIntent(userMessage);

    // ── ASCII Diagram Detection (keyword + explicit user instruction) ──
    const asciiDiagramKeywords = /\b(architecture|topology|infrastructure|stack|layers|pipeline|data flow|request flow|dependency|hierarchy|tree structure|outline|breakdown|components|how .+ connects to|visualize|draw|diagram|ascii diagram|text diagram|tree diagram|show me a diagram|make a diagram)\b/i;
    const isAsciiDiagramRequest = asciiDiagramKeywords.test(userMessage);
    const isExplicitAsciiRequest = /\b(ascii|text diagram|tree diagram)\b/i.test(userMessage);
    const isExplicitMermaidRequest = /\b(mermaid|flowchart)\b/i.test(userMessage);
    let asciiDiagramHint = "";
    if (isExplicitAsciiRequest) {
      asciiDiagramHint = "\n\n[SYSTEM NOTE: The user explicitly requested an ASCII diagram. You MUST include a ```ascii code block in your response.]";
    } else if (isAsciiDiagramRequest && !isExplicitMermaidRequest) {
      asciiDiagramHint = "\n\n[SYSTEM NOTE: This query involves a structure/topology/flow that would benefit from an ASCII diagram. Consider including a ```ascii code block to visualize it.]";
    }

    // ── USAGE CHECK (CRITICAL - this must work) ──
    console.log(`🔴 CRITICAL: About to check usage for user ${user.id}, tier ${modelTier}`);

    // ── Free Plan: enforce per-model message limits (24h block when hit) ──
    // Free plan models have messagesPerDay limits (fast=15, plus=10, pro=5, etc.)
    // When the user hits the limit for the selected model, block for 24h.
    // IMPORTANT: user_model_usage is in the CHAT schema, not public.
    // createServerSupabaseClient uses public schema → must use createChatServerClient.
    if (userPlan === 'free') {
      const chatSupabaseForCheck = await createChatServerClient();
      const modelLimitCheck = await checkModelLimit(chatSupabaseForCheck, user.id, modelTier);
      if (!modelLimitCheck.allowed) {
        console.log(`🚫 Free plan message limit reached for tier ${modelTier}. Reset at: ${modelLimitCheck.resetsAt}`);
        return NextResponse.json(
          {
            error: `You've reached the message limit. Your access will reset in 24 hours.`,
            limitReached: true,
            resetsAt: modelLimitCheck.resetsAt,
            tier: modelTier,
          },
          { status: 429 }
        );
      }
    }

    // Check token limits for all plans
    // NI tier uses per-LLM SQL limits (ni_token_usage / gpt5_token_usage) as the
    // PRIMARY enforcement — handled below via checkAllLimitsExhausted + checkAndDeductTokens.
    // So we skip the generic check_token_limits call for NI to avoid the contradictory
    // double-limit (500k plan-level vs 10k/16k/34k per-model).
    let tokenCheck;
    try {
      if (modelTier === 'ni') {
        // NI: defer to per-LLM enforcement below. Mark as allowed here.
        tokenCheck = { allowed: true, dailyTokensUsed: 0, monthlyTokensUsed: 0, dailyRemaining: 0, monthlyRemaining: 0, dailyResetAt: '', monthlyResetAt: '' };
        console.log(`🟢 NI tier: deferring to per-LLM token enforcement`);
      } else if (userPlan === 'plus_pro' && routerConfig.perModelTokenLimits && selectedModelKey) {
        // For Plus Pro, check per-model token limits
        const modelLimits = routerConfig.perModelTokenLimits[selectedModelKey];
        if (modelLimits) {
          tokenCheck = await checkTokenLimits(
            supabase,
            user.id,
            modelTier,
            modelLimits.daily,
            modelLimits.monthly,
            selectedModelKey
          );
        } else {
          // Fallback to tier-level limits if model not found
          tokenCheck = await checkTokenLimits(
            supabase,
            user.id,
            modelTier,
            routerConfig.dailyTokenLimit,
            routerConfig.monthlyTokenLimit
          );
        }
      } else {
        // For all other plans (free, go_plus), use tier-level token limits
        tokenCheck = await checkTokenLimits(
          supabase,
          user.id,
          modelTier,
          routerConfig.dailyTokenLimit,
          routerConfig.monthlyTokenLimit
        );
      }
      console.log(`🟢 Token check result:`, tokenCheck);
    } catch (error) {
      console.error(`🔴 TOKEN CHECK FAILED:`, error);
      return NextResponse.json(
        { error: "Token usage tracking failed. Please try again." },
        { status: 500 }
      );
    }

    // Block if token limit is reached
    if (!tokenCheck || !tokenCheck.allowed) {
      const dailyResetTime = new Date(tokenCheck?.dailyResetAt || new Date(Date.now() + 24 * 60 * 60 * 1000));
      const monthlyResetTime = new Date(tokenCheck?.monthlyResetAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
      const dailyTimeLeftMs = dailyResetTime.getTime() - Date.now();
      const monthlyTimeLeftMs = monthlyResetTime.getTime() - Date.now();

      const dailyHours = Math.floor(dailyTimeLeftMs / (1000 * 60 * 60));
      const dailyMinutes = Math.floor((dailyTimeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
      const monthlyDays = Math.floor(monthlyTimeLeftMs / (1000 * 60 * 60 * 24));

      console.log(`🚫🚫🚫 TOKEN LIMIT BLOCKED for user ${user.id}, tier ${modelTier}. Token check:`, tokenCheck);

      return NextResponse.json(
        {
          error: `You've used all your tokens. Daily limit resets in ${dailyHours}h ${dailyMinutes}m. Monthly limit resets in ${monthlyDays} days.`,
          remaining: 0,
          dailyResetAt: tokenCheck?.dailyResetAt,
          monthlyResetAt: tokenCheck?.monthlyResetAt,
          tier: modelTier,
          dailyLimit: routerConfig.dailyTokenLimit,
          monthlyLimit: routerConfig.monthlyTokenLimit
        },
        { status: 429 }
      );
    }

    console.log(`✅ Token check PASSED. Daily tokens remaining: ${tokenCheck.dailyRemaining}, Monthly tokens remaining: ${tokenCheck.monthlyRemaining}`);

    // ── Ensure conversation exists BEFORE cache check (so cache hits work on new conversations) ──
    if (newConversation || !conversationId) {
      console.log(`Creating conversation: newConversation=${newConversation}, conversationId=${conversationId}, convId=${convId}`);
      await createConversation(supabase, user.id, convId, userMessage);
      console.log(`Conversation creation completed for ${convId}`);
    }

    // ── Cache check: deterministic + semantic ──
    if (!diveDeep && !isWidgetQuery && modelTier !== "aai" && modelTier !== "live") {
      const cached = await checkCache(userMessage);
      if (cached) {
        console.log(`💾 Cache hit (${cached.source}): "${userMessage.slice(0, 50)}..."`);
        await saveMessage(supabase, user.id, convId, "user", userMessage);
        await saveMessage(supabase, user.id, convId, "assistant", cached.response);
        trackChatUsage(user.id, modelTier, cached.response, userMessage).catch(console.error);
        const encoder = new TextEncoder();
        const words = cached.response.split(" ");
        const stream = new ReadableStream({
          async start(controller) {
            for (const word of words) {
              const chunk = { choices: [{ delta: { content: word + " " } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      }
    }

    await saveMessage(supabase, user.id, convId, "user", userMessage);

    // ── Dynamic window sizing (GPT-style) ──
    const { count: conversationMessageCount } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", convId);

    // Use router config for max history length
    const dynamicWindow = routerConfig.maxHistoryLength;

    // Paid tiers use token-based context windows (per-model), not fixed message count
    const isTokenBasedTier = modelTier === "go_plus" || modelTier === "ni" || modelTier === "plus_pro";
    let messagesForContext = isTokenBasedTier ? messages : messages.slice(-dynamicWindow);

    // ── Fetch unified user summary (Free plan only) ──
    let userSummary = null;
    let shouldUseSummary = false;
    
    if (!isTokenBasedTier) {
      userSummary = await getUserSummary(user.id);
      shouldUseSummary = userSummary ? await shouldUseUserSummary(userMessage) : false;
    }

    // ── NI tier requires active Pro or Plus Pro subscription (strict enforcement) ──
    if (modelTier === "ni") {
      if (!isPaidUser || !["pro", "plus_pro"].includes(userPlan)) {
        console.warn(`🚫 NI access denied: user=${user.id}, paid=${isPaidUser}, plan=${userPlan}`);
        return NextResponse.json(
          { error: "The NI model is exclusive to Pro and Plus Pro subscribers. Please upgrade to access this model." },
          { status: 402 }
        );
      }
      // Re-verify subscription status directly from DB
      if (sub?.status !== "active") {
        console.warn(`🚫 NI access denied: subscription status is "${sub?.status}" for user=${user.id}`);
        return NextResponse.json(
          { error: "Your subscription is not active. NI model requires an active Pro or Plus Pro subscription." },
          { status: 402 }
        );
      }
    }

    // ── NI Router: Determine actual model for NI tier ──
    let niModelRoute: any = null;
    if (modelTier === "ni") {
      // Check BOTH NI models (opus/sonnet/deepseek) AND GPT-5 models (gpt-5/gpt-5-mini)
      // deepseek-v4-flash is intentionally unlimited (easy tasks fallback)
      const [allNiExhausted, allGpt5Exhausted] = await Promise.all([
        checkAllLimitsExhausted(user.id, supabase),
        checkGPT5LimitsExhausted(user.id, supabase),
      ]);
      if (allNiExhausted && allGpt5Exhausted) {
        return NextResponse.json(
          { error: "Your daily token limits have been exhausted. Please wait 24 hours for reset." },
          { status: 429 }
        );
      }

      const tokenRemaining = await getTotalNiRemaining(user.id, supabase);
      const gpt5TokenRemaining = await getTotalGPT5Remaining(user.id, supabase);
      const tokenLimits = {
        opusRemaining: tokenRemaining.opus,
        sonnetRemaining: tokenRemaining.sonnet,
        deepseekRemaining: tokenRemaining.deepseek,
        gpt5Remaining: gpt5TokenRemaining.gpt5,
        gpt5MiniRemaining: gpt5TokenRemaining.mini,
      };

      // TODO: Use unified classifier when integrated
      // const classification = await unifiedClassify(userMessage, {
      //   historyLength: messages.length,
      //   forceAI: false,
      // });
      
      const taskAnalysis = await analyzeTask(userMessage, {
        codeLength: messages.length * 50,
        fileCount: 1,
        conversationHistoryLength: messages.length,
      });

      niModelRoute = routeTask(taskAnalysis, tokenLimits);
      console.log(`🧠 NI Router: ${getRoutingExplanation(niModelRoute)} (confidence: ${taskAnalysis.confidence})`);

      if (niModelRoute.error) {
        console.log(`⚠️ ${niModelRoute.error}`);
      }

      // TODO: Use accurate token counting when integrated
      // const tokensNeeded = countTokensSync(userMessage) + countTokensSync(tiers.ni.systemPrompt) + 500;
      const tokensNeeded = estimateTokensNeeded(taskAnalysis);
      let modelType: 'claude-opus-4.6' | 'claude-sonnet-4.6' | 'deepseek-v4-pro' | 'gpt-5' | 'gpt-5-mini' = 'deepseek-v4-pro';
      
      if (niModelRoute.model === 'claude-opus-4.6') modelType = 'claude-opus-4.6';
      else if (niModelRoute.model === 'claude-sonnet-4.6') modelType = 'claude-sonnet-4.6';
      else if (niModelRoute.model === 'deepseek-v4-pro') modelType = 'deepseek-v4-pro';
      else if (niModelRoute.model === 'gpt-5') modelType = 'gpt-5';
      else if (niModelRoute.model === 'gpt-5-mini') modelType = 'gpt-5-mini';

      if (niModelRoute.noTokenLimit) {
        console.log(`🔄 Using ${niModelRoute.model} with no token limit tracking`);
      } else {
        const tokenResult = await checkAndDeductTokens(user.id, modelType, tokensNeeded, supabase);
        if (!tokenResult.success) {
          if (niModelRoute.fallback) {
            niModelRoute = niModelRoute.fallback;
            let fallbackModelType: 'claude-opus-4.6' | 'claude-sonnet-4.6' | 'deepseek-v4-pro' | 'gpt-5' | 'gpt-5-mini' = 'deepseek-v4-pro';
            if (niModelRoute.model === 'claude-sonnet-4.6') fallbackModelType = 'claude-sonnet-4.6';
            else if (niModelRoute.model === 'gpt-5-mini') fallbackModelType = 'gpt-5-mini';
            else if (niModelRoute.model === 'deepseek-v4-pro') fallbackModelType = 'deepseek-v4-pro';
            
            const fallbackResult = await checkAndDeductTokens(user.id, fallbackModelType, tokensNeeded, supabase);
            if (!fallbackResult.success) {
              return NextResponse.json(
                { error: "Your daily token limits have been exhausted. Please wait 24 hours for reset." },
                { status: 429 }
              );
            }
          } else {
            return NextResponse.json(
              { error: "Your daily token limits have been exhausted. Please wait 24 hours for reset." },
              { status: 429 }
            );
          }
        }
      }
    }

    // Flag for response header
    let searchAttempted = false;

    // ── Fetch user profile (used by both branches) ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, goal, custom_instructions")
      .eq("user_id", user.id)
      .single();

    let profileNote = "";
    if (profile && !newConversation) {
      // Only use profile in ongoing conversations, not at start
      const parts = [];
      if (profile.goal) {
        // Extract meaningful words from goal
        const goalWords = profile.goal.split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5);
        if (goalWords.length > 0) {
          parts.push(`As your goal involves ${goalWords.join(", ")}, keep this context in mind for better responses.`);
        }
      }
      if (profile.custom_instructions) {
        // Extract key instructions
        const instructionWords = profile.custom_instructions.split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5);
        if (instructionWords.length > 0) {
          parts.push(`Following your preference for ${instructionWords.join(", ")}, tailor responses accordingly.`);
        }
      }
      if (parts.length > 0) {
        profileNote = parts.join(" ");
      }
    }

    // Add user summary to profile note when contextually appropriate
    if (userSummary && shouldUseSummary && !newConversation) {
      profileNote += ` ${userSummary}`;
    }

    // ── Cache check: skip for personalized, live, or AAI queries ──
    const canUseCache = !diveDeep && !profileNote && !userSummary && modelTier !== "aai" && modelTier !== "live" && !isWidgetQuery;
    if (canUseCache) {
      const cached = getCachedReply(userMessage);
      if (cached) {
        console.log(`💾 Cache hit for query: "${userMessage.slice(0, 50)}..."`);
        await saveMessage(supabase, user.id, convId, "assistant", cached);
        trackChatUsage(user.id, modelTier, cached, userMessage).catch(console.error);
        const encoder = new TextEncoder();
        const words = cached.split(" ");
        const stream = new ReadableStream({
          async start(controller) {
            for (const word of words) {
              const chunk = { choices: [{ delta: { content: word + " " } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "x-conversation-id": convId,
            "x-model-used": modelTier,
            "x-cached": "true",
          },
        });
      }
    }

    // ── Time/Weather/Date Handler (bypasses search for all tiers) ──
    if (isWidgetQuery) {
      console.log(`🕐 Time/Weather/Date query detected - using API instead of search`);
      const canUseWidgets = modelTier === "pro";
      let responseData = "";

      if (isWeatherQuery) {
        const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
        const weatherData = await getWeatherData(cityMatch?.[1]?.trim() || "Lahore");
        if (weatherData) {
          if (canUseWidgets) {
            responseData = `<!--WIDGET:WEATHER:${JSON.stringify(weatherData)}-->`;
          } else {
            responseData = `🌡️ ${weatherData.temp}°C, ${weatherData.condition}, 💧 ${weatherData.humidity}%, 🌬️ ${weatherData.windSpeed} m/s, 👁️ ${weatherData.visibility} km, 📊 ${weatherData.pressure} hPa, ☁️ ${weatherData.cloudiness}%`;
          }
        }
      } else if (isTimeQuery) {
        // Use the same time API (fetchTimeData) for all tiers to ensure consistency
        const timeData = await fetchTimeData(undefined, userTimezone);
        if (timeData) {
          if (canUseWidgets) {
            // N Pro: Format as widget
            const clockData = {
              utcDatetime: timeData.utcDatetime,
              timezone: timeData.timezone,
              label: timeData.label,
            };
            responseData = `<!--WIDGET:CLOCK:${JSON.stringify(clockData)}-->`;
          } else {
            // N Fast/Plus: Use pre-formatted strings from the API to avoid server-side timezone conversion
            const timeStr = timeData.formattedTime || "";
            const dateStr = timeData.formattedDate || "";
            if (timeStr && dateStr) {
              responseData = `🕐 ${timeStr} ${dateStr} (${timeData.timezone})`;
            }
          }
        }
      } else if (isDateQuery) {
        // Use the same time API (fetchTimeData) for all tiers to ensure consistency
        const timeData = await fetchTimeData(undefined, userTimezone);
        if (timeData) {
          if (canUseWidgets) {
            // N Pro: Format as widget
            const calData = {
              utcDatetime: timeData.utcDatetime,
              timezone: timeData.timezone,
              label: timeData.label,
            };
            responseData = `<!--WIDGET:CALENDAR:${JSON.stringify(calData)}-->`;
          } else {
            // N Fast/Plus: Format as plain text using the same data
            const dt = new Date(timeData.utcDatetime);
            const dateStr = new Intl.DateTimeFormat("en-US", {
              timeZone: timeData.timezone,
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(dt);

            responseData = `📅 ${dateStr}`;
          }
        }
      }

      if (responseData) {
        await saveMessage(supabase, user.id, convId, "assistant", responseData);
        trackChatUsage(user.id, modelTier, responseData, userMessage).catch(console.error);
        const encoder = new TextEncoder();
        const words = responseData.split(" ");
        const stream = new ReadableStream({
          async start(controller) {
            for (const word of words) {
              const chunk = { choices: [{ delta: { content: word + " " } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });
        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "x-conversation-id": convId,
            "x-model-used": modelTier,
          },
        });
      }
    }

    // Fetch persona notes once (used by both branches)
    const { data: personaNotes } = await supabase
      .from("bot_persona_notes")
      .select("note")
      .eq("user_id", user.id);
    let personaNoteText = "";
    if (personaNotes && personaNotes.length > 0) {
      personaNoteText = personaNotes.map((n: any) => `- ${n.note}`).join("\n");
    }

    // ── AAI branch: gate with explicit signals ─────────────────────────────
    if (modelTier === "aai") {
      // Tighten AAI entry: only use full planner for explicit complex signals
      const lowerMessage = userMessage.toLowerCase();
      const hasExplicitSignals = 
        /\b(plan|planning|step by step|multi-day|multi day|agent|workflow|architecture|system design|build a|create a|implement)\b/i.test(lowerMessage) ||
        userMessage.length > 300 ||
        (userMessage.includes("code") && userMessage.length > 150);

      if (!hasExplicitSignals) {
        console.log(`🔄 AAI short-circuit: no explicit signals, using normal tier instead`);
        // Fall back to Pro tier for simple AAI requests
        // Override modelTier to 'pro' and continue to regular tier logic
        modelTier = "pro";
      } else {
        // Only proceed with AAI branch if explicit signals are present
        const history = messages.slice(0, -1).map((m: any) => ({
          role: m.role,
          content: m.content,
          id: m.id,
          timestamp: Date.now(),
        }));

        // Only N Pro can generate widgets
        const canUseWidgets = false; // AAI doesn't support widgets

        let liveData = "";

        // Widget queries – use exact whole-question patterns to avoid false positives
        const isWeatherQuery = /^(what'?s the )?weather|temperature|rain|forecast/i.test(userMessage.trim());
        const isTimeQuery = /^(what( i|')?s the )?time|clock/i.test(userMessage.trim());
        const isDateQuery = /^(what( i|')?s (the )?date|today'?s date|what day)/i.test(userMessage.trim());

        const isWidgetQuery = isWeatherQuery || isTimeQuery || isDateQuery;

        if (isWidgetQuery) {
          if (isWeatherQuery) {
            const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
            const weatherData = await getWeatherData(cityMatch?.[1]?.trim() || "Lahore");
            if (weatherData) {
              liveData = `🌡️ ${weatherData.temp}°C, ${weatherData.condition}, 💧 ${weatherData.humidity}%, 🌬️ ${weatherData.windSpeed} m/s, 👁️ ${weatherData.visibility} km, 📊 ${weatherData.pressure} hPa, ☁️ ${weatherData.cloudiness}%`;
            }
          } else if (isTimeQuery) {
            const timeData = await getCurrentTimeAndLocation(null, userTimezone);
            if (timeData) {
              liveData = `🕐 ${timeData.time} ${timeData.date} (${timeData.timezone})`;
            }
          } else if (isDateQuery) {
            const now = new Date();
            const dateStr = now.toLocaleDateString("en-US", {
              timeZone: userTimezone || "UTC",
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            liveData = `📅 ${dateStr}`;
          }
          if (!liveData) {
            liveData = `\n\n--- DATA RESULT ---\nCould not fetch time/weather/date data. Please try again later.`;
          }
          console.log(`✅ API data obtained for AAI widget query (${liveData.length} chars)`);
        }

        const widgetInstruction = canUseWidgets ? `\n\n[SYSTEM NOTE: When the user asks for time, weather, or date, search the web and output ONLY a widget marker. Do NOT output the data in plain text.
Weather marker: <!--WIDGET:WEATHER:{"city":"...","temp":34,"condition":"scattered clouds","humidity":36,"windSpeed":3.1,"icon":"cloud"}-->
Time marker:   <!--WIDGET:CLOCK:{"hours":14,"minutes":6,"seconds":0,"timezone":"Asia/Karachi","label":"Lahore, PK"}-->
Calendar:      <!--WIDGET:CALENDAR:{"year":2026,"month":7,"day":3,"timezone":"Asia/Karachi","label":"Today"}-->]\n\n` : "";

        let extendedMessage = "";
        if (profileNote) {
          extendedMessage += `--- USER PROFILE ---\n${profileNote}\n\n`;
        }
        if (personaNoteText) {
          extendedMessage += `--- BOT PERSONA NOTES ---\nYou must follow these behavioral instructions with every response:\n${personaNoteText}\nThese are permanent preferences from the user.\n\n`;
        }
        if (liveData) {
          extendedMessage += `--- REAL-TIME SEARCH (use this data) ---\n${liveData}\n\n`;
          extendedMessage += `IMPORTANT: After your answer, add a "## Sources" section with one bullet point per source, like this:\n- [Title](URL)\n- [Title](URL)\nDo NOT skip this section.\n\n`;
        }
        extendedMessage += `[SYSTEM: Target response length is ${tiers.aai.maxTokens} tokens. Stop before that. End with a complete sentence. If you need more room, summarise and suggest upgrading to a higher tier.]`;

        // Inject ASCII diagram hint
        if (asciiDiagramHint) {
          extendedMessage += asciiDiagramHint;
        }

        // Prepend widget instruction
        extendedMessage = widgetInstruction + extendedMessage + `\n\nUser: ${userMessage}`;
        console.log(`📝 AAI extendedMessage now has ${extendedMessage.length} chars`);

        const aaiResult = await aaiRuntime.processRequest({
          userMessage: extendedMessage,
          conversationHistory: history,
          modelTier,
          metadata: {
            conversationId: convId,
            userId: user.id,
          },
        });

        let replyText = aaiResult.response || "";
        // Hard fallback for empty response
        if (!replyText.trim()) {
          replyText = "I searched the web but couldn't retrieve the full information. Please try again.";
        }
        await saveMessage(supabase, user.id, convId, "assistant", replyText);
        trackChatUsage(user.id, modelTier, replyText, userMessage).catch(console.error);

        // Trigger user summary generation (async, non-blocking, Free plan only)
        if (!isTokenBasedTier) {
          const totalMessageCount = await getUserTotalMessageCount(supabase, user.id);
          generateUserSummary(user.id, messages, totalMessageCount).catch(console.error);
        }

        const encoder = new TextEncoder();
        const words = replyText.split(" ");
        const stream = new ReadableStream({
          async start(controller) {
            for (const word of words) {
              const chunk = { choices: [{ delta: { content: word + " " } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });

        const headers: Record<string, string> = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-conversation-id": convId,
          "x-model-used": modelTier,
        };
        if (searchAttempted) {
          headers["x-search-performed"] = "true";
        }
        return new Response(stream, { headers });
      }
    }

    // ── Regular tier with fallback ────────────
    const tier = tiers[modelTier as keyof typeof tiers] || tiers.fast;

    // ── Inject user preferences (warmth, enthusiasm, etc.) ──
    const { data: prefs } = await supabase
      .from("user_preferences")
      .select("warmth, enthusiasm, formatting, conciseness")
      .eq("user_id", user.id)
      .single();

    let toneInjection = "";
    if (prefs) {
      toneInjection = `\n\n--- USER PERSONALIZATION ---\n`;
      if (prefs.warmth > 0) toneInjection += `- Be warm and empathetic. Use phrases like "I understand" where appropriate.\n`;
      if (prefs.warmth < 0) toneInjection += `- Be objective and direct. Avoid emotional language.\n`;
      if (prefs.enthusiasm > 0) toneInjection += `- Use positive, energetic language with occasional exclamation marks.\n`;
      if (prefs.enthusiasm < 0) toneInjection += `- Keep a neutral, measured tone.\n`;
      if (prefs.formatting > 0) toneInjection += `- Use headers, lists, and structured formatting extensively.\n`;
      if (prefs.formatting < 0) toneInjection += `- Prefer paragraphs over heavy Markdown formatting.\n`;
      if (prefs.conciseness > 0) toneInjection += `- Be extremely concise. Short sentences, minimal fluff.\n`;
      if (prefs.conciseness < 0) toneInjection += `- Be thorough and detailed, even if responses become longer.\n`;
    }

    // ── Context compression: summarize older turns, keep recent verbatim ──
    // Paid tiers skip compression — they use token-based context windows per model
    let recentMessages: Array<{ role: string; content: string }>;
    let rollingSummary: string | null = null;
    if (isTokenBasedTier) {
      recentMessages = messagesForContext.map((m: any) => ({ role: m.role, content: m.content }));
    } else {
      const compressed = await compressHistory(
        messagesForContext.map((m: any) => ({ role: m.role, content: m.content }))
      );
      recentMessages = compressed.recent;
      rollingSummary = compressed.summary;
    }

    // Build messages array with dynamic tiered system prompt (reduces token usage by 50-70%)
    const dynamicSystemPrompt = getSystemPrompt(modelTier, userMessage);
    const apiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: dynamicSystemPrompt },
      ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

    // ── Inject image analysis context ──
    if (useGeminiVision) {
      apiMessages[0].content += `\n\n--- IMAGE ANALYSIS CONTEXT ---\nThe user has attached an image and the image has been analyzed. The image description is included in the user's message prefixed with [Image Analysis:]. You MUST use this image analysis information to answer the user's question about the image. Do not say you cannot see images — the image has already been described for you. Use the description to provide a detailed and helpful response about what the user asked.`;
    }

    // ── Inject rolling summary of earlier turns (context compression) ──
    if (rollingSummary) {
      apiMessages[0].content += `\n\n--- EARLIER CONVERSATION SUMMARY ---\n${rollingSummary}\n(The messages below are the most recent turns; use the summary above for earlier context.)`;
    }

    // ── Inject user profile ──────────────────────
    if (profileNote) {
      apiMessages[0].content += `\n\n--- USER PROFILE ---\n${profileNote}`;
    }

    // ── Inject user preferences ──
    apiMessages[0].content += toneInjection;

    // ── Inject intent label ──
    apiMessages[0].content += `\n\nIntent: ${intent}`;

    // ── Inject ASCII diagram hint ──
    if (asciiDiagramHint) {
      apiMessages[0].content += asciiDiagramHint;
    }

    // ── Dynamic Rich Content Engine (conditional — saves ~600 tokens on simple queries) ──
    const richContentIntents = new Set([
      "planning",
      "step_by_step_guide",
      "how_to_tutorial",
      "learning_path",
      "project_management",
      "deep_explanation",
      "system_design",
      "architecture_design",
    ]);
    const needsRichContent = modelTier === "pro" || richContentIntents.has(intent);
    if (needsRichContent) {
      apiMessages[0].content += DYNAMIC_RICH_CONTENT_ENGINE;
    }

    // ── Inject bot persona notes ──
    if (personaNoteText) {
      apiMessages[0].content += `\n\n--- BOT PERSONA NOTES ---\nYou must follow these behavioral instructions with every response:\n${personaNoteText}\nThese are permanent preferences from the user.`;
    }

    // ── Widget handling for time/weather/date queries ──
    let liveData = "";
    let searchSources: { title: string; url: string }[] = [];
    const canUseWidgets = modelTier === "pro";

    {
      const isWeatherQuery = /^(what'?s the )?weather|temperature|rain|forecast/i.test(userMessage.trim());
      const isTimeQuery = /^(what( i|')?s the )?time|clock/i.test(userMessage.trim());
      const isDateQuery = /^(what( i|')?s (the )?date|today'?s date|what day)/i.test(userMessage.trim());
      const isWidgetQuery = isWeatherQuery || isTimeQuery || isDateQuery;

      if (isWidgetQuery) {
        if (canUseWidgets) {
          if (isWeatherQuery) {
            const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
            const weatherData = await getWeatherData(cityMatch?.[1]?.trim() || "Lahore");
            if (weatherData) {
              liveData = `<!--WIDGET:WEATHER:${JSON.stringify(weatherData)}-->`;
            }
          } else if (isTimeQuery) {
            liveData = await getCurrentTimeCard(undefined, userTimezone);
          } else if (isDateQuery) {
            liveData = await getCurrentCalendarCard(undefined, userTimezone);
          }
        } else {
          if (isWeatherQuery) {
            const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
            const weatherData = await getWeatherData(cityMatch?.[1]?.trim() || "Lahore");
            if (weatherData) {
              liveData = `🌡️ ${weatherData.temp}°C, ${weatherData.condition}, 💧 ${weatherData.humidity}%, 🌬️ ${weatherData.windSpeed} m/s, 👁️ ${weatherData.visibility} km, 📊 ${weatherData.pressure} hPa, ☁️ ${weatherData.cloudiness}%`;
            }
          } else if (isTimeQuery) {
            const timeData = await getCurrentTimeAndLocation(null, userTimezone);
            if (timeData) {
              liveData = `🕐 ${timeData.time} ${timeData.date} (${timeData.timezone})`;
            }
          } else if (isDateQuery) {
            const now = new Date();
            const dateStr = now.toLocaleDateString("en-US", {
              timeZone: userTimezone || "UTC",
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            liveData = `📅 ${dateStr}`;
          }
          if (!liveData) {
            liveData = `\n\n--- DATA RESULT ---\nCould not fetch time/weather/date data. Please try again later.`;
          }
        }
        if (liveData && canUseWidgets) {
          console.log(`✅ Widget data obtained (${liveData.length} chars)`);
        }
      }
    }

    // Inject widget data into LLM context for regular tiers
    if (liveData) {
      apiMessages[0].content += `\n\n--- REAL-TIME DATA ---\n${liveData}`;
    }

    // ── N Live Pipeline: Direct streaming without LLM ──
    let wikiSources: { title: string; url: string }[] = [];
    if (shouldUseNLive) {
      searchAttempted = true;

      // Check for widget queries (N Pro only)
      const isWeatherQuery = /^(what'?s the )?weather|temperature|rain|forecast/i.test(userMessage.trim());
      const isTimeQuery = /^(what( i|')?s the )?time|clock/i.test(userMessage.trim());
      const isDateQuery = /^(what( i|')?s (the )?date|today'?s date|what day)/i.test(userMessage.trim());
      const isWidgetQuery = isWeatherQuery || isTimeQuery || isDateQuery;
      const canUseWidgets = modelTier === "pro";

      let widgetData = "";
      let searchQuery = userMessage;

      // Handle mixed queries: extract non-widget part for search
      if (isWidgetQuery && canUseWidgets) {
        // N Pro: Use widgets for time/weather/date, NO web search for pure widget queries
        if (isWeatherQuery) {
          const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
          const weatherData = await getWeatherData(cityMatch?.[1]?.trim() || "Lahore");
          if (weatherData) {
            widgetData = `<!--WIDGET:WEATHER:${JSON.stringify(weatherData)}-->`;
          }
          // Only search if there's additional content beyond the weather query
          const remainingQuery = userMessage.replace(/weather|temperature|rain|forecast|in\s+[A-Za-z\s]+/gi, "").trim();
          searchQuery = remainingQuery.length > 3 ? remainingQuery : "";
        } else if (isTimeQuery) {
          widgetData = await getCurrentTimeCard(undefined, userTimezone);
          // Only search if there's additional content beyond the time query
          const remainingQuery = userMessage.replace(/what( i|')?s the \)?time|clock/gi, "").trim();
          searchQuery = remainingQuery.length > 3 ? remainingQuery : "";
        } else if (isDateQuery) {
          widgetData = await getCurrentCalendarCard(undefined, userTimezone);
          // Only search if there's additional content beyond the date query
          const remainingQuery = userMessage.replace(/what( i|')?s (the )?date|today'?s date|what day/gi, "").trim();
          searchQuery = remainingQuery.length > 3 ? remainingQuery : "";
        }
      } else if (isWidgetQuery && !canUseWidgets) {
        // For non-Pro tiers, use API-based responses without widgets (no Tavily/Wikipedia for time/weather/date)
        if (isWeatherQuery) {
          const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
          const weatherData = await getWeatherData(cityMatch?.[1]?.trim() || "Lahore");
          if (weatherData) {
            widgetData = `🌡️ ${weatherData.temp}°C, ${weatherData.condition}, 💧 ${weatherData.humidity}%, 🌬️ ${weatherData.windSpeed} m/s, 👁️ ${weatherData.visibility} km, 📊 ${weatherData.pressure} hPa, ☁️ ${weatherData.cloudiness}%`;
          }
        } else if (isTimeQuery) {
          const timeData = await getCurrentTimeAndLocation(null, userTimezone);
          if (timeData) {
            widgetData = `🕐 ${timeData.time} ${timeData.date} (${timeData.timezone})`;
          }
        } else if (isDateQuery) {
          const now = new Date();
          const dateStr = now.toLocaleDateString("en-US", {
            timeZone: userTimezone || "UTC",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          });
          widgetData = `📅 ${dateStr}`;
        }
        // Don't perform web search for time/weather/date in non-Pro tiers
        searchQuery = "";
      }

      // Perform N Live search
      const cleanQ = searchQuery.length > 3 ? searchQuery : userMessage;
      const searchResult = await performNLiveSearch(cleanQ);

      // Count this as a dive deep usage (independent from web search limit)
      await incrementDiveDeepUsage(user.id);

      if (searchResult.answer && !searchResult.useLLM) {
        // Tavily succeeded - stream directly in italic (sources passed via header)
        const italicAnswer = `*${searchResult.answer}*`;
        const fullResponse = widgetData ? `${widgetData}\n\n${italicAnswer}` : italicAnswer;

        // Stream the response
        const words = fullResponse.split(/\s+/);
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          async start(controller) {
            for (const word of words) {
              const chunk = { choices: [{ delta: { content: word + " " } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });

        await saveMessage(supabase, user.id, convId, "assistant", fullResponse);
        trackChatUsage(user.id, modelTier, fullResponse, userMessage).catch(console.error);

        if (!isTokenBasedTier) {
          const totalMessageCount = await getUserTotalMessageCount(supabase, user.id);
          generateUserSummary(user.id, messages, totalMessageCount).catch(console.error);
        }

        const headers: Record<string, string> = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-conversation-id": convId,
          "x-search-performed": "true",
          "x-sources": encodeURIComponent(JSON.stringify(searchResult.sources)),
        };

        return new Response(stream, { headers });
      } else if (searchResult.answer && searchResult.useLLM) {
        // Wikipedia fallback - pass to LLM for formatting (sources passed via header)
        liveData = searchResult.answer;
        // Store sources to pass via header later
        wikiSources = searchResult.sources;
        // Continue to normal LLM flow below
      } else {
        // No results - show error message
        const errorMessage = "I couldn't find information on that topic. Please try again later or rephrase your question.";
        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            const words = errorMessage.split(/\s+/);
            for (const word of words) {
              const chunk = { choices: [{ delta: { content: word + " " } }] };
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });

        await saveMessage(supabase, user.id, convId, "assistant", errorMessage);
        trackChatUsage(user.id, modelTier, errorMessage, userMessage).catch(console.error);

        if (!isTokenBasedTier) {
          const totalMessageCount = await getUserTotalMessageCount(supabase, user.id);
          generateUserSummary(user.id, messages, totalMessageCount).catch(console.error);
        }

        const headers: Record<string, string> = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-conversation-id": convId,
          "x-search-performed": "true",
        };

        return new Response(stream, { headers });
      }
    }

    // Inject N Live Wikipedia fallback data into LLM context
    if (liveData && shouldUseNLive) {
      apiMessages[0].content += `\n\n--- WEB SEARCH RESULTS ---\n${liveData}\n\nIMPORTANT: You have been provided with web search results above. Your job is to:\n1. Acknowledge the search results\n2. Explain and expand on the information\n3. Add your own insights and context\n4. Cover related aspects the user might find useful\n5. Make it comprehensive and helpful\nDo NOT repeat the search results verbatim. Instead, build upon them.`;
    }

    // ── Soft token target + upgrade hint (skip for live tier) ──
    if (modelTier !== "live") {
      const tierUpgrade: Record<string, string | null> = {
        fast: "Plus",
        plus: "Pro",
        pro: "AAI",
        live: "Pro",
        code: "Pro",
        aai: null,
      };
      const nextTier = tierUpgrade[modelTier];
      apiMessages[0].content += `\n\n--- OUTPUT SIZE CONTROL ---
Your **target** response length is exactly ${tier.maxTokens} tokens.
- Stop generating **before** you reach this limit.
- End with a complete sentence, a brief summary, or a period.
- Never leave a word unfinished.
- If the answer requires more space, give a short summary and add:
  "→ For a longer explanation, switch to N ${nextTier || 'Pro'}."
The system will cut you off if you exceed twice this limit, so plan ahead.`;
    }

    // ── Force minimum token allocation for reply (all tiers except live) ──
    if (modelTier !== "live" && !useGeminiVision) {
      const HARD_RESPONSE_TOKENS = 300;
      const systemTokens = Math.ceil(apiMessages[0].content.length / 4);
      const availableTokens = tier.maxTokens - systemTokens;
      if (availableTokens < HARD_RESPONSE_TOKENS) {
        apiMessages[0].content = apiMessages[0].content.slice(0, (tier.maxTokens - HARD_RESPONSE_TOKENS) * 4);
        console.log(`✂️ System prompt trimmed to ${apiMessages[0].content.length} chars (${tier.maxTokens - HARD_RESPONSE_TOKENS} tokens for reply)`);
      }
    }

    // ── Web Search (button toggle OR auto-trigger from intent) ──
    // Injected AFTER system prompt trimming so search results are not cut off.
    // N Live has its own search pipeline, so skip when shouldUseNLive is true.
    // Two trigger paths:
    //   1. User toggled the web search button (webSearchEnabled)
    //   2. Auto-triggered because the message intent requires real-time data
    //      (autoSearchDecision — checked against limit above)
    const shouldPerformWebSearch = (webSearchEnabled || autoSearchDecision !== null) && !shouldUseNLive && !isWidgetQuery;
    if (shouldPerformWebSearch) {
      const trigger = webSearchEnabled ? "user button" : `auto (${autoSearchDecision!.reason})`;
      console.log(`🔍 Web search triggered by ${trigger} — performing search for: "${userMessage.slice(0, 80)}"`);
      try {
        const { result: searchResult, sources: webSources } = await executeWebSearch({
          query: userMessage,
          userId: user.id,
          limit: routerConfig.webSearchDailyLimit,
          windowHours: routerConfig.webSearchLimitHours,
          isPaidUser,
        });

        if (searchResult && !searchResult.includes("limit reached") && !searchResult.includes("Failed to perform") && searchResult !== "No search results found.") {
          searchAttempted = true;
          if (webSources.length > 0) {
            searchSources = webSources;
          }
          apiMessages[0].content += `\n\n--- WEB SEARCH RESULTS ---\n${searchResult}\n\nIMPORTANT: You have been provided with web search results above. Use this information to answer the user's question. Cite sources when relevant. Do NOT repeat the search results verbatim — synthesize and build upon them.`;
          console.log(`✅ Web search results injected (${searchResult.length} chars, ${webSources.length} sources)`);
        } else {
          console.log(`⚠️ Web search skipped: ${searchResult?.slice(0, 100)}`);
        }
      } catch (searchError) {
        console.warn(`⚠️ Web search failed:`, searchError);
      }
    }

    let lastError: string | null = null;

    // ── For NI tier (Pro plan): filter models to only the router's chosen model ──
    // The NI router (routeTask) picks a model based on task complexity and deducts
    // tokens from that model's budget. The model loop must only try the router's
    // chosen model (and its fallback chain), NOT all models in the tier.
    // Otherwise tokens are deducted from one model but the API call goes to another.
    let modelsToTry = tier.models;
    if (modelTier === 'ni' && niModelRoute) {
      const routedModelNames = new Set<string>();
      let route: any = niModelRoute;
      while (route) {
        if (route.model) routedModelNames.add(route.model);
        route = route.fallback;
      }
      modelsToTry = tier.models.filter((m: any) => routedModelNames.has(m.modelName));
      if (modelsToTry.length === 0) {
        // Fallback: if no models matched (shouldn't happen), use all
        console.warn(`⚠️ NI router chose models not in tier.models, using all`);
        modelsToTry = tier.models;
      }
      console.log(`🎯 NI router selected models: ${[...routedModelNames].join(', ')}`);
    }

    // ── For Plus Pro: sort models to prioritize the selected model ──
    // selectAvailablePlusProModel picks a model based on complexity + token
    // availability. The model loop must try that model FIRST, then fall back
    // to others. Otherwise the loop uses opus (first in array) even when the
    // selector chose luna — and tokens are incremented from the wrong model.
    if (userPlan === 'plus_pro' && selectedModelKey && selectedModelKey !== modelTier) {
      modelsToTry = [...tier.models].sort((a: any, b: any) => {
        if (a.modelKey === selectedModelKey) return -1;
        if (b.modelKey === selectedModelKey) return 1;
        return 0;
      });
      console.log(`🎯 Plus Pro prioritized model: ${selectedModelKey}`);
    }

    // Track which model was actually used (for correct token increment)
    let actualModelKeyUsed: string | null = null;

    for (const modelConfig of modelsToTry) {
      console.log(`🤖 Using model: ${modelConfig.modelName} (${modelConfig.modelKey}) | API Key: ${modelConfig.apiKeyEnv} | Endpoint: ${modelConfig.endpoint}`);

      // ── Per-model token limit check for Plus Pro (fallback to next model) ──
      // If this model's token limit is exhausted, skip it and try the next one.
      // When all models are exhausted, the loop ends and we return 429 below.
      // Note: Pro (NI tier) uses per-LLM SQL limits (ni_token_usage / gpt5_token_usage)
      // which are already checked+deducted above via checkAndDeductTokens.
      if (userPlan === 'plus_pro' && routerConfig.perModelTokenLimits && modelConfig.modelKey) {
        const modelLimitCfg = routerConfig.perModelTokenLimits[modelConfig.modelKey];
        if (modelLimitCfg) {
          const perModelCheck = await checkTokenLimits(
            supabase,
            user.id,
            modelTier,
            modelLimitCfg.daily,
            modelLimitCfg.monthly,
            modelConfig.modelKey
          );
          if (!perModelCheck.allowed) {
            console.log(`🔄 Model ${modelConfig.modelKey} token limit reached — falling back to next model`);
            lastError = `Token limit reached for this model`;
            continue;
          }
        }
      }

      // Track which model is actually being used (for correct token increment)
      actualModelKeyUsed = modelConfig.modelKey || null;

      // ── Per-model token-based context trimming for paid tiers ──
      // Use routerConfig.contextWindowSize (plan-level limit) if defined,
      // otherwise fall back to modelConfig.contextWindowSize (model's full window).
      // This enforces the plan's context window limit (e.g. Go Plus = 16k, not 1M).
      const effectiveContextWindow = (isTokenBasedTier && routerConfig.contextWindowSize)
        ? routerConfig.contextWindowSize
        : (modelConfig.contextWindowSize || 0);
      const modelApiMessages = (effectiveContextWindow && isTokenBasedTier)
        ? trimContextByTokens(apiMessages, effectiveContextWindow, tier.maxTokens)
        : apiMessages;

      let apiKey = process.env[modelConfig.apiKeyEnv];

      // Use fallback key if primary is missing or we're on the fallback model
      if (!apiKey || modelConfig.modelKey === "live_fallback" || modelConfig.modelKey === "aai_fallback") {
        const fallbackKeyEnv = process.env.GROQ_API_KEY_4 ? "GROQ_API_KEY_4" : modelConfig.apiKeyEnv;
        console.log(`🔄 Using fallback API key: ${fallbackKeyEnv} for ${modelConfig.modelKey}`);
        apiKey = process.env.GROQ_API_KEY_4 || process.env[modelConfig.apiKeyEnv];
      }
      if (!apiKey) {
        lastError = `Missing API key for ${modelConfig.modelKey}`;
        console.error(`❌ Missing API key: ${modelConfig.apiKeyEnv} for model ${modelConfig.modelName} (${modelConfig.modelKey})`);
        continue;
      }

      // Modest headroom above the target so replies finish cleanly without
      // allowing a full 2× budget overrun.
      const hardCap = Math.max(Math.ceil(tier.maxTokens * 1.3), 512);

      // Token budget log only for non‑live tiers
      if (modelTier !== "live") {
        const remainingTokens = tier.maxTokens - Math.ceil(modelApiMessages[0].content.length / 4);
        console.log(`📊 Token budget: ${tier.maxTokens} total, ~${Math.ceil(modelApiMessages[0].content.length / 4)} for system, ${remainingTokens} remaining for reply`);
      }

      try {
        // ── Gemini branch for image analysis (non-streaming, more reliable) ────
        if (modelConfig.provider === "gemini" && useGeminiVision) {
          const geminiUrl = `${modelConfig.endpoint}?key=${apiKey}`;
          const systemMessages = modelApiMessages.filter(m => m.role === "system");
          const otherMessages = modelApiMessages.filter(m => m.role !== "system");

          const geminiBody: any = {
            contents: otherMessages.map(m => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            generationConfig: {
              temperature: tier.temperature,
              maxOutputTokens: hardCap,
            },
          };
          if (systemMessages.length > 0) {
            geminiBody.system_instruction = {
              parts: [{ text: systemMessages.map(m => m.content).join("\n") }],
            };
          }

          console.log(`🤖 Using model: ${modelConfig.modelName} (${modelConfig.modelKey}) | API Key: ${modelConfig.apiKeyEnv} | Endpoint: ${modelConfig.endpoint} | Mode: non-streaming (image analysis)`);
          const aiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(geminiBody),
          });

          if (!aiRes.ok) {
            const errorText = await aiRes.text();
            console.warn(`❌ LLM Error: ${modelConfig.modelName} (${modelConfig.modelKey}) | API Key: ${modelConfig.apiKeyEnv} | Provider: gemini | Error: ${errorText}`);
            lastError = errorText;
            continue;
          }

          const data = await aiRes.json();
          let fullContent = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

          // Log promptFeedback if blocked
          if (data?.promptFeedback?.blockReason) {
            console.warn(`⚠️ Gemini promptFeedback: ${JSON.stringify(data.promptFeedback)}`);
          }

          console.log(`✅ LLM Response: ${modelConfig.modelName} (${modelConfig.modelKey}) | Content length: ${fullContent.length} chars`);

          if (!fullContent.trim()) {
            fullContent = "I couldn't generate a response about this image. Please try again.";
          }

          // Verify answer if search was used
          let finalContent = fullContent;
          if (searchAttempted && !shouldUseNLive && searchSources.length > 0) {
            const sourceUrls = searchSources.map(s => s.url);
            try {
              finalContent = await verifyAnswer(fullContent, sourceUrls, userMessage);
            } catch (err) {
              console.warn("Verification failed, using original answer:", err);
            }
          }

          saveMessage(supabase, user.id, convId, "assistant", finalContent).catch(console.error);
          trackChatUsage(user.id, modelTier, finalContent, userMessage).catch(console.error);

          // ── Record token usage (skip NI — handled by per-LLM SQL deduction) ──
          // Use actualModelKeyUsed (the model that actually served the request)
          // instead of selectedModelKey (the model the selector chose) to avoid
          // incrementing the wrong model's budget.
          if (modelTier !== 'ni') {
            const estimatedTokens = Math.ceil((userMessage.length + finalContent.length) / 4);
            const incrementModelKey = (userPlan === 'plus_pro' && actualModelKeyUsed) ? actualModelKeyUsed : null;
            incrementTokenUsage(supabase, user.id, modelTier, estimatedTokens, incrementModelKey || undefined).catch(err =>
              console.error(`Token usage increment failed for tier ${modelTier}:`, err)
            );
          }

          if (!isTokenBasedTier) {
            getUserTotalMessageCount(supabase, user.id).then(totalMessageCount => {
              generateUserSummary(user.id, messages, totalMessageCount).catch(console.error);
            }).catch(console.error);
          }

          if (canUseCache && finalContent.length > 20) {
            setCachedReply(userMessage, finalContent);
          }

          // Convert to SSE stream for client
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            async start(controller) {
              // Send content in word chunks for typing effect
              const words = finalContent.split(/(\s+)/);
              for (const word of words) {
                const chunk = { choices: [{ delta: { content: word } }] };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
              }
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            },
          });

          const headers: Record<string, string> = {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "x-conversation-id": convId,
            "x-model-used": modelTier,
          };
          if (searchAttempted) {
            headers["x-search-performed"] = "true";
          }
          const geminiSources = searchSources.length > 0 ? searchSources : wikiSources;
          if (geminiSources.length > 0) {
            headers["x-sources"] = encodeURIComponent(JSON.stringify(geminiSources));
          }

          return new Response(stream, { headers });
        }

        // ── Gemini branch (true SSE streaming) ────
        if (modelConfig.provider === "gemini") {
          const streamEndpoint = modelConfig.endpoint.replace(":generateContent", ":streamGenerateContent");
          const geminiUrl = `${streamEndpoint}?alt=sse&key=${apiKey}`;
          const systemMessages = modelApiMessages.filter(m => m.role === "system");
          const otherMessages = modelApiMessages.filter(m => m.role !== "system");

          const geminiBody: any = {
            contents: otherMessages.map(m => ({
              role: m.role === "assistant" ? "model" : "user",
              parts: [{ text: m.content }],
            })),
            generationConfig: {
              temperature: tier.temperature,
              maxOutputTokens: hardCap,
            },
          };
          if (systemMessages.length > 0) {
            geminiBody.system_instruction = {
              parts: [{ text: systemMessages.map(m => m.content).join("\n") }],
            };
          }

          const aiRes = await fetch(geminiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(geminiBody),
          });

          if (!aiRes.ok || !aiRes.body) {
            const errorText = aiRes.body ? await aiRes.text() : `HTTP ${aiRes.status}`;
            console.warn(`❌ LLM Error: ${modelConfig.modelName} (${modelConfig.modelKey}) | API Key: ${modelConfig.apiKeyEnv} | Provider: gemini | Error: ${errorText}`);
            lastError = errorText;
            continue;
          }

          const encoder = new TextEncoder();
          const decoder = new TextDecoder();
          let fullContent = "";

          const stream = new ReadableStream({
            async start(controller) {
              try {
                const reader = aiRes.body!.getReader();
                let buffer = "";
                let chunkCount = 0;
                while (true) {
                  const { done, value } = await reader.read();
                  if (done) break;

                  buffer += decoder.decode(value, { stream: true });
                  const lines = buffer.split("\n");
                  buffer = lines.pop() || "";

                  for (const line of lines) {
                    if (!line.startsWith("data: ")) continue;
                    const data = line.slice(6).trim();
                    if (!data || data === "[DONE]") continue;

                    try {
                      const parsed = JSON.parse(data);
                      const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
                      if (text) {
                        fullContent += text;
                        chunkCount++;
                        const chunk = { choices: [{ delta: { content: text } }] };
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                      }
                      // Log prompt feedback / block reasons
                      if (parsed?.promptFeedback?.blockReason && chunkCount === 0) {
                        console.warn(`⚠️ Gemini promptFeedback: ${JSON.stringify(parsed.promptFeedback)}`);
                      }
                    } catch {
                      // skip invalid JSON
                    }
                  }
                }

                console.log(`📊 Stream finished: ${chunkCount} chunks, ${fullContent.length} chars for ${modelConfig.modelName}`);

                // Hard fallback – never send empty response
                if (!fullContent.trim()) {
                  fullContent = "I couldn't generate a response. Please try again.";
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: fullContent } }] })}\n\n`));
                }

                // Verify answer if search was used (non-NLive path)
                let finalContent = fullContent;
                if (searchAttempted && !shouldUseNLive && searchSources.length > 0) {
                  const sourceUrls = searchSources.map(s => s.url);
                  try {
                    finalContent = await verifyAnswer(fullContent, sourceUrls, userMessage);
                    console.log(`✅ Answer verified (${finalContent.length} chars)`);
                  } catch (err) {
                    console.warn("Verification failed, using original answer:", err);
                  }
                }

                saveMessage(supabase, user.id, convId, "assistant", finalContent).catch(console.error);
                trackChatUsage(user.id, modelTier, finalContent, userMessage).catch(console.error);
                if (!isTokenBasedTier) {
                  getUserTotalMessageCount(supabase, user.id).then(totalMessageCount => {
                    generateUserSummary(user.id, messages, totalMessageCount).catch(console.error);
                  }).catch(console.error);
                }

                if (canUseCache && finalContent.length > 20) {
                  setCachedReply(userMessage, finalContent);
                }

                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
              } catch (error) {
                console.error("Gemini stream error:", error);
                controller.error(error);
              }
            },
          });

          console.log(`✅ LLM Stream started: ${modelConfig.modelName} (${modelConfig.modelKey}) | API Key: ${modelConfig.apiKeyEnv} | Provider: ${modelConfig.provider} | Tier: ${modelTier}`);
          const headers: Record<string, string> = {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "x-conversation-id": convId,
            "x-model-used": modelTier,
          };
          if (searchAttempted) {
            headers["x-search-performed"] = "true";
          }
          const geminiSources = searchSources.length > 0 ? searchSources : wikiSources;
          if (geminiSources.length > 0) {
            headers["x-sources"] = encodeURIComponent(JSON.stringify(geminiSources));
          }

          return new Response(stream, { headers });
        }

        // ── Default (OpenAI‑style) branch ──────────
        const aiRes = await fetch(modelConfig.endpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: modelConfig.modelName,
            messages: modelApiMessages,
            temperature: tier.temperature,
            max_tokens: hardCap,
            stream: true,
          }),
        });

        if (!aiRes.ok) {
          const errorText = await aiRes.text();
          console.warn(`❌ LLM Error: ${modelConfig.modelName} (${modelConfig.modelKey}) | API Key: ${modelConfig.apiKeyEnv} | Provider: ${modelConfig.provider} | Error: ${errorText}`);
          lastError = errorText;
          continue;
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        let fullContent = "";

        const stream = new ReadableStream({
          async start(controller) {
            try {
              const reader = aiRes.body?.getReader();
              if (!reader) {
                controller.close();
                return;
              }

              let buffer = "";
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() || "";

                for (const line of lines) {
                  if (!line.startsWith("data: ")) continue;
                  const data = line.slice(6).trim();
                  if (data === "[DONE]") continue;

                  try {
                    const parsed = JSON.parse(data);
                    const content = parsed.choices?.[0]?.delta?.content;
                    if (content) {
                      fullContent += content;
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                    }
                  } catch (e) {
                    // skip invalid JSON
                  }
                }
              }

              // Hard fallback – never send empty response
              if (!fullContent.trim()) {
                const fallbackMsg = "I couldn't generate a response. Please try again.";
                fullContent = fallbackMsg;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: fallbackMsg } }] })}\n\n`));
              }

              // Verify answer if search was used (non-NLive path)
              let finalContent = fullContent;
              if (searchAttempted && !shouldUseNLive && searchSources.length > 0) {
                const sourceUrls = searchSources.map(s => s.url);
                try {
                  finalContent = await verifyAnswer(fullContent, sourceUrls, userMessage);
                  console.log(`✅ Answer verified (${finalContent.length} chars)`);
                } catch (err) {
                  console.warn("Verification failed, using original answer:", err);
                }
              }

              saveMessage(supabase, user.id, convId, "assistant", finalContent).catch(console.error);
              trackChatUsage(user.id, modelTier, finalContent, userMessage).catch(console.error);

              // ── Record token usage (skip NI — handled by per-LLM SQL deduction) ──
              // Use actualModelKeyUsed (the model that actually served the request)
              if (modelTier !== 'ni') {
                const estimatedTokens = Math.ceil((userMessage.length + finalContent.length) / 4);
                const incrementModelKey = (userPlan === 'plus_pro' && actualModelKeyUsed) ? actualModelKeyUsed : null;
                incrementTokenUsage(supabase, user.id, modelTier, estimatedTokens, incrementModelKey || undefined).catch(err =>
                  console.error(`Token usage increment failed for tier ${modelTier}:`, err)
                );
              }

              // Trigger user summary generation (async, non-blocking, Free plan only)
              if (!isTokenBasedTier) {
                getUserTotalMessageCount(supabase, user.id).then(totalMessageCount => {
                  generateUserSummary(user.id, messages, totalMessageCount).catch(console.error);
                }).catch(console.error);
              }

              // Cache the response if cacheable
              if (canUseCache && finalContent.length > 20) {
                setCachedReply(userMessage, finalContent);
              }

              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (error) {
              console.error("Stream error:", error);
              controller.error(error);
            }
          },
        });

        console.log(`✅ LLM Response: ${modelConfig.modelName} (${modelConfig.modelKey}) | API Key: ${modelConfig.apiKeyEnv} | Provider: ${modelConfig.provider} | Tier: ${modelTier} | Content length: ${fullContent.length} chars`);
        const headers: Record<string, string> = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-conversation-id": convId,
          "x-model-used": modelTier,
        };
        if (searchAttempted) {
          headers["x-search-performed"] = "true";
        }
        // Add sources header if available from search (regular or Wikipedia fallback)
        const openaiSources = searchSources.length > 0 ? searchSources : wikiSources;
        const finalSources = openaiSources;
        if (finalSources.length > 0) {
          headers["x-sources"] = encodeURIComponent(JSON.stringify(finalSources));
        }

        return new Response(stream, { headers });
      } catch (fetchError: any) {
        console.warn(`❌ LLM Error: ${modelConfig.modelName} (${modelConfig.modelKey}) | API Key: ${modelConfig.apiKeyEnv} | Error: ${fetchError.message || "Unknown fetch error"}`);
        lastError = fetchError.message || "Unknown fetch error";
      }
    }

    // ── All models exhausted: check if it was due to token limits ──
    // For Plus Pro: check per-model token limits via generic token_usage table
    if (userPlan === 'plus_pro' && routerConfig.perModelTokenLimits) {
      let earliestReset: string | null = null;
      for (const modelConfig of tier.models) {
        if (!modelConfig.modelKey) continue;
        const modelLimitCfg = routerConfig.perModelTokenLimits[modelConfig.modelKey];
        if (modelLimitCfg) {
          const perModelCheck = await checkTokenLimits(
            supabase,
            user.id,
            modelTier,
            modelLimitCfg.daily,
            modelLimitCfg.monthly,
            modelConfig.modelKey
          );
          if (!perModelCheck.allowed) {
            const resetTime = perModelCheck.dailyResetAt || perModelCheck.monthlyResetAt;
            if (resetTime && (!earliestReset || new Date(resetTime) < new Date(earliestReset))) {
              earliestReset = resetTime;
            }
          }
        }
      }
      if (earliestReset) {
        console.log(`🚫 All models exhausted for ${userPlan} plan. Earliest reset: ${earliestReset}`);
        return NextResponse.json(
          {
            error: `You've reached the limit for all available models. Your access will reset soon.`,
            limitReached: true,
            allModelsExhausted: true,
            resetsAt: earliestReset,
          },
          { status: 429 }
        );
      }
    }

    // For Pro (NI tier): check per-LLM SQL limits (ni_token_usage + gpt5_token_usage)
    if (userPlan === 'pro' && modelTier === 'ni') {
      const niModels = ['claude-opus-4.6', 'claude-sonnet-4.6', 'deepseek-v4-pro'];
      const gpt5Models = ['gpt-5', 'gpt-5-mini'];
      let earliestReset: string | null = null;
      let exhaustedCount = 0;

      for (const modelType of niModels) {
        const { data } = await supabase.rpc('get_or_reset_ni_token_usage', {
          p_user_id: user.id, p_model_type: modelType,
        });
        const remaining = data?.[0]?.remaining_tokens ?? 0;
        if (remaining <= 0) {
          exhaustedCount++;
          const lastReset = data?.[0]?.last_reset_at;
          if (lastReset) {
            const resetAt = new Date(new Date(lastReset).getTime() + 24 * 60 * 60 * 1000).toISOString();
            if (!earliestReset || new Date(resetAt) < new Date(earliestReset)) {
              earliestReset = resetAt;
            }
          }
        }
      }
      for (const modelType of gpt5Models) {
        const { data } = await supabase.rpc('get_or_reset_gpt5_token_usage', {
          p_user_id: user.id, p_model_type: modelType,
        });
        const remaining = data?.[0]?.remaining_tokens ?? 0;
        if (remaining <= 0) {
          exhaustedCount++;
          const lastReset = data?.[0]?.last_reset_at;
          if (lastReset) {
            const resetAt = new Date(new Date(lastReset).getTime() + 24 * 60 * 60 * 1000).toISOString();
            if (!earliestReset || new Date(resetAt) < new Date(earliestReset)) {
              earliestReset = resetAt;
            }
          }
        }
      }

      const totalTracked = niModels.length + gpt5Models.length;
      if (exhaustedCount === totalTracked && earliestReset) {
        console.log(`🚫 All NI models exhausted for Pro plan. Earliest reset: ${earliestReset}`);
        return NextResponse.json(
          {
            error: `You've reached the limit for all available models. Your access will reset soon.`,
            limitReached: true,
            allModelsExhausted: true,
            resetsAt: earliestReset,
          },
          { status: 429 }
        );
      }
    }

    console.error("All models failed. Last error:", lastError);
    return NextResponse.json(
      { error: `All models failed. Last error: ${lastError}` },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status: 500 }
    );
  }
}