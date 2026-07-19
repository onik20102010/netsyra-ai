// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { aaiRuntime } from "@/lib/chat/aai";
import { tiers } from "@/lib/chat/model-registry";
import { classifyIntent } from "@/lib/intent-classifier";
import { getWeather, getCurrentTimeCard, getCurrentCalendarCard } from "@/lib/chat/services/real-time";
import { performDeepSearch, performMultiDeepSearch, performNLiveSearch } from "@/lib/chat/services/live-data";
import FirecrawlApp from "@mendable/firecrawl-js";
import { cleanSearchQueries } from "@/lib/chat/services/query-cleaner";
import { safeFetch } from "@/lib/safe-fetch";
import { checkAndUpdateUsage, MODEL_LIMITS } from "@/lib/chat/usage";
import { getUserMemorySummary, generateMemorySummary } from "@/lib/chat/memory";
import { routeModel } from "@/lib/chat/router";
import { compressHistory } from "@/lib/chat/context-compression";

// ── DB helpers ──────────────────────────────
async function createConversation(supabase: any, userId: string, id: string, title?: string) {
  const { error } = await supabase.from("conversations").insert({
    id,
    user_id: userId,
    title: title?.slice(0, 100) || "New conversation",
  });
  if (error) {
    console.error("Failed to create conversation:", error);
    throw new Error(`Failed to create conversation: ${error.message}`);
  }
}

async function saveMessage(supabase: any, userId: string, conversationId: string, role: string, content: string) {
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
}

async function getUserTotalMessageCount(supabase: any, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return error ? 0 : (count || 0);
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
    } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Missing messages" }, { status: 400 });
    }

    for (const msg of messages) {
      const lines = (msg.content || "").split("\n");
      if (lines.length > 80) {
        return NextResponse.json(
          { error: "Message exceeds 80 lines. Please shorten it." },
          { status: 400 }
        );
      }
    }

    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content;
    const convId = conversationId || crypto.randomUUID();

    // ── Auto-router: resolve "auto" to a concrete tier (manual tiers pass through) ──
    let modelTier: string = requestedTier;
    if (requestedTier === "auto") {
      const routed = routeModel(userMessage, { historyLength: messages.length });
      modelTier = routed.tier;
      console.log(`🧭 Auto-router: "${userMessage.slice(0, 60)}" → N ${modelTier} (${routed.reason})`);
    }

    // N Live activation conditions
    const isGreeting = /^(hi|hello|hey|sup|yo|ok|okay|thanks|thank you|bye|goodbye)[\s!.]*$/i.test(userMessage.trim());
    const shouldUseNLive = diveDeep && !isGreeting;

    // Detect if query needs web search (latest/current information)
    function needsWebSearch(query: string): boolean {
      const lowerQuery = query.toLowerCase();
      
      // Keywords indicating need for current information
      const timeSensitiveKeywords = [
        'latest', 'new', 'recent', 'current', 'today', 'now', 'yesterday', 'tomorrow',
        'price', 'cost', 'stock', 'market', 'rate', 'value', 'expensive', 'cheap', 'discount', 'sale', 'deal',
        'news', 'update', 'breaking', 'headline', 'trending', 'viral', 'announcement',
        'weather', 'forecast', 'temperature', 'rain', 'snow', 'wind', 'humidity',
        'time', 'date', 'what time', 'what date', 'when', 'schedule', 'calendar',
        'what happened', 'recently', 'this year', 'this month', 'this week', 'this day',
        'review', 'rating', 'best', 'top', 'vs', 'versus', 'compare', 'comparison',
        'upcoming', 'scheduled', 'release', 'launch', 'event', 'concert', 'movie',
        'status', 'is open', 'is closed', 'available', 'in stock', 'out of stock',
        'live', 'streaming', 'broadcast', 'on air', 'right now',
        'score', 'result', 'winner', 'final', 'match', 'game', 'tournament',
        'election', 'vote', 'poll', 'campaign', 'candidate',
        'crypto', 'bitcoin', 'ethereum', 'nft', 'blockchain', 'trading',
        'technology', 'tech', 'startup', 'funding', 'ipo', 'acquisition',
        'sports', 'nba', 'nfl', 'mlb', 'soccer', 'football', 'cricket',
        'celebrity', 'actor', 'singer', 'artist', 'influencer',
        'product', 'buy', 'purchase', 'order', 'delivery', 'shipping',
        'website', 'online', 'app', 'software', 'update', 'version',
        'scam', 'legit', 'safe', 'trust', 'verified', 'authentic',
        'location', 'near me', 'around me', 'closest', 'nearest',
        'flight', 'airport', 'delay', 'cancel', 'booking',
        'hotel', 'restaurant', 'reservation', 'booked',
        'traffic', 'accident', 'road', 'highway', 'route',
        'covid', 'pandemic', 'health', 'symptoms', 'treatment',
        'policy', 'law', 'regulation', 'rule', 'government',
        'trend', 'popular', 'famous', 'viral', 'hot',
      ];
      
      // Check for time-sensitive keywords
      if (timeSensitiveKeywords.some(keyword => lowerQuery.includes(keyword))) {
        return true;
      }
      
      // Check for specific patterns
      const patterns = [
        /\d{4}/, // Years (2024, 2025, etc.)
        /\$\d+/, // Prices
        /how many/i,
        /how much/i,
        /where to buy/i,
        /is it safe/i,
        /is it legit/i,
        /scam/i,
        /easygetstore/i, // Specific example from user
      ];
      
      if (patterns.some(pattern => pattern.test(query))) {
        return true;
      }
      
      return false;
    }

    // Query needs current information (decoupled from N Live — both paths may search)
    const needsSearch = needsWebSearch(userMessage);
    
    // Clean the query using multi‑query extraction for N Live
    const queries = needsSearch ? await cleanSearchQueries(userMessage) : [userMessage];
    if (needsSearch && queries.length > 0) {
      console.log(`🧹 Cleaned queries: "${userMessage}" → [${queries.join(", ")}]`);
    }

    const shouldSearch = needsSearch;

    // ── Intent classification ─────────────────
    const intent = await classifyIntent(userMessage);

    const usageCheck = await checkAndUpdateUsage(supabase, user.id, modelTier);
    if (!usageCheck.allowed) {
      const resetTime = new Date(usageCheck.resetAt);
      const timeLeftMs = resetTime.getTime() - Date.now();
      const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
      return NextResponse.json(
        { error: `You've used all ${MODEL_LIMITS[modelTier]} ${modelTier} messages. Resets in ${hours}h ${minutes}m.`, remaining: 0, resetAt: usageCheck.resetAt },
        { status: 429 }
      );
    }

    if (newConversation || !conversationId) {
      await createConversation(supabase, user.id, convId, userMessage);
    }

    await saveMessage(supabase, user.id, convId, "user", userMessage);

    // ── Fetch user memory summary ──
    const memorySummary = await getUserMemorySummary(user.id);

    // ── Fetch user profile (used by both branches) ──
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, goal, custom_instructions")
      .eq("user_id", user.id)
      .single();

    let profileNote = "";
    if (profile) {
      const parts = [];
      if (profile.name) parts.push(`User name: ${profile.name}`);
      if (profile.goal) parts.push(`User goal: ${profile.goal}`);
      if (profile.custom_instructions) parts.push(`User instructions: ${profile.custom_instructions}`);
      if (parts.length > 0) {
        profileNote = parts.join("\n");
      }
    }

    // Add memory summary to profile note if available
    if (memorySummary) {
      profileNote += `\n\n--- USER MEMORY SUMMARY ---\n${memorySummary}`;
    }

    // Flag for response header
    let searchAttempted = false;

    // Fetch persona notes once (used by both branches)
    const { data: personaNotes } = await supabase
      .from("bot_persona_notes")
      .select("note")
      .eq("user_id", user.id);
    let personaNoteText = "";
    if (personaNotes && personaNotes.length > 0) {
      personaNoteText = personaNotes.map((n: any) => `- ${n.note}`).join("\n");
    }

    // ── AAI branch ─────────────────────────────
    if (modelTier === "aai") {
      const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role,
        content: m.content,
        id: m.id,
        timestamp: Date.now(),
      }));

      // Only N Pro can generate widgets
      const canUseWidgets = false; // AAI doesn't support widgets

      let liveData = "";
      if (shouldSearch) {
        searchAttempted = true;

        // Widget queries – use exact whole-question patterns to avoid false positives (N Pro only)
        const isWeatherQuery = /^(what'?s the )?weather|temperature|rain|forecast/i.test(userMessage.trim());
        const isTimeQuery = /^(what( i|')?s the )?time|clock/i.test(userMessage.trim());
        const isDateQuery = /^(what( i|')?s (the )?date|today'?s date|what day)/i.test(userMessage.trim());

        const isWidgetQuery = isWeatherQuery || isTimeQuery || isDateQuery;

        if (isWidgetQuery && canUseWidgets) {
          if (isWeatherQuery) {
            const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
            liveData = await getWeather(cityMatch?.[1]?.trim() || "Lahore");
          } else if (isTimeQuery) {
            liveData = await getCurrentTimeCard(undefined, userTimezone);
          } else if (isDateQuery) {
            liveData = await getCurrentCalendarCard(undefined, userTimezone);
          }
        } else if (isWidgetQuery && !canUseWidgets) {
          // For non-Pro tiers, perform web search instead of widget generation
          const cleanQ = userMessage.trim();
          liveData = await performDeepSearch(cleanQ);
          if (!liveData) {
            liveData = `\n\n--- SEARCH RESULT ---\nNo reliable information found. Please try again later.`;
          }
          console.log(`✅ Search results obtained for non-Pro widget query (${liveData.length} chars)`);
        } else {
          // Universal web search – multi‑query or single
          if (queries.length > 1) {
            console.log(`🔬 Multi‑query detected: ${queries.join(", ")}`);
            liveData = await performMultiDeepSearch(queries);
          } else {
            const cleanQ = queries[0] || userMessage;
            liveData = await performDeepSearch(cleanQ);
          }
          if (!liveData) {
            liveData = `\n\n--- SEARCH RESULT ---\nNo reliable information found. Please try again later.`;
          }
          console.log(`✅ Search results obtained (${liveData.length} chars)`);
        }
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

      // Trigger memory summary generation (async, non-blocking)
      const totalMessageCount = await getUserTotalMessageCount(supabase, user.id);
      generateMemorySummary(user.id, messages, totalMessageCount).catch(console.error);

      const encoder = new TextEncoder();
      const words = replyText.split(" ");
      const stream = new ReadableStream({
        async start(controller) {
          for (const word of words) {
            const chunk = { choices: [{ delta: { content: word + " " } }] };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            await new Promise(r => setTimeout(r, 10));
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
    const { recent: recentMessages, summary: rollingSummary } = await compressHistory(
      messages.map((m: any) => ({ role: m.role, content: m.content }))
    );

    // Build messages array with system prompt
    const apiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: tier.systemPrompt },
      ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
    ];

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

    // ── AI‑routed live‑data injection ──
    let liveData = "";
    let searchSources: { title: string; url: string }[] = [];
    let searchPlatform = "";
    // Only N Pro can generate widgets
    const canUseWidgets = modelTier === "pro";
    
    // Non-N-Live search path: inject results into LLM prompt (N Live has its own pipeline below)
    if (shouldSearch && !shouldUseNLive) {
      searchAttempted = true;

      // Widget queries – use exact whole-question patterns to avoid false positives (N Pro only)
      const isWeatherQuery = /^(what'?s the )?weather|temperature|rain|forecast/i.test(userMessage.trim());
      const isTimeQuery = /^(what( i|')?s the )?time|clock/i.test(userMessage.trim());
      const isDateQuery = /^(what( i|')?s (the )?date|today'?s date|what day)/i.test(userMessage.trim());

      const isWidgetQuery = isWeatherQuery || isTimeQuery || isDateQuery;

      if (isWidgetQuery && canUseWidgets) {
        if (isWeatherQuery) {
          const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
          liveData = await getWeather(cityMatch?.[1]?.trim() || "Lahore");
        } else if (isTimeQuery) {
          liveData = await getCurrentTimeCard(undefined, userTimezone);
        } else if (isDateQuery) {
          liveData = await getCurrentCalendarCard(undefined, userTimezone);
        }
      } else if (isWidgetQuery && !canUseWidgets) {
        // For non-Pro tiers, perform web search instead of widget generation
        const cleanQ = userMessage.trim();
        const searchResult = await performNLiveSearch(cleanQ);
        if (searchResult.answer) {
          liveData = searchResult.answer;
          searchSources = searchResult.sources;
          searchPlatform = searchResult.platform;
        }
        if (!liveData) {
          liveData = `No reliable information found. Please try again later.`;
        }
        console.log(`✅ Search results obtained for non-Pro widget query (${liveData.length} chars)`);
      } else {
        // Universal web search – multi‑query or single
        if (queries.length > 1) {
          console.log(`🔬 Multi‑query detected: ${queries.join(", ")}`);
          const results = await Promise.all(queries.map(q => performNLiveSearch(q)));
          const validResults = results.filter(r => r.answer);
          if (validResults.length > 0) {
            liveData = validResults.map((r, i) => r.answer).join("\n\n");
            searchSources = validResults.flatMap(r => r.sources);
            searchPlatform = validResults[0].platform;
          }
        } else {
          const cleanQ = queries[0] || userMessage;
          const searchResult = await performNLiveSearch(cleanQ);
          if (searchResult.answer) {
            liveData = searchResult.answer;
            searchSources = searchResult.sources;
            searchPlatform = searchResult.platform;
          }
        }
        if (!liveData) {
          liveData = `No reliable information found. Please try again later.`;
        }
        console.log(`✅ Search results obtained (${liveData.length} chars) from ${searchPlatform}`);
      }

      if (liveData) {
        // For regular models, format search results as italic block and instruct LLM to expand
        const italicSearch = `*${liveData}*`;
        apiMessages[0].content += `\n\n--- WEB SEARCH RESULTS (italic block below) ---\n${italicSearch}\n\nIMPORTANT: You have been provided with web search results above in an italic block. Your job is to:\n1. Acknowledge the search results\n2. Explain and expand on the information\n3. Add your own insights and context\n4. Cover related aspects the user might find useful\n5. Make it comprehensive and helpful\nDo NOT repeat the search results verbatim. Instead, build upon them.`;
      }
    }

    // ── N Live Pipeline: Direct streaming without LLM ──
    let wikiSources: { title: string; url: string }[] = [];
    if (shouldSearch && shouldUseNLive) {
      searchAttempted = true;

      // Check for widget queries (N Pro only)
      const isWeatherQuery = /^(what'?s the )?weather|temperature|rain|forecast/i.test(userMessage.trim());
      const isTimeQuery = /^(what( i|')?s the )?time|clock/i.test(userMessage.trim());
      const isDateQuery = /^(what( i|')?s (the )?date|today'?s date|what day)/i.test(userMessage.trim());
      const isWidgetQuery = isWeatherQuery || isTimeQuery || isDateQuery;
      const canUseWidgets = modelTier === "pro";

      let widgetData = "";
      let searchQuery = queries[0] || userMessage;

      // Handle mixed queries: extract non-widget part for search
      if (isWidgetQuery && canUseWidgets) {
        // Extract the non-widget part of the query
        if (isWeatherQuery) {
          const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
          widgetData = await getWeather(cityMatch?.[1]?.trim() || "Lahore");
          // Remove weather part from query for web search
          searchQuery = userMessage.replace(/weather|temperature|rain|forecast|in\s+[A-Za-z\s]+/gi, "").trim();
        } else if (isTimeQuery) {
          widgetData = await getCurrentTimeCard(undefined, userTimezone);
          searchQuery = userMessage.replace(/what( i|')?s the \)?time|clock/gi, "").trim();
        } else if (isDateQuery) {
          widgetData = await getCurrentCalendarCard(undefined, userTimezone);
          searchQuery = userMessage.replace(/what( i|')?s (the )?date|today'?s date|what day/gi, "").trim();
        }
      }

      // Perform N Live search
      const cleanQ = searchQuery.length > 3 ? searchQuery : queries[0] || userMessage;
      const searchResult = await performNLiveSearch(cleanQ);

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
              await new Promise(r => setTimeout(r, 10));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });

        await saveMessage(supabase, user.id, convId, "assistant", fullResponse);

        const totalMessageCount = await getUserTotalMessageCount(supabase, user.id);
        generateMemorySummary(user.id, messages, totalMessageCount).catch(console.error);

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
              await new Promise(r => setTimeout(r, 10));
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          },
        });

        await saveMessage(supabase, user.id, convId, "assistant", errorMessage);

        const totalMessageCount = await getUserTotalMessageCount(supabase, user.id);
        generateMemorySummary(user.id, messages, totalMessageCount).catch(console.error);

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
    if (modelTier !== "live") {
      const HARD_RESPONSE_TOKENS = 300;
      const systemTokens = Math.ceil(apiMessages[0].content.length / 4);
      const availableTokens = tier.maxTokens - systemTokens;
      if (availableTokens < HARD_RESPONSE_TOKENS) {
        apiMessages[0].content = apiMessages[0].content.slice(0, (tier.maxTokens - HARD_RESPONSE_TOKENS) * 4);
        console.log(`✂️ System prompt trimmed to ${apiMessages[0].content.length} chars (${tier.maxTokens - HARD_RESPONSE_TOKENS} tokens for reply)`);
      }
    }

    let lastError: string | null = null;

    for (const modelConfig of tier.models) {
      console.log(`🤖 Using model: ${modelConfig.modelName} (${modelConfig.modelKey})`);
      let apiKey = process.env[modelConfig.apiKeyEnv];
      // Use fallback key if primary is missing or we're on the fallback model
      if (!apiKey || modelConfig.modelKey === "live_fallback" || modelConfig.modelKey === "aai_fallback") {
        apiKey = process.env.GROQ_API_KEY_4 || process.env[modelConfig.apiKeyEnv];
      }
      if (!apiKey) {
        lastError = `Missing API key for ${modelConfig.modelKey}`;
        continue;
      }

      // Modest headroom above the target so replies finish cleanly without
      // allowing a full 2× budget overrun.
      const hardCap = Math.max(Math.ceil(tier.maxTokens * 1.3), 512);

      // Token budget log only for non‑live tiers
      if (modelTier !== "live") {
        const remainingTokens = tier.maxTokens - Math.ceil(apiMessages[0].content.length / 4);
        console.log(`📊 Token budget: ${tier.maxTokens} total, ~${Math.ceil(apiMessages[0].content.length / 4)} for system, ${remainingTokens} remaining for reply`);
      }

      try {
        // ── Gemini branch (true SSE streaming) ────
        if (modelConfig.provider === "gemini") {
          const streamEndpoint = modelConfig.endpoint.replace(":generateContent", ":streamGenerateContent");
          const geminiUrl = `${streamEndpoint}?alt=sse&key=${apiKey}`;
          const systemMessages = apiMessages.filter(m => m.role === "system");
          const otherMessages = apiMessages.filter(m => m.role !== "system");

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
            console.warn(`Gemini model ${modelConfig.modelName} failed:`, errorText);
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
                        // Re-emit in OpenAI delta format the frontend expects.
                        const chunk = { choices: [{ delta: { content: text } }] };
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
                      }
                    } catch {
                      // skip invalid JSON
                    }
                  }
                }

                // Hard fallback – never send empty response
                if (!fullContent.trim()) {
                  fullContent = "I searched the web but couldn't retrieve the full information. Please try again.";
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: fullContent } }] })}\n\n`));
                }

                saveMessage(supabase, user.id, convId, "assistant", fullContent).catch(console.error);
                getUserTotalMessageCount(supabase, user.id).then(totalMessageCount => {
                  generateMemorySummary(user.id, messages, totalMessageCount).catch(console.error);
                }).catch(console.error);

                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                controller.close();
              } catch (error) {
                console.error("Gemini stream error:", error);
                controller.error(error);
              }
            },
          });

          console.log(`✅ Model succeeded: ${modelConfig.modelName} (${modelConfig.modelKey})`);
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
            messages: apiMessages,
            temperature: tier.temperature,
            max_tokens: hardCap,
            stream: true,
          }),
        });

        if (!aiRes.ok) {
          const errorText = await aiRes.text();
          console.warn(`Model ${modelConfig.modelName} failed:`, errorText);
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
                const fallbackMsg = "I searched the web but couldn't retrieve the full information. Please try again.";
                fullContent = fallbackMsg;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ choices: [{ delta: { content: fallbackMsg } }] })}\n\n`));
              }

              saveMessage(supabase, user.id, convId, "assistant", fullContent).catch(console.error);

              // Trigger memory summary generation (async, non-blocking)
              getUserTotalMessageCount(supabase, user.id).then(totalMessageCount => {
                generateMemorySummary(user.id, messages, totalMessageCount).catch(console.error);
              }).catch(console.error);

              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (error) {
              console.error("Stream error:", error);
              controller.error(error);
            }
          },
        });

        console.log(`✅ Model succeeded: ${modelConfig.modelName} (${modelConfig.modelKey})`);
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
        if (openaiSources.length > 0) {
          headers["x-sources"] = encodeURIComponent(JSON.stringify(openaiSources));
        }

        return new Response(stream, { headers });
      } catch (fetchError: any) {
        console.warn(`Model ${modelConfig.modelName} threw an error:`, fetchError);
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