// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { aaiRuntime } from "@/lib/aai";
import { tiers } from "@/lib/model-registry";
import { classifyIntent, getIntentInstruction } from "@/lib/intent-classifier";
import { getWeather, getCurrentTimeCard, getCurrentCalendarCard, getNews } from "@/lib/services/real-time";
import {
  getFootballPlayerGoals,
  getCricketScore,
  getWikipediaSummary,
  getCurrentEvents,
  getForbesNetWorth,
  getStockPrice,
  performDeepSearch,
  scrapePage,
  extractAnswer,
} from "@/lib/services/live-data";
import { cleanSearchQuery } from "@/lib/services/query-cleaner";
import { routeToCuratedSources } from "@/lib/services/curated-router";
import { shouldForceWebSearch } from "@/lib/services/ambiguity-detector";

// ── DB helpers ──────────────────────────────
async function createConversation(supabase: any, userId: string, id: string, title?: string) {
  await supabase.from("conversations").insert({
    id,
    user_id: userId,
    title: title?.slice(0, 100) || "New conversation",
  });
}

async function saveMessage(supabase: any, userId: string, conversationId: string, role: string, content: string) {
  await supabase.from("messages").insert({
    conversation_id: conversationId,
    user_id: userId,
    role,
    content,
  });
}

// ── Per‑tier message limits ──────────────────
const MODEL_LIMITS: Record<string, number> = {
  fast: 10,
  plus: 10,
  pro: 10,
  code: 10,
  live: 10,
  aai: 10,
  web_search: 10, // 10 web searches per user per day
};

async function checkAndUpdateUsage(
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
`;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      messages,
      modelTier = "fast",
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

    // Tier restriction for web search – only N Live can search the web
    const WEB_SEARCH_TIERS = ["live"];
    const canWebSearch = WEB_SEARCH_TIERS.includes(modelTier);

    // Clean the query for curated matching + web search
    const cleanedQuery = canWebSearch ? await cleanSearchQuery(userMessage) : userMessage;
    if (canWebSearch) {
      console.log(`🧹 Cleaned query: "${userMessage}" → "${cleanedQuery}"`);
    }

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

    const isSpecialService =
      /weather|temperature|rain|forecast|time|clock|date|calendar|news|headline|trending|goals|career goals|cricket|match|score|result|net worth|stock price|stock|who is|what is|define|explain|wiki|exchange rate|usd to pkr|pkr to usd/i.test(userMessage);
    const isFactualQuery =
      /news|net worth|current|latest|today|202[4-9]|stock|price|how much|how many|who is|what is|know about|tell me about|what do you know/i.test(userMessage);
    let shouldSearch = isSpecialService || (diveDeep && isFactualQuery);

    // Force web search if ambiguity detector triggers and tier allows it
    if (!shouldSearch && canWebSearch) {
      const forceSearch = await shouldForceWebSearch(userMessage);
      if (forceSearch) {
        shouldSearch = true;
        console.log("⚠️ Ambiguity detected – forcing web search");
      }
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

      let liveData = "";
      if (shouldSearch) {
        searchAttempted = true;

        if (/weather|temperature|rain|forecast/i.test(userMessage)) {
          const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
          const city = cityMatch?.[1]?.trim() || "Lahore";
          liveData = await getWeather(city);
        } else if (/time|clock/i.test(userMessage)) {
          const zoneMatch = userMessage.match(/(?:in|for)\s+([A-Za-z\/_]+?)(\?|$)/i);
          const zone = zoneMatch?.[1]?.trim() || undefined;
          liveData = await getCurrentTimeCard(zone);
        } else if (/date|calendar/i.test(userMessage)) {
          const zoneMatch = userMessage.match(/(?:in|for)\s+([A-Za-z\/_]+?)(\?|$)/i);
          const zone = zoneMatch?.[1]?.trim() || undefined;
          liveData = await getCurrentCalendarCard(zone);
        } else if (/news|headline|trending/i.test(userMessage)) {
          liveData = await getNews(userMessage) || await getCurrentEvents();
        } else if (/goals|career goals/i.test(userMessage)) {
          const nameMatch = userMessage.match(/(?:of|for)\s+([A-Za-z\s]+?)(?:\?|$)/i);
          const name = nameMatch?.[1]?.trim() || "Cristiano Ronaldo";
          liveData = await getFootballPlayerGoals(name);
        } else if (/cricket|match|score|result/i.test(userMessage)) {
          liveData = await getCricketScore(userMessage);
        } else if (/net worth/i.test(userMessage)) {
          const nameMatch = userMessage.match(/(?:of|for)\s+([A-Za-z\s]+?)(?:\?|$)/i);
          const name = nameMatch?.[1]?.trim() || "Elon Musk";
          liveData = await getForbesNetWorth(name);
        } else if (/stock price|stock/i.test(userMessage)) {
          const symMatch = userMessage.match(/\(?([A-Z]{1,5})\)?/);
          const sym = symMatch?.[1] || "TSLA";
          liveData = await getStockPrice(sym);
        } else if (/who is|what is|define|explain|wiki/i.test(userMessage)) {
          const topic = userMessage.replace(/who is|what is|define|explain|wiki/gi, "").trim();
          liveData = await getWikipediaSummary(topic);
        } else if (/exchange rate|usd to pkr|pkr to usd/i.test(userMessage)) {
          try {
            const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
            const data = await res.json();
            const rate = data.rates.PKR;
            if (rate) liveData = `1 USD = ${rate} PKR (Source: ExchangeRate-API)`;
          } catch {}
        } else if (canWebSearch) {
          const cleanQ = cleanedQuery;
          // 1. Groq router picks best curated sources
          const curatedSources = await routeToCuratedSources(cleanQ);
          console.log(
            `📚 Curated router returned: ${
              curatedSources.length > 0
                ? curatedSources.map((s) => s.title).join(", ")
                : "none"
            }`
          );
          if (curatedSources.length > 0) {
            console.log(`✅ USING CURATED SOURCE(s): ${curatedSources.map((s) => s.url).join(", ")}`);
            const curatedContents = await Promise.all(curatedSources.map(s => scrapePage(s.url)));
            liveData = await extractAnswer(cleanQ, curatedSources.map(s => s.url), curatedContents);
          }
          // 2. Fallback to deep web search
          if (!liveData) {
            console.log(`🌐 FALLING BACK TO TAVILY WEB SEARCH for: "${cleanQ}"`);
            const searchUsage = await checkAndUpdateUsage(supabase, user.id, "web_search");
            if (searchUsage.allowed) {
              liveData = await performDeepSearch(cleanQ);
            } else {
              console.log(`⚠️ Web search limit reached`);
            }
          }
        }
      }

      const widgetInstruction = `\n\n[SYSTEM NOTE: When the user asks for time, weather, or date, search the web and output ONLY a widget marker. Do NOT output the data in plain text.
Weather marker: <!--WIDGET:WEATHER:{"city":"...","temp":34,"condition":"scattered clouds","humidity":36,"windSpeed":3.1,"icon":"cloud"}-->
Time marker:   <!--WIDGET:CLOCK:{"hours":14,"minutes":6,"seconds":0,"timezone":"Asia/Karachi","label":"Lahore, PK"}-->
Calendar:      <!--WIDGET:CALENDAR:{"year":2026,"month":7,"day":3,"timezone":"Asia/Karachi","label":"Today"}-->]\n\n`;

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

      const aaiResult = await aaiRuntime.processRequest({
        userMessage: extendedMessage,
        conversationHistory: history,
        modelTier,
        metadata: {
          conversationId: convId,
          userId: user.id,
        },
      });

      const replyText = aaiResult.response || "";
      await saveMessage(supabase, user.id, convId, "assistant", replyText);

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

    // Build messages array with system prompt
    const apiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: tier.systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    // ── Inject user profile ──────────────────────
    if (profileNote) {
      apiMessages[0].content += `\n\n--- USER PROFILE ---\n${profileNote}`;
    }

    // ── Inject user preferences ──
    apiMessages[0].content += toneInjection;

    // ── Inject intent label ──
    apiMessages[0].content += `\n\nIntent: ${intent}`;

    // ── Dynamic Rich Content Engine ──
    apiMessages[0].content += DYNAMIC_RICH_CONTENT_ENGINE;

    // ── Inject bot persona notes ──
    if (personaNoteText) {
      apiMessages[0].content += `\n\n--- BOT PERSONA NOTES ---\nYou must follow these behavioral instructions with every response:\n${personaNoteText}\nThese are permanent preferences from the user.`;
    }

    // ── Comprehensive live-data router ──
    if (shouldSearch) {
      searchAttempted = true;
      let liveData = "";

      if (/weather|temperature|rain|forecast/i.test(userMessage)) {
        const cityMatch = userMessage.match(/in\s+([A-Za-z\s]+?)(\?|$)/i);
        const city = cityMatch?.[1]?.trim() || "Lahore";
        liveData = await getWeather(city);
      } else if (/time|clock/i.test(userMessage)) {
        const zoneMatch = userMessage.match(/(?:in|for)\s+([A-Za-z\/_]+?)(\?|$)/i);
        const zone = zoneMatch?.[1]?.trim() || undefined;
        liveData = await getCurrentTimeCard(zone);
      } else if (/date|calendar/i.test(userMessage)) {
        const zoneMatch = userMessage.match(/(?:in|for)\s+([A-Za-z\/_]+?)(\?|$)/i);
        const zone = zoneMatch?.[1]?.trim() || undefined;
        liveData = await getCurrentCalendarCard(zone);
      } else if (/news|headline|trending/i.test(userMessage)) {
        liveData = await getNews(userMessage) || await getCurrentEvents();
      } else if (/goals|career goals/i.test(userMessage)) {
        const nameMatch = userMessage.match(/(?:of|for)\s+([A-Za-z\s]+?)(?:\?|$)/i);
        const name = nameMatch?.[1]?.trim() || "Cristiano Ronaldo";
        liveData = await getFootballPlayerGoals(name);
      } else if (/cricket|match|score|result/i.test(userMessage)) {
        liveData = await getCricketScore(userMessage);
      } else if (/net worth/i.test(userMessage)) {
        const nameMatch = userMessage.match(/(?:of|for)\s+([A-Za-z\s]+?)(?:\?|$)/i);
        const name = nameMatch?.[1]?.trim() || "Elon Musk";
        liveData = await getForbesNetWorth(name);
      } else if (/stock price|stock/i.test(userMessage)) {
        const symMatch = userMessage.match(/\(?([A-Z]{1,5})\)?/);
        const sym = symMatch?.[1] || "TSLA";
        liveData = await getStockPrice(sym);
      } else if (/who is|what is|define|explain|wiki/i.test(userMessage)) {
        const topic = userMessage.replace(/who is|what is|define|explain|wiki/gi, "").trim();
        liveData = await getWikipediaSummary(topic);
      } else if (/exchange rate|usd to pkr|pkr to usd/i.test(userMessage)) {
        try {
          const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
          const data = await res.json();
          const rate = data.rates.PKR;
          if (rate) liveData = `1 USD = ${rate} PKR (Source: ExchangeRate-API)`;
        } catch {}
      } else if (canWebSearch) {
        const cleanQ = cleanedQuery;
        // 1. Groq router picks best curated sources
        const curatedSources = await routeToCuratedSources(cleanQ);
        console.log(
          `📚 Curated router returned: ${
            curatedSources.length > 0
              ? curatedSources.map((s) => s.title).join(", ")
              : "none"
          }`
        );
        if (curatedSources.length > 0) {
          console.log(`✅ USING CURATED SOURCE(s): ${curatedSources.map((s) => s.url).join(", ")}`);
          const curatedContents = await Promise.all(curatedSources.map(s => scrapePage(s.url)));
          liveData = await extractAnswer(cleanQ, curatedSources.map(s => s.url), curatedContents);
        }
        // 2. Fallback to deep web search
        if (!liveData) {
          console.log(`🌐 FALLING BACK TO TAVILY WEB SEARCH for: "${cleanQ}"`);
          const searchUsage = await checkAndUpdateUsage(supabase, user.id, "web_search");
          if (searchUsage.allowed) {
            liveData = await performDeepSearch(cleanQ);
          } else {
            console.log(`⚠️ Web search limit reached`);
            apiMessages[0].content += `\n\nNote: Daily web search limit reached.`;
          }
        }
      }

      if (liveData) {
        apiMessages[0].content += `\n\n--- REAL-TIME SEARCH (use this data) ---\n${liveData}`;
        apiMessages[0].content += `\n\nIMPORTANT: After your answer, add a "## Sources" section with one bullet point per source, like this:\n- [Title](URL)\n- [Title](URL)\nDo NOT skip this section.`;
      }
    }

    // ── Soft token target + upgrade hint ──
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

    let lastError: string | null = null;

    for (const modelConfig of tier.models) {
      const apiKey = process.env[modelConfig.apiKeyEnv];
      if (!apiKey) {
        lastError = `Missing API key for ${modelConfig.modelKey}`;
        continue;
      }

      const hardCap = Math.max(tier.maxTokens * 2, 800);

      try {
        // ── Gemini branch ────────────────────────
        if (modelConfig.provider === "gemini") {
          const geminiUrl = `${modelConfig.endpoint}?key=${apiKey}`;
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

          if (!aiRes.ok) {
            const errorText = await aiRes.text();
            console.warn(`Gemini model ${modelConfig.modelName} failed:`, errorText);
            lastError = errorText;
            continue;
          }

          const data = await aiRes.json();
          const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (!replyText.trim()) {
            lastError = "Empty response from Gemini";
            continue;
          }

          await saveMessage(supabase, user.id, convId, "assistant", replyText);

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
          };
          if (searchAttempted) {
            headers["x-search-performed"] = "true";
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

              saveMessage(supabase, user.id, convId, "assistant", fullContent).catch(console.error);

              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (error) {
              console.error("Stream error:", error);
              controller.error(error);
            }
          },
        });

        const headers: Record<string, string> = {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-conversation-id": convId,
        };
        if (searchAttempted) {
          headers["x-search-performed"] = "true";
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