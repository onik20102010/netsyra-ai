// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createChatServerClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { aaiRuntime } from "@/lib/chat/aai";
import { tiers } from "@/lib/chat/model-registry";
import { classifyIntent } from "@/lib/intent-classifier";
import { getWeatherData, getCurrentTimeAndLocation, detectUserRegion, extractMentionedCity } from "@/lib/time-utils";
import { getCurrentTimeCard, getCurrentCalendarCard, fetchTimeData } from "@/lib/chat/services/real-time";
import { performNLiveSearch } from "@/lib/chat/services/live-data";
import { getRouterConfig } from "@/lib/routers/router-factory";
import FirecrawlApp from "@mendable/firecrawl-js";
import { safeFetch } from "@/lib/safe-fetch";
import { getUserSummary, generateUserSummary, shouldUseUserSummary } from "@/lib/chat/user-summary";
import { routeModel } from "@/lib/chat/router";
import { checkCache, storeInCache } from "@/lib/chat/semantic-cache";
import { getSystemPrompt } from "@/lib/chat/model-registry";
import { trimContextByTokens } from "@/lib/chat/token-counter";
import { executeWebSearch } from "@/lib/chat/tools/execute-web-search";
import { compressHistory } from "@/lib/chat/context-compression";
import { getCachedReply, setCachedReply } from "@/lib/scale";
import { verifyAnswer } from "@/lib/verifier";
import { analyzeTask, routeTask, getRoutingExplanation } from "@/lib/chat/ni-router";
import { incrementTokenUsage, goPlusTokenLimits, plusProTokenLimits, proTokenLimits } from "@/lib/chat/token-usage";
import { checkWebSearchLimit, recordWebSearch, checkDiveDeepLimit, recordDiveDeep } from "@/lib/chat/web-search-limiter";
import { evaluateLimits } from "@/lib/chat/brain-router";

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

/**
 * Increment token usage after a successful LLM call.
 * Estimates tokens from content length (~4 chars/token).
 * Only increments for token-based tiers (go_plus, ni, plus_pro).
 */
