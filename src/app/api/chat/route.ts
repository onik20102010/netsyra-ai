import { NextRequest, NextResponse } from "next/server";
import { tiers } from "@/lib/model-registry";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { extractMemories, storeMemory, retrieveMemories } from "@/lib/memory";
import { autoRoute } from "@/lib/router";

// ─── Safe text extractor ─────────────────────────────────────
function getText(content: any): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(part => part?.text || "").join(" ");
  if (content && typeof content === "object") return getText(content.content || content.text || "");
  return "";
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
      await new Promise(r => setTimeout(r, 5000));
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
      await new Promise(r => setTimeout(r, 5000));
    }
    throw new Error(`Gemini error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

// ─── SearXNG real‑time search (free, no API key) ──────────────
async function searchSearXNG(query: string): Promise<{ text: string; url?: string } | null> {
  try {
    // Use a public SearXNG instance (you can replace with your own later)
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

    // Extract top results
    const results = data.results?.slice(0, 5) || [];
    if (results.length === 0) return null;

    // Build a clean text summary
    const snippets = results
      .map((r: any) => `- ${r.title}: ${r.content || r.snippet || ""} (${r.url})`)
      .join("\n");

    // Also collect unique URLs
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

    // Normalize all message content to strings
    const messages = incomingMessages.map((m: any) => ({
      role: m.role,
      content: getText(m.content),
    }));

    const lastUserMessage = messages[messages.length - 1]?.content || "";

    // ── Conversation limit check ──
    if (!conversationId || newConversation) {
      const { count, error: countError } = await supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (countError) {
        return NextResponse.json({ error: "Failed to check conversation limit" }, { status: 500 });
      }

      if ((count ?? 0) >= 5) {
        return NextResponse.json({ error: "You've reached the maximum of 5 conversations. Please delete some to continue." }, { status: 429 });
      }
    }

    // ── AUTO‑ROUTING LOGIC ──────────────────────────────────
    if (modelTier === "auto") {
      const conversationHistory = messages
        .slice(0, -1)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n");

      // Fetch live data (for any live sub‑tasks)
      let liveData = "";
      try {
        const jinaResult = await searchJina(lastUserMessage);
        if (jinaResult) liveData = jinaResult.text;
        else {
          const wiki = await searchWikipedia(lastUserMessage);
          if (wiki) liveData = wiki.summary;
        }
      } catch {}

      // Run the auto router (classify + dispatch + combine)
      const { reply, tiersUsed } = await autoRoute(lastUserMessage, conversationHistory, liveData);

      // Conversation storage
      let finalConversationId = conversationId;
      try {
        if (!conversationId || newConversation) {
          finalConversationId = crypto.randomUUID();
          const title = await generateTitle(lastUserMessage);
          await supabase.from("conversations").insert({
            id: finalConversationId,
            user_id: user.id,
            title,
          });
        }
        await supabase.from("messages").insert([
          { conversation_id: finalConversationId, role: "user", content: lastUserMessage },
          { conversation_id: finalConversationId, role: "assistant", content: reply },
        ]);
      } catch (dbError: any) {
        console.error("Database store failed:", dbError.message);
      }

      // Memory extraction (fire‑and‑forget)
      Promise.resolve().then(async () => {
        try {
          const conversationContext = messages.slice(0, -1).map(m => `${m.role}: ${m.content}`).join("\n");
          const fullContext = `${conversationContext}\nuser: ${lastUserMessage}\nassistant: ${reply}`;
          const facts = await extractMemories(lastUserMessage, fullContext);
          for (const fact of facts) {
            if (fact.importance > 0.3) await storeMemory(user.id, fact.content, fact.importance);
          }
        } catch {}
      });

      return NextResponse.json({
        reply,
        conversationId: finalConversationId,
        tiersUsed,
      });
    }

    // ── NORMAL TIER HANDLING ───────────────────────────────
    const tierConfig = tiers[modelTier as keyof typeof tiers];
    if (!tierConfig) return NextResponse.json({ error: "Invalid tier" }, { status: 400 });

// ── Real‑time data injection ──
let webContext = "";
let wikiLink: string | null = null;

// Detect if the message is time‑sensitive (for SearXNG trigger)
const timeKeywords = [
  "latest", "current", "today", "now", "2026", "2025",
  "price", "stock", "weather", "news", "happening",
  "recent", "updated", "live", "net worth",
];
const isTimeSensitive = timeKeywords.some((kw) =>
  lastUserMessage.toLowerCase().includes(kw)
);

const shouldFetchLive = modelTier === "live" || diveDeep || isTimeSensitive;

if (shouldFetchLive) {
  // 1. Try SearXNG first (for all tiers when time‑sensitive or live/DiveDeep)
  try {
    const searxResult = await searchSearXNG(lastUserMessage);
    if (searxResult) {
      webContext = `[REAL-TIME WEB DATA (SearXNG)]\n${searxResult.text}\n\n`;
      wikiLink = searxResult.url || null;
      console.log("🌐 SearXNG result first 300 chars:", webContext.substring(0, 300));
    }
  } catch {}

  // 2. Fallback to Jina if SearXNG gave nothing
  if (!webContext) {
    try {
      const jinaResult = await searchJina(lastUserMessage);
      if (jinaResult) {
        webContext = `[REAL-TIME WEB DATA (Jina)]\n${jinaResult.text}\n\n`;
        wikiLink = jinaResult.url || null;
        console.log("🌐 Jina fallback used");
      }
    } catch {}
  }

  // 3. Final fallback to Wikipedia
  if (!webContext) {
    try {
      const wiki = await searchWikipedia(lastUserMessage);
      if (wiki) {
        webContext = `[Wikipedia]\n${wiki.summary}\n\n`;
        wikiLink = wiki.url;
        console.log("📚 Wikipedia fallback used");
      }
    } catch {}
  }

  if (!webContext) {
    console.warn("⚠️ No live data found for query:", lastUserMessage);
  }
}

    // Memory retrieval
    let memoryContext = "";
    try {
      const memories = await retrieveMemories(user.id, lastUserMessage);
      if (memories.length) {
        memoryContext = "Important information about the user:\n" + memories.map(m => `- ${m}`).join("\n");
      }
    } catch {}

    // Build final system prompt
    const baseSystem = tierConfig.systemPrompt;
    const priorityInstruction = webContext
      ? "‼️ CRITICAL: You MUST use the real-time web data provided below to answer the user's question. Extract exact facts, numbers, and names. If the data is insufficient, state clearly what you found and suggest a more specific query.\n\n"
      : "";

    const fullSystemPrompt = (
      priorityInstruction +
      (webContext ? webContext : "") +
      (memoryContext ? `${memoryContext}\n\n` : "") +
      baseSystem
    ).trim();

    // Model fallback
    let reply: string | null = null;
    let lastError: Error | null = null;
    const skippedModels: string[] = [];

    for (const modelConfig of tierConfig.models) {
      const apiKey = process.env[modelConfig.apiKeyEnv];
      if (!apiKey || typeof apiKey !== "string" || apiKey.trim() === "") {
        skippedModels.push(modelConfig.modelName);
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

        if (reply) break;
      } catch (error: any) {
        console.error(`Model ${modelConfig.modelName} failed:`, error.message);
        lastError = error;
        if (error.message.includes("429")) {
          await new Promise(r => setTimeout(r, 3000));
        }
      }
    }

    if (!reply) {
      const msg = skippedModels.length
        ? `No working models. Skipped (missing keys): ${skippedModels.join(", ")}. Last error: ${lastError?.message}`
        : lastError
          ? `All models failed. Last error: ${lastError.message}`
          : `All models are currently unavailable. Please try again later.`;
      return NextResponse.json({ error: msg }, { status: 429 });
    }

        // ── Fallback link injection ─────────────────────────────
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
          // Extract clean links from the result
          const links = (searxResult.text.match(/\(https?:\/\/[^\s)]+\)/g) || [])
            .slice(0, 3)
            .map((link) => link.replace(/[()]/g, ""));
          if (links.length > 0) {
            const linkText = links.map((link, i) => `${i + 1}. [${new URL(link).hostname}](${link})`).join("\n");
            reply = `${reply}\n\n🔗 **Here are some helpful links:**\n${linkText}`;
            // Also update wikiLink if not already set
            if (!wikiLink) wikiLink = links[0];
          }
        }
      } catch {}
    }

    // Conversation storage
    let finalConversationId = conversationId;
    try {
      if (!conversationId || newConversation) {
        finalConversationId = crypto.randomUUID();
        const title = await generateTitle(lastUserMessage);
        await supabase.from("conversations").insert({
          id: finalConversationId,
          user_id: user.id,
          title,
        });
      }

      await supabase.from("messages").insert([
        { conversation_id: finalConversationId, role: "user", content: lastUserMessage },
        { conversation_id: finalConversationId, role: "assistant", content: reply },
      ]);
    } catch (dbError: any) {
      console.error("Database store failed:", dbError.message);
    }

    // Memory extraction (awaited)
    try {
      const conversationContext = messages
        .slice(0, -1)
        .map(m => `${m.role}: ${m.content}`)
        .join("\n");
      const fullContext = conversationContext
        ? `${conversationContext}\nuser: ${lastUserMessage}\nassistant: ${reply}`
        : `user: ${lastUserMessage}\nassistant: ${reply}`;

      const facts = await extractMemories(lastUserMessage, fullContext);
      for (const fact of facts) {
        if (fact.importance > 0.3) {
          await storeMemory(user.id, fact.content, fact.importance);
        }
      }
    } catch (memError: any) {
      console.error("Memory extraction failed:", memError.message);
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