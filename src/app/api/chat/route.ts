import { NextRequest, NextResponse } from "next/server";
import { tiers } from "@/lib/model-registry";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { autoRoute } from "@/lib/router";
import { checkModelLimit, incrementModelUsage } from "@/lib/model-limits";
import { getCurrentTimeAndLocation, getUpcomingHolidays, getWeather } from "@/lib/time-utils";

// ─── Safe text extractor ─────────────────────────────────────
function getText(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(part => part?.text || "").join(" ");
  if (content && typeof content === "object") return getText(content.content || content.text || "");
  return "";
}

// ─── Compress a long reply to fit within a token budget using a fast model
async function compressReply(
  text: string,
  maxTokens: number,
  userMessage: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return text;

  try {
    const prompt = `The following AI response is too long. Summarize it to fit within ${maxTokens} tokens while keeping the main points and a natural conclusion. Only output the shortened response.

Original response:
${text}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) return text;
    const data = await response.json();
    return data.choices[0].message.content;
  } catch {
    return text;
  }
}

// ─── Wikipedia fallback search ────────────────────────────────
async function searchWikipedia(query: string): Promise<{ summary: string; url: string } | null> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    if (!data[1] || data[1].length === 0) return null;

    const title = data[1][0];
    const url = data[3][0];
    const summaryUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(title)}&format=json`;
    const summaryRes = await fetch(summaryUrl);
    const summaryData = await summaryRes.json();
    const pages = summaryData?.query?.pages;
    if (!pages) return null;

    const page: any = Object.values(pages)[0];
    if (!page || !page.extract) return null;

    return {
      summary: page.extract.substring(0, 1000),
      url,
    };
  } catch {
    return null;
  }
}

// ─── Jina real‑time search ────────────────────────────────────
async function searchJina(userMessage: string): Promise<{ text: string; url?: string } | null> {
  const apiKey = process.env.JINA_API_KEY;
  if (!apiKey) return null;

  const queries = [
    userMessage,
    `${userMessage} latest`,
    `${userMessage} news`,
    `${userMessage} current`,
  ];

  for (const query of queries) {
    try {
      const searchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;
      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      });
      if (!searchRes.ok) continue;
      const searchData = await searchRes.json();
      const bestUrl = searchData.data?.[0]?.url;
      if (!bestUrl) continue;

      const readerUrl = `https://r.jina.ai/${encodeURIComponent(bestUrl)}`;
      const readerRes = await fetch(readerUrl, {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      });
      if (!readerRes.ok) continue;
      const readerData = await readerRes.json();
      const content = readerData.data?.content || readerData.data?.text || "";
      if (!content) continue;

      console.log(`✅ Jina success: query="${query}" → ${bestUrl}`);
      return { text: content.substring(0, 4000), url: bestUrl };
    } catch (err) {
      console.error(`Jina attempt failed for "${query}"`, err);
    }
  }

  console.warn("❌ Jina: all queries failed");
  return null;
}

// ─── Title generation ──────────────────────────────────────────
async function generateTitle(message: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return message.slice(0, 50);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Generate a short title (max 6 words) for this message: "${message}". Output only the title.` }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 30 },
        }),
      }
    );
    if (response.ok) {
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || message.slice(0, 50);
    }
  } catch {}

  return message.slice(0, 50);
}

// ─── AI model callers ─────────────────────────────────────────
async function callOpenAICompatible(
  endpoint: string,
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  messages: { role: string; content: string }[],
  temperature: number,
  maxTokens: number
) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [{ role: "system", content: systemPrompt }, ...messages],
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    if (response.status === 429) {
      await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error(`OpenAI error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGemini(
  endpoint: string,
  apiKey: string,
  _modelName: string,
  systemPrompt: string,
  messages: { role: string; content: string }[],
  temperature: number,
  maxTokens: number
) {
  const contents = messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: getText(msg.content) }],
  }));

  const payload: any = {
    contents,
    generationConfig: { temperature, maxOutputTokens: maxTokens },
  };
  if (systemPrompt) {
    payload.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    if (response.status === 429) {
      await new Promise(r => setTimeout(r, 1000));
    }
    throw new Error(`Gemini error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ─── SearXNG real‑time search (free, no API key) ──────────────
async function searchSearXNG(query: string): Promise<{ text: string; url?: string } | null> {
  try {
    const baseUrl = "https://searx.be/search";
    const params = new URLSearchParams({
      q: query,
      format: "json",
      categories: "general,news",
    });

    const response = await fetch(`${baseUrl}?${params}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;
    const data = await response.json();

    const results = data.results?.slice(0, 5) || [];
    if (results.length === 0) return null;

    const snippets = results
      .map((r: any) => `- ${r.title}: ${r.content || r.snippet || ""} (${r.url})`)
      .join("\n");

    const topUrl = results[0]?.url || undefined;

    return {
      text: `SearXNG aggregated results:\n${snippets}`,
      url: topUrl,
    };
  } catch (error) {
    console.error("SearXNG search failed:", error);
    return null;
  }
}

// ─── Main POST handler ────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      messages: incomingMessages,
      modelTier,
      conversationId,
      newConversation,
      diveDeep,
      timezone: browserTimezone,
    } = body;

    if (!incomingMessages || !modelTier) {
      return NextResponse.json({ error: "Missing messages or model tier" }, { status: 400 });
    }

    const messages = incomingMessages.map((m: any) => ({
      role: m.role,
      content: getText(m.content),
    }));

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // Fetch profile once for this request
    let profileName = "";
    let profileGoal = "";
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, goal")
        .eq("user_id", user.id)
        .single();
      if (profile) {
        if (profile.name) profileName = profile.name;
        if (profile.goal) profileGoal = profile.goal;
      }
    } catch {}

    // ── Time & Holiday injection ──
    let timeContext = "";
    const lowerMsg = lastUserMessage.toLowerCase();

    const isTimeQuery =
      lowerMsg.includes("what time") ||
      lowerMsg.includes("current time") ||
      lowerMsg.includes("time is it") ||
      lowerMsg.includes("what's the time") ||
      lowerMsg.includes("time in");

    const isDateQuery =
      lowerMsg.includes("what day") ||
      lowerMsg.includes("today's date") ||
      lowerMsg.includes("what is today") ||
      lowerMsg.includes("current date");

    const isHolidayQuery =
      lowerMsg.includes("holiday") ||
      lowerMsg.includes("holidays") ||
      lowerMsg.includes("celebration") ||
      lowerMsg.includes("festival");

    if (isTimeQuery || isDateQuery || isHolidayQuery || lowerMsg.includes("weather")) {
      try {
        // Check if user is asking about a specific city
        const cityMatch = lowerMsg.match(/time in ([a-z\s]+?)(\?|$)/i);
        let targetTz = browserTimezone || "Asia/Karachi";

        if (cityMatch) {
          const city = cityMatch[1].trim();
          const cityTzMap: Record<string, string> = {
            "tokyo": "Asia/Tokyo",
            "london": "Europe/London",
            "new york": "America/New_York",
            "los angeles": "America/Los_Angeles",
            "paris": "Europe/Paris",
            "berlin": "Europe/Berlin",
            "dubai": "Asia/Dubai",
            "sydney": "Australia/Sydney",
            "toronto": "America/Toronto",
            "mumbai": "Asia/Kolkata",
            "delhi": "Asia/Kolkata",
            "beijing": "Asia/Shanghai",
            "shanghai": "Asia/Shanghai",
            "moscow": "Europe/Moscow",
            "seoul": "Asia/Seoul",
            "singapore": "Asia/Singapore",
            "hong kong": "Asia/Hong_Kong",
            "istanbul": "Europe/Istanbul",
          };
          targetTz = cityTzMap[city] || targetTz;
        }

        const { time, date, timezone, countryCode, source, utcTimestamp, latitude, longitude } =
          await getCurrentTimeAndLocation(req as any, targetTz);
        const holidays = await getUpcomingHolidays(countryCode);

        // Weather
        let weatherInfo = "";
        if (
          lowerMsg.includes("weather") ||
          lowerMsg.includes("temperature") ||
          lowerMsg.includes("hot") ||
          lowerMsg.includes("cold")
        ) {
          const weather = await getWeather(latitude || 0, longitude || 0, timezone);
          if (weather) weatherInfo = `\n\n🌤️ Current weather: ${weather}`;
        }

        timeContext = `📌 ${source}

Current local time and date:
- 🕐 Time: ${time}
- 📅 Date: ${date}
- 🌍 Timezone: ${timezone}`;

        if (cityMatch) {
          timeContext += `\n- 📍 This is the current time for ${cityMatch[1].trim()}.`;
        }

        if (holidays.length > 0) {
          timeContext += `\n\n🎉 Upcoming public holidays in ${countryCode}:\n${holidays.map(h => `  • ${h}`).join("\n")}`;
        }

        if (weatherInfo) timeContext += weatherInfo;

        timeContext += `\n\n❗ Use the exact time, date, and timezone above in your response. Do NOT mention UTC or use approximate calculations.`;
      } catch {}
    }

    // ── Create conversation if new (fast, title generated after response) ──
    let finalConversationId = conversationId;
    if (!finalConversationId || newConversation) {
      finalConversationId = crypto.randomUUID();
      const tempTitle = lastUserMessage.slice(0, 50);
      try {
        await supabase.from("conversations").insert({
          id: finalConversationId,
          user_id: user.id,
          title: tempTitle,
        });
        Promise.resolve().then(async () => {
          try {
            const realTitle = await generateTitle(lastUserMessage);
            if (realTitle) {
              await supabase.from("conversations").update({ title: realTitle }).eq("id", finalConversationId);
            }
          } catch {}
        });
      } catch (dbError: any) {
        console.error("Failed to create conversation:", dbError.message);
      }
    }

    // ── Per‑conversation message limit (10 per 8 hours) ──
    const now = new Date();
    const { data: conv } = await supabase
      .from("conversations")
      .select("message_count, message_reset_at")
      .eq("id", finalConversationId)
      .single();

    if (conv) {
      const resetTime = new Date(conv.message_reset_at);
      const hoursSinceReset = (now.getTime() - resetTime.getTime()) / (1000 * 60 * 60);

      if (hoursSinceReset >= 8) {
        await supabase
          .from("conversations")
          .update({ message_count: 0, message_reset_at: now.toISOString() })
          .eq("id", finalConversationId);
      } else if (conv.message_count >= 10) {
        const nextReset = new Date(resetTime.getTime() + 8 * 60 * 60 * 1000);
        const remaining = Math.ceil((nextReset.getTime() - now.getTime()) / (1000 * 60 * 60));
        return NextResponse.json(
          { error: `You've reached the limit (10 messages) for this conversation. Resets in about ${remaining} hour(s).` },
          { status: 429 }
        );
      }
    }

    // Common profile context strings
    const nameContext = profileName
      ? `The user's name is ${profileName}. Address them by name naturally.\n\n`
      : "";
    const goalContext = profileGoal
      ? `The user has selected "${profileGoal}" as their focus area. Adopt a tone and style appropriate for that field.\n\n`
      : "";

    // ── AUTO‑ROUTING LOGIC ──────────────────────────────────
    if (modelTier === "auto") {
      // Build conversation history including time context, name, goal
      let conversationHistory = messages
        .slice(0, -1)
        .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
        .join("\n");

      const prefixParts: string[] = [];
      if (timeContext) prefixParts.push(timeContext);
      if (nameContext || goalContext) prefixParts.push(`${nameContext}${goalContext}`);
      if (prefixParts.length > 0) {
        conversationHistory = `[System context]\n${prefixParts.join("\n")}\n${conversationHistory}`;
      }

      let liveData = "";
      try {
        const jinaResult = await searchJina(lastUserMessage);
        if (jinaResult) liveData = jinaResult.text;
        else {
          const wiki = await searchWikipedia(lastUserMessage);
          if (wiki) liveData = wiki.summary;
        }
      } catch {}

      const { reply, tiersUsed } = await autoRoute(lastUserMessage, conversationHistory, liveData);

      // Store messages with ordered timestamps
      const insertNow = Date.now();
      const userTimestamp = new Date(insertNow).toISOString();
      const assistantTimestamp = new Date(insertNow + 1).toISOString();

      try {
        await supabase.from("messages").insert([
          { conversation_id: finalConversationId, role: "user", content: lastUserMessage, created_at: userTimestamp },
          { conversation_id: finalConversationId, role: "assistant", content: reply, created_at: assistantTimestamp },
        ]);
        await supabase
          .from("conversations")
          .update({ message_count: (conv?.message_count ?? 0) + 1 })
          .eq("id", finalConversationId);
      } catch (dbError: any) {
        console.error("Database store failed:", dbError.message);
      }

      return NextResponse.json({
        reply,
        conversationId: finalConversationId,
        tiersUsed,
      });
    }

    // ── NORMAL TIER HANDLING ───────────────────────────────
    const tierConfig = tiers[modelTier as keyof typeof tiers];
    if (!tierConfig) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

    // ── Live search with hard timeout ─────────────────────────
    let webContext = "";
    let wikiLink: string | null = null;

    const personalQuestions = [
      "what is my name", "what's my name", "who am i",
      "what is my goal", "what are my goals", "my profile",
      "what do i like", "what is my", "who is",
    ];
    const isPersonal = personalQuestions.some((q) => lastUserMessage.toLowerCase().includes(q));

    const shouldFetchLive = modelTier === "live" || (diveDeep && !isPersonal);

    if (shouldFetchLive) {
      const searchWithTimeout = async (fn: () => Promise<any>, ms: number) => {
        const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
        return Promise.race([fn(), timeout]);
      };

      try {
        const result = await searchWithTimeout(() => searchSearXNG(lastUserMessage), 3000) as any;
        if (result?.text) {
          webContext = `[Web]\n${result.text}\n\n`;
          wikiLink = result.url || null;
        }
      } catch {}

      if (!webContext && modelTier === "live") {
        try {
          const result = await searchWithTimeout(() => searchJina(lastUserMessage), 3000) as any;
          if (result?.text) {
            webContext = `[Web]\n${result.text}\n\n`;
            wikiLink = result.url || null;
          }
        } catch {}
      }

      if (!webContext) {
        try {
          const result = await searchWithTimeout(() => searchWikipedia(lastUserMessage), 2000) as any;
          if (result?.summary) {
            webContext = `[Wikipedia]\n${result.summary}\n\n`;
            wikiLink = result.url || null;
          }
        } catch {}
      }
    }

    // Build final system prompt – always inject name, goal, time
    const baseSystem = tierConfig.systemPrompt;
    const priorityInstruction = webContext
      ? "‼️ CRITICAL: You MUST use the real-time web data provided below to answer the user's question. Extract exact facts, numbers, and names.\n\n"
      : "";

    const fullSystemPrompt = (
      priorityInstruction +
      (webContext ? webContext : "") +
      (timeContext ? `${timeContext}\n\n` : "") +
      nameContext +
      goalContext +
      baseSystem
    ).trim();

    // Model fallback with usage limits
    let reply: string | null = null;
    let lastError: Error | null = null;
    const skippedModels: string[] = [];

    for (const modelConfig of tierConfig.models) {
      const apiKey = process.env[modelConfig.apiKeyEnv];
      if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
        skippedModels.push(modelConfig.modelName);
        continue;
      }

      const modelLimitKey = modelConfig.modelKey || modelTier;
      const { allowed } = await checkModelLimit(supabase, user.id, modelLimitKey);
      if (!allowed) {
        skippedModels.push(modelConfig.modelName + " (limit reached)");
        continue;
      }

      try {
        if (modelConfig.provider === "openai") {
          reply = await callOpenAICompatible(
            modelConfig.endpoint, apiKey, modelConfig.modelName,
            fullSystemPrompt, messages, tierConfig.temperature, tierConfig.maxTokens
          );
        } else if (modelConfig.provider === "gemini") {
          reply = await callGemini(
            modelConfig.endpoint, apiKey, modelConfig.modelName,
            fullSystemPrompt, messages, tierConfig.temperature, tierConfig.maxTokens
          );
        }

        if (reply) {
          await incrementModelUsage(supabase, user.id, modelLimitKey, Math.ceil(reply.length / 4));
          break;
        }
      } catch (error: any) {
        lastError = error;
        if (error.message.includes("429")) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
    }

    if (lastError) console.warn("All models failed:", lastError.message);

    if (!reply) {
      const msg = lastError
        ? `All models failed. Last error: ${lastError.message}`
        : "All models are currently unavailable.";
      return NextResponse.json({ error: msg }, { status: 429 });
    }

    // Weak reply? Inject links
    const replyLower = reply.toLowerCase();
    const isWeakReply =
      reply.length < 30 ||
      replyLower.includes("i don't know") ||
      replyLower.includes("i cannot") ||
      replyLower.includes("i'm not sure") ||
      replyLower.includes("i do not have") ||
      replyLower.includes("no information") ||
      replyLower.includes("unable to") ||
      replyLower.includes("i can't");

    if (isWeakReply) {
      try {
        const searxResult = await searchSearXNG(lastUserMessage);
        if (searxResult) {
          const links = (searxResult.text.match(/\(https?:\/\/[^\s)]+\)/g) || [])
            .slice(0, 3)
            .map((link) => link.replace(/[()]/g, ""));
          if (links.length > 0) {
            const linkText = links.map((link, i) => `${i + 1}. [${new URL(link).hostname}](${link})`).join("\n");
            reply = `${reply}\n\n🔗 **Here are some helpful links:**\n${linkText}`;
            if (!wikiLink) wikiLink = links[0];
          }
        }
      } catch {}
    }

    // Compress if reply exceeds the tier's token budget
    const estimatedTokens = Math.ceil(reply.length / 4);
    if (estimatedTokens > tierConfig.maxTokens) {
      reply = await compressReply(reply, tierConfig.maxTokens, lastUserMessage);
    }

    // Final safety: strip any remaining <think> tags from the final reply
    reply = reply.replace(/<think[\s\S]*?<\/think>/gi, "").trim();

    // Store messages with ordered timestamps
    const insertNow = Date.now();
    const userTimestamp = new Date(insertNow).toISOString();
    const assistantTimestamp = new Date(insertNow + 1).toISOString();

    try {
      await supabase.from("messages").insert([
        { conversation_id: finalConversationId, role: "user", content: lastUserMessage, created_at: userTimestamp },
        { conversation_id: finalConversationId, role: "assistant", content: reply, created_at: assistantTimestamp },
      ]);
      await supabase
        .from("conversations")
        .update({ message_count: (conv?.message_count ?? 0) + 1 })
        .eq("id", finalConversationId);
    } catch (dbError: any) {
      console.error("Database store failed:", dbError.message);
    }

    return NextResponse.json({
      reply,
      conversationId: finalConversationId,
      wikiLink,
    });
  } catch (error: any) {
    console.error("Chat API error:", error.message);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}