async function incrementTokensForResponse(
  supabase: any,
  userId: string,
  userPlan: string,
  modelTier: string,
  modelKey: string | null,
  modelName: string | null,
  content: string
): Promise<void> {
  // Rough token estimate: ~4 chars per token
  const estimatedTokens = Math.max(1, Math.ceil(content.length / 4));

  try {
    if (userPlan === "go_plus" && modelTier === "go_plus") {
      await incrementTokenUsage(supabase, userId, "go_plus", estimatedTokens, goPlusTokenLimits);
      console.log(`📊 Token usage incremented: go_plus +${estimatedTokens} tokens`);
    } else if (userPlan === "plus_pro" && modelTier === "plus_pro" && modelKey) {
      const limits = plusProTokenLimits[modelKey];
      if (limits) {
        await incrementTokenUsage(supabase, userId, modelKey, estimatedTokens, limits);
        console.log(`📊 Token usage incremented: ${modelKey} +${estimatedTokens} tokens`);
      }
    } else if (userPlan === "pro" && modelTier === "ni" && modelName) {
      const proLimits = proTokenLimits[modelName];
      if (proLimits) {
        await incrementTokenUsage(supabase, userId, modelName, estimatedTokens, proLimits);
        console.log(`📊 NI token usage incremented: ${modelName} +${estimatedTokens} tokens`);
      }
    }
  } catch (err) {
    console.warn(`⚠️ Failed to increment token usage:`, err);
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

    // Chat-schema client for limit enforcement (tables + RPCs live in chat schema)
    const chatSupabase = await createChatServerClient();

    // Detect user timezone from request headers
    const userTimezone = req.headers.get('x-user-timezone') || 
                        req.headers.get('timezone') || 
                        Intl.DateTimeFormat().resolvedOptions().timeZone;

    // ── Weather location resolver ──
    // If the user mentions a city → use it (no detection).
    // If not → auto-detect the user's region via IP geolocation (fallback: timezone).
    async function resolveWeatherLocation(message: string): Promise<{ city: string; detected: boolean }> {
      const mentioned = extractMentionedCity(message);
      if (mentioned) {
        return { city: mentioned, detected: false };
      }
      const region = await detectUserRegion(req, userTimezone);
      return { city: region.city, detected: true };
    }

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
    // Patterns are strictly anchored and length-limited to prevent false positives
    // on long questions that merely contain weather/time/date keywords.
    const _msg = userMessage.trim();
    const _isShortQuery = _msg.length <= 80; // simple widget queries are short
    const isWeatherQuery = _isShortQuery && /^(\b(what'?s the |how'?s the |current )?weather\b|\b(outdoor )?temperature\b(\s+(outside|right now|today))?$|what'?s the temperature|how (hot|cold) is it)/i.test(_msg);
    const isTimeQuery = _isShortQuery && /^(\b(what( i|')?s the |current )?time\b(\s+(is it|now|right now))?$|what time is it)/i.test(_msg);
    const isDateQuery = _isShortQuery && /^(\b(what( i|')?s (the )?date\b|today'?s date\b|what day is it(\s+today)?\b|what'?s today\b|date\b$))/i.test(_msg);
    const isWidgetQuery = isWeatherQuery || isTimeQuery || isDateQuery;

    // ── Dive Deep (no limits) ──
    const diveDeepActive = diveDeep && !isGreeting;
    const shouldUseNLive = diveDeepActive;

    // ── Web search: only when user toggles the button ──
    // No auto web search — user must explicitly enable it.

    // ── For Plus Pro, select model based on complexity (no token limits) ──
    let selectedModelKey = modelTier;
    if (userPlan === 'plus_pro' && routerConfig.perModelTokenLimits) {
      // Simple complexity-based selection: coding → opus, reasoning → luna, default → deepseek
      const isCodingTask = /\b(code|function|bug|fix|implement|refactor|debug|api|class|method)\b/i.test(userMessage);
      const isReasoningTask = /\b(why|explain|analyze|compare|design|architecture|plan|strategy)\b/i.test(userMessage);
      if (isCodingTask) {
        selectedModelKey = 'plus_pro_opus';
      } else if (isReasoningTask) {
        selectedModelKey = 'plus_pro_luna';
      } else {
        selectedModelKey = 'plus_pro_deepseek';
      }
      console.log(`🎯 Plus Pro model selected: ${selectedModelKey}`);
    }

    // ── Check if user's plan allows the requested model tier ──
    if (!routerConfig.allowedModelKeys.includes(modelTier)) {
      return NextResponse.json(
        { error: `The ${modelTier} tier is not available on your plan. Upgrade to access it.` },
        { status: 403 }
      );
    }

    // ── BRAIN ROUTER: unified limit check for Free / Go Plus / Plus Pro ──
    // The brain router detects plan → model tier → LLM model → limits → user UUID
    // → usage, then decides whether to proceed. For paid plans with fallback,
    // it automatically shifts to the next available model if the requested one
    // is out of tokens.
    // Pro (NI) is handled AFTER the NI router picks the LLM model (below).
    if (userPlan === "free" || (userPlan === "go_plus" && modelTier === "go_plus") || (userPlan === "plus_pro" && modelTier === "plus_pro")) {
      const brainResult = await evaluateLimits(
        chatSupabase,
        user.id,
        user.email || user.id,
        userPlan,
        modelTier,
        selectedModelKey,
        null // NI model name — not applicable here
      );

      if (!brainResult.allowed) {
        console.log(`🚫 Brain Router BLOCKED: ${brainResult.reason}`);
        return NextResponse.json(
          {
            error: brainResult.clientError || "You've reached your usage limit. Please try again later or upgrade for more access.",
            limitReached: true,
            resetsAt: brainResult.resetsAt,
            dailyResetAt: brainResult.dailyResetAt,
            monthlyResetAt: brainResult.monthlyResetAt,
          },
          { status: brainResult.statusCode }
        );
      }

      // ── Fallback: brain router shifted to a different model ──
      if (brainResult.fallbackUsed && brainResult.modelKey) {
        console.log(`� Brain Router fallback: ${brainResult.fallbackFrom} → ${brainResult.modelKey}`);
        // Update selectedModelKey so the model loop prioritizes the fallback model
        selectedModelKey = brainResult.modelKey;
      }

      console.log(`🧠 Brain Router: ${brainResult.reason}`);
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

    // ── NI Router: Determine actual model for NI tier (no token limits) ──
    let niModelRoute: any = null;
    if (modelTier === "ni") {
      const taskAnalysis = await analyzeTask(userMessage, {
        codeLength: messages.length * 50,
        fileCount: 1,
        conversationHistoryLength: messages.length,
      });

      // No token limits — pass undefined so routeTask picks the best model
      niModelRoute = routeTask(taskAnalysis);
      console.log(`🧠 NI Router: ${getRoutingExplanation(niModelRoute)} (confidence: ${taskAnalysis.confidence})`);

      // ── BRAIN ROUTER: Pro (NI) per-LLM token limit check with fallback ──
      // The brain router checks if the NI router's chosen LLM has tokens
      // remaining. If not, it automatically shifts to the next available LLM
      // in the fallback chain (e.g. claude-opus-4.6 → claude-sonnet-4.6 → ...).
      if (userPlan === "pro") {
        const brainResult = await evaluateLimits(
          chatSupabase,
          user.id,
          user.email || user.id,
          userPlan,
          "ni",
          null,
          niModelRoute.model
        );

        if (!brainResult.allowed) {
          console.log(`🚫 Brain Router BLOCKED (NI): ${brainResult.reason}`);
          return NextResponse.json(
            {
              error: brainResult.clientError || "You've reached the token limit for all available models. Your quota resets daily and monthly.",
              limitReached: true,
              dailyResetAt: brainResult.dailyResetAt,
              monthlyResetAt: brainResult.monthlyResetAt,
            },
            { status: brainResult.statusCode }
          );
        }

        // ── Fallback: brain router shifted to a different LLM ──
        if (brainResult.fallbackUsed && brainResult.modelName) {
          console.log(`🔄 Brain Router NI fallback: ${brainResult.fallbackFrom} → ${brainResult.modelName}`);
          // Update niModelRoute so the model loop uses the fallback LLM
          niModelRoute = { ...niModelRoute, model: brainResult.modelName };
        }

        console.log(`🧠 Brain Router (NI): ${brainResult.reason}`);
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
        const { city: weatherCity, detected: weatherDetected } = await resolveWeatherLocation(userMessage);
        const weatherData = await getWeatherData(weatherCity, undefined, { detected: weatherDetected });
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
              formattedTime: timeData.formattedTime,
              formattedDate: timeData.formattedDate,
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
            // N Pro: Format as widget — detect calendar system from user's timezone
            const { detectCalendar } = await import("@/lib/chat/calendar-detector");
            const calInfo = detectCalendar(timeData.timezone);
            const calData = {
              utcDatetime: timeData.utcDatetime,
              timezone: timeData.timezone,
              label: timeData.label,
              formattedDate: timeData.formattedDate,
              calendar: calInfo.primary,
              calendarLabel: calInfo.primaryLabel,
              showGregorian: calInfo.showGregorian,
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
            const { city: weatherCity, detected: weatherDetected } = await resolveWeatherLocation(userMessage);
            const weatherData = await getWeatherData(weatherCity, undefined, { detected: weatherDetected });
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
            const { city: weatherCity, detected: weatherDetected } = await resolveWeatherLocation(userMessage);
            const weatherData = await getWeatherData(weatherCity, undefined, { detected: weatherDetected });
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
            const { city: weatherCity, detected: weatherDetected } = await resolveWeatherLocation(userMessage);
            const weatherData = await getWeatherData(weatherCity, undefined, { detected: weatherDetected });
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
          const { city: weatherCity, detected: weatherDetected } = await resolveWeatherLocation(userMessage);
          const weatherData = await getWeatherData(weatherCity, undefined, { detected: weatherDetected });
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
          const { city: weatherCity, detected: weatherDetected } = await resolveWeatherLocation(userMessage);
          const weatherData = await getWeatherData(weatherCity, undefined, { detected: weatherDetected });
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

      // ── Dive deep limit check (24h sliding window) ──
      const diveDeepCheck = await checkDiveDeepLimit(
        chatSupabase, user.id, routerConfig.diveDeepDailyLimit, routerConfig.diveDeepLimitHours
      );
      if (!diveDeepCheck.allowed) {
        console.log(`🚫 Dive deep limit reached: ${diveDeepCheck.used}/${routerConfig.diveDeepDailyLimit}`);
        return NextResponse.json(
          {
            error: `You've reached your daily Dive Deep limit (${routerConfig.diveDeepDailyLimit} per 24 hours). Try again later or upgrade for more.`,
            limitReached: true,
            used: diveDeepCheck.used,
            limit: routerConfig.diveDeepDailyLimit,
          },
          { status: 429 }
        );
      }

      const searchResult = await performNLiveSearch(cleanQ);

      // Record the dive deep action after success
      if (searchResult.answer || searchResult.useLLM) {
        await recordDiveDeep(chatSupabase, user.id).catch(console.error);
      }

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

    // ── Web Search (only when user toggles the button) ──
    // No auto web search — only explicit user toggle triggers search.
    // N Live has its own search pipeline, so skip when shouldUseNLive is true.
    const shouldPerformWebSearch = webSearchEnabled && !shouldUseNLive && !isWidgetQuery;
    if (shouldPerformWebSearch) {
      // ── Web search limit check (24h sliding window) ──
      const wsLimitCheck = await checkWebSearchLimit(
        chatSupabase, user.id, "web_search", routerConfig.webSearchDailyLimit, routerConfig.webSearchLimitHours
      );
      if (!wsLimitCheck.allowed) {
        console.log(`🚫 Web search limit reached: ${wsLimitCheck.used}/${routerConfig.webSearchDailyLimit}`);
        // Don't block the chat — just skip the search and inform via console
        console.log(`⚠️ Web search skipped due to limit. Proceeding without search results.`);
      } else {
        console.log(`🔍 Web search triggered by user button — performing search for: "${userMessage.slice(0, 80)}"`);
        try {
          const { result: searchResult, sources: webSources } = await executeWebSearch({
            query: userMessage,
            userId: user.id,
            isPaidUser,
          });

          if (searchResult && !searchResult.includes("limit reached") && !searchResult.includes("Failed to perform") && searchResult !== "No search results found.") {
            searchAttempted = true;
            if (webSources.length > 0) {
              searchSources = webSources;
            }
            apiMessages[0].content += `\n\n--- WEB SEARCH RESULTS ---\n${searchResult}\n\nIMPORTANT: You have been provided with web search results above. Use this information to answer the user's question. Cite sources when relevant. Do NOT repeat the search results verbatim — synthesize and build upon them.`;
            console.log(`✅ Web search results injected (${searchResult.length} chars, ${webSources.length} sources)`);

            // Record the web search action after success
            await recordWebSearch(chatSupabase, user.id, "web_search").catch(console.error);
          } else {
            console.log(`⚠️ Web search skipped: ${searchResult?.slice(0, 100)}`);
          }
        } catch (searchError) {
          console.warn(`⚠️ Web search failed:`, searchError);
        }
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

      // Track which model is actually being used
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

          // Increment token usage for token-based tiers
          if (isTokenBasedTier) {
            incrementTokensForResponse(chatSupabase, user.id, userPlan, modelTier, actualModelKeyUsed, modelConfig.modelName, finalContent).catch(console.error);
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

                // Increment token usage for token-based tiers
                if (isTokenBasedTier) {
                  incrementTokensForResponse(chatSupabase, user.id, userPlan, modelTier, actualModelKeyUsed, modelConfig.modelName, finalContent).catch(console.error);
                }

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

              // Increment token usage for token-based tiers
              if (isTokenBasedTier) {
                incrementTokensForResponse(chatSupabase, user.id, userPlan, modelTier, actualModelKeyUsed, modelConfig.modelName, finalContent).catch(console.error);
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