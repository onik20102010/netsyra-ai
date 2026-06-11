// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { tiers } from "@/lib/model-registry";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { autoRoute } from "@/lib/router";
import { checkModelLimit, incrementModelUsage } from "@/lib/model-limits";
import { getCurrentTimeAndLocation, getUpcomingHolidays, getWeather, getCityCoordinates } from "@/lib/time-utils";
import { classifyIntent } from "@/lib/intent";
import { deepSearch } from "@/lib/deep-search";
import { multiStepReason } from "@/lib/chain-router";
import { reflectOnReply } from "@/lib/reflector";

// ─── Safe text extractor ─────────────────────────────────────
function getText(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(part => part?.text || "").join(" ");
  if (content && typeof content === "object") return getText(content.content || content.text || "");
  return "";
}

// ─── Simple harmful content filter ────────────────────────────
function isHarmful(text: string): boolean {
  const lower = text.toLowerCase();
  const patterns = [
    // Violence / self-harm
    "kill yourself", "suicide", "self-harm", "cut yourself",
    "how to make a bomb", "how to build a weapon",
    // Explicit adult
    "pornographic", "explicit sexual content", "child abuse",
    // Hate speech
    "hate speech", "racial slur", "discrimination",
    // Illegal activities
    "how to hack", "ddos attack", "crack password",
  ];
  return patterns.some(pattern => lower.includes(pattern));
}

// ─── Confidence scoring heuristic ────────────────────────────
function scoreConfidence(reply: string): number {
  if (!reply) return 0;
  const lower = reply.toLowerCase();
  // Short reply (<20 chars) considered low confidence
  if (reply.length < 20) return 0.3;
  // Phrases indicating uncertainty
  const uncertaintyPatterns = [
    "i'm not sure", "i don't know", "i cannot", "unable to", "sorry",
    "no information", "not available", "it is unclear"
  ];
  for (const p of uncertaintyPatterns) {
    if (lower.includes(p)) return 0.4;
  }
  // Otherwise, assume moderate to high confidence based on length
  if (reply.length > 300) return 0.9;
  if (reply.length > 100) return 0.8;
  return 0.7;
}

// ─── Extract persona from a conversation turn ─────────────────
async function extractPersona(userMessage: string, existingPersona: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return existingPersona;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `You are a persona extractor. Given a user message and an existing persona description, update the persona to reflect any new preferences, tone, or style. Keep it concise and in second-person voice (e.g., "You prefer concise answers with bullet points, avoid markdown, and like a friendly tone."). Existing persona: ${existingPersona || "None yet."}. Only output the updated persona.`
          },
          { role: "user", content: userMessage }
        ],
        temperature: 0.2,
        max_tokens: 200,
      }),
    });
    if (!response.ok) return existingPersona;
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() || existingPersona;
  } catch {
    return existingPersona;
  }
}

// ─── Summarise a list of messages using a fast model ──────────
async function summariseMessages(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || messages.length === 0) return "";

  const conversationText = messages
    .map(m => `${m.role}: ${m.content}`)
    .join("\n");

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "Summarize the following conversation into a concise paragraph that preserves key context, decisions, and user intent. Only output the summary."
          },
          { role: "user", content: conversationText }
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });
    if (!response.ok) return "";
    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  } catch {
    return "";
  }
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

// ─── Streaming model caller for OpenAI-compatible APIs ────────
async function streamOpenAICompatible(
  endpoint: string,
  apiKey: string,
  modelName: string,
  systemPrompt: string,
  messages: { role: string; content: string }[],
  temperature: number,
  maxTokens: number,
  controller: ReadableStreamDefaultController
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
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Streaming error: ${response.status} ${err}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
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
          controller.enqueue(new TextEncoder().encode(content));
        }
      } catch {}
    }
  }
}

// ─── Streaming model caller for Gemini ────────────────────────
async function streamGemini(
  endpoint: string,
  apiKey: string,
  _modelName: string,
  systemPrompt: string,
  messages: { role: string; content: string }[],
  temperature: number,
  maxTokens: number,
  controller: ReadableStreamDefaultController
) {
  const contents = messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: getText(msg.content) }],
  }));

  const payload: any = { contents, generationConfig: { temperature, maxOutputTokens: maxTokens } };
  if (systemPrompt) payload.systemInstruction = { parts: [{ text: systemPrompt }] };

  const response = await fetch(endpoint + ":streamGenerateContent?alt=sse", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error(`Gemini streaming error: ${response.status}`);

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response body");
  const decoder = new TextDecoder();
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
      try {
        const parsed = JSON.parse(data);
        const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) controller.enqueue(new TextEncoder().encode(text));
      } catch {}
    }
  }
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
    } = body;

    if (!incomingMessages || !modelTier) {
      return NextResponse.json({ error: "Missing messages or model tier" }, { status: 400 });
    }

    const messages = incomingMessages.map((m: any) => ({
      role: m.role,
      content: getText(m.content),
    }));

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // ── Input moderation ─────────────────────────────────────
    if (isHarmful(lastUserMessage)) {
      return NextResponse.json(
        { error: "Your message was flagged as potentially harmful." },
        { status: 400 }
      );
    }

    // ── Auto‑summarise long conversation history ──────────────
    let extraContext = "";
    if (messages.length > 20) {
      const olderMsgs = messages.slice(0, -20);
      const summary = await summariseMessages(olderMsgs);
      if (summary) extraContext = `[Earlier conversation summary]\n${summary}\n\n`;
    }

    // Fetch profile once for this request
    let profileName = "";
    let profileGoal = "";
    let customInstructions = "";
    let persona = "";
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, goal, custom_instructions, persona")
        .eq("user_id", user.id)
        .single();
      if (profile) {
        if (profile.name) profileName = profile.name;
        if (profile.goal) profileGoal = profile.goal;
        if (profile.custom_instructions) customInstructions = profile.custom_instructions;
        if (profile.persona) persona = profile.persona;
      }
    } catch {}

    // ── Custom instructions context ──
    const instructionContext = customInstructions
      ? `📌 The user has provided these custom instructions. Follow them carefully:\n\n${customInstructions}\n\n`
      : "";

    // ── Persona context ──
    const personaContext = persona
      ? `Adapt your tone to match the user's preferred style: ${persona}\n\n`
      : "";

    // ── RAG pipeline (intent‑based retrieval) ─────────────────
    let ragContext = "";
    const conversationHistory = messages
      .slice(0, -1)
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join("\n");

    const intent = await classifyIntent(lastUserMessage, conversationHistory);

    if (intent.intent === "time") {
      try {
        const tz = intent.timezone || "Asia/Karachi";
        const { time, date, timezone, countryCode, source } = await getCurrentTimeAndLocation(req as any, tz);
        const holidays = await getUpcomingHolidays(countryCode);
        ragContext = `📌 ${source}\n\nCurrent local time and date:\n- 🕐 Time: ${time}\n- 📅 Date: ${date}\n- 🌍 Timezone: ${timezone}`;
        if (holidays.length > 0) {
          ragContext += `\n\n🎉 Upcoming public holidays in ${countryCode}:\n${holidays.map(h => `  • ${h}`).join("\n")}`;
        }
        ragContext += `\n\n❗ Use the exact time, date, and timezone above in your response.`;
      } catch {}
    } else if (intent.intent === "weather") {
      try {
        const tz = intent.timezone || "Asia/Karachi";
        const { latitude, longitude } = getCityCoordinates(tz);
        const weather = await getWeather(latitude, longitude, tz);
        if (weather) ragContext = `🌤️ Current weather: ${weather}\n\nRespond with a friendly weather report.`;
      } catch {}
    } else if (intent.intent === "search") {
      // Deep search – fetch 5‑10 pages and summarize
      try {
        const deepResult = await deepSearch(intent.query);
        if (deepResult) {
          ragContext = `[Deep Web Research]\n\nThe following information was gathered from multiple sources:\n\n${deepResult}\n\nSynthesize a comprehensive answer using only the facts above.`;
        }
      } catch {}
      // Fallback – single-page search if deep search fails
      if (!ragContext) {
        const searchWithTimeout = async (fn: () => Promise<any>, ms: number) => {
          const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
          return Promise.race([fn(), timeout]);
        };
        try { const r = await searchWithTimeout(() => searchSearXNG(intent.query), 3000) as any; if (r?.text) ragContext = `[Web]\n${r.text}\n\n`; } catch {}
        if (!ragContext) {
          try { const r = await searchWithTimeout(() => searchJina(intent.query), 3000) as any; if (r?.text) ragContext = `[Web]\n${r.text}\n\n`; } catch {}
        }
        if (!ragContext) {
          try { const r = await searchWithTimeout(() => searchWikipedia(intent.query), 2000) as any; if (r?.summary) ragContext = `[Wikipedia]\n${r.summary}\n\n`; } catch {}
        }
      }
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

    // ── AUTO‑ROUTING LOGIC (replaced) ───────────────────────
    if (modelTier === "auto") {
      let conversationHistory = messages
        .slice(0, -1)
        .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
        .join("\n");

      const prefixParts: string[] = [];
      // Instead of 'timeContext' we use 'ragContext' (which contains time/weather/search info)
      if (ragContext) prefixParts.push(ragContext);
      if (nameContext || goalContext) prefixParts.push(`${nameContext}${goalContext}`);
      if (prefixParts.length > 0) conversationHistory = `[System context]\n${prefixParts.join("\n")}\n${conversationHistory}`;

      let liveData = "";
      try {
        const jinaResult = await searchJina(lastUserMessage);
        if (jinaResult) liveData = jinaResult.text;
        else {
          const wiki = await searchWikipedia(lastUserMessage);
          if (wiki) liveData = wiki.summary;
        }
      } catch {}

      // Use chain‑of‑thought for complex queries, or standard auto‑route
      let reply = "";
      let tiersUsed: string[] = [];

      if (intent.intent === "reasoning") {
        try {
          const chainResult = await multiStepReason(lastUserMessage, conversationHistory);
          reply = chainResult.reply;
          tiersUsed = ["chain-router"];
        } catch {}
      }

      if (!reply) {
        const result = await autoRoute(lastUserMessage, conversationHistory, liveData);
        reply = result.reply;
        tiersUsed = result.tiersUsed;
      }

      // Clean up any raw JSON that might have been returned
      reply = reply
        .replace(/\{"reply"\s*:\s*"/g, "")   // remove leading JSON wrapper
        .replace(/",\s*"conversationId".*$/, "") // remove trailing JSON fields
        .trim();

      // Remove any "Revised response:" redundancy from reflector
      reply = reply.replace(/\bRevised response:\s*"([^"]*)"\s*/g, "$1").trim();

      // Also strip  tags
      reply = reply.replace(/<think[\s\S]*?<\/think>/gi, "").trim();

      const insertNow = Date.now();
      try {
        await supabase.from("messages").insert([
          { conversation_id: finalConversationId, role: "user", content: lastUserMessage, created_at: new Date(insertNow).toISOString() },
          { conversation_id: finalConversationId, role: "assistant", content: reply, created_at: new Date(insertNow + 1).toISOString() },
        ]);
        await supabase.from("conversations").update({ message_count: (conv?.message_count ?? 0) + 1 }).eq("id", finalConversationId);
      } catch (dbError: any) { console.error("Database store failed:", dbError.message); }

      return NextResponse.json({ reply, conversationId: finalConversationId, tiersUsed });
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
      try { const r = await searchWithTimeout(() => searchSearXNG(lastUserMessage), 3000) as any; if (r?.text) { webContext = `[Web]\n${r.text}\n\n`; wikiLink = r.url || null; } } catch {}
      if (!webContext && modelTier === "live") { try { const r = await searchWithTimeout(() => searchJina(lastUserMessage), 3000) as any; if (r?.text) { webContext = `[Web]\n${r.text}\n\n`; wikiLink = r.url || null; } } catch {} }
      if (!webContext) { try { const r = await searchWithTimeout(() => searchWikipedia(lastUserMessage), 2000) as any; if (r?.summary) { webContext = `[Wikipedia]\n${r.summary}\n\n`; wikiLink = r.url || null; } } catch {} }
    }

    // Build final system prompt
    const baseSystem = tierConfig.systemPrompt;
    const priorityInstruction = webContext
      ? "‼️ CRITICAL: You MUST use the real-time web data provided below to answer the user's question. Extract exact facts, numbers, and names.\n\n"
      : "";

    const fullSystemPrompt = (
      extraContext +
      instructionContext +
      personaContext +
      priorityInstruction +
      (webContext ? webContext : "") +
      (ragContext ? `${ragContext}\n\n` : "") +
      nameContext +
      goalContext +
      baseSystem
    ).trim();

    let reply: string | null = null;
    let usedModel: string | null = null;

    // ── Image understanding ──────────────────────────────────
    const imageUrlMatch = lastUserMessage.match(/https?:\/\/\S+\.(jpg|jpeg|png|gif|webp)/i);
    if (imageUrlMatch) {
      const imageUrl = imageUrlMatch[0];
      try {
        const visionRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: "llama-3.2-11b-vision-preview",
            messages: [{
              role: "user",
              content: [
                { type: "text", text: `Describe this image. User also said: "${lastUserMessage.replace(imageUrl, "").trim()}"` },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            }],
            temperature: 0.3,
            max_tokens: 1000,
          }),
        });
        if (visionRes.ok) {
          const visionData = await visionRes.json();
          reply = visionData.choices[0].message.content;
          usedModel = "llama-3.2-11b-vision-preview";
        }
      } catch {}
    }

    // If no vision reply, proceed with parallel model fallback
    if (!reply) {
      const modelPromises: Promise<{ reply: string; modelName: string } | null>[] = [];
      for (let i = 0; i < Math.min(2, tierConfig.models.length); i++) {
        const modelConfig = tierConfig.models[i];
        const apiKey = process.env[modelConfig.apiKeyEnv];
        if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") continue;
        const modelLimitKey = modelConfig.modelKey || modelTier;
        const { allowed } = await checkModelLimit(supabase, user.id, modelLimitKey);
        if (!allowed) continue;

        modelPromises.push(
          (async () => {
            try {
              let result: string;
              if (modelConfig.provider === "openai") {
                result = await callOpenAICompatible(
                  modelConfig.endpoint, apiKey, modelConfig.modelName,
                  fullSystemPrompt, messages, tierConfig.temperature, tierConfig.maxTokens
                );
              } else if (modelConfig.provider === "gemini") {
                result = await callGemini(
                  modelConfig.endpoint, apiKey, modelConfig.modelName,
                  fullSystemPrompt, messages, tierConfig.temperature, tierConfig.maxTokens
                );
              } else {
                return null;
              }
              await incrementModelUsage(supabase, user.id, modelLimitKey, Math.ceil(result.length / 4));
              return { reply: result, modelName: modelConfig.modelName };
            } catch (err) {
              console.error(`Model ${modelConfig.modelName} failed:`, err);
              return null;
            }
          })()
        );
      }

      const results = await Promise.allSettled(modelPromises);
      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          reply = result.value.reply;
          usedModel = result.value.modelName;
          break;
        }
      }
    }

    // Final fallback error message
    if (!reply) {
      reply = "Sorry, all models are currently unavailable.";
    }

    // 🔍 Self‑reflection: review the reply before storing
    try {
      reply = await reflectOnReply(lastUserMessage, reply, "");
    } catch {}

    // ── Output moderation ──────────────────────────────────
    if (isHarmful(reply)) {
      reply = "There is so much load on servers so currently I'm unable to generate that response. Please ask something else or try again later.";
    }

    // Update persona after reply (fire‑and‑forget)
    Promise.resolve().then(async () => {
      try {
        const updatedPersona = await extractPersona(lastUserMessage, persona);
        await supabase.from("profiles").update({ persona: updatedPersona }).eq("user_id", user.id);
      } catch {}
    });

    const confidence = scoreConfidence(reply);
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
      tiersUsed: usedModel ? [usedModel] : [],
      confidence,
    });
  } catch (error: any) {
    console.error("Chat API error:", error.message);
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}