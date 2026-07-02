// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { aaiRuntime } from "@/lib/aai";
import { tiers } from "@/lib/model-registry";
import { classifyIntent, getIntentInstruction } from "@/lib/intent-classifier";
import { extractTopic } from "@/lib/memory/topic-extractor";
import { getWeather, getCurrentTimeCard, getCurrentCalendarCard } from "@/lib/services/real-time";

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

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "today";
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) return `${diffWeeks} week(s) ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths} month(s) ago`;
}

// ── Tavily + Firecrawl + Groq search ─────────
async function tavilySearch(query: string): Promise<
  { title: string; url: string; snippet: string }[]
> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: 5,
        include_answer: false,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.slice(0, 300) || "",
    }));
  } catch { return []; }
}

async function firecrawlExtract(url: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return "";
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 10000,
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    if (!data.success) return "";
    return (data.markdown || "").slice(0, 4000);
  } catch { return ""; }
}

// ── Updated extractAnswer (precise numeric extraction) ──
async function extractAnswer(query: string, urls: string[], contents: string[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || contents.length === 0) return "";

  const combined = urls
    .map((url, i) => `[Source ${i + 1}: ${url}]\n${contents[i] || ""}`)
    .join("\n\n");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "groq/compound-mini",
      messages: [
        {
          role: "system",
          content: `You are a precise data extractor. Given a user question and several web sources, extract the EXACT numeric answer with its unit (e.g., "$986.8 billion") and the source name (e.g., "Forbes"). 
- Always pick the MOST RECENT figure.
- If multiple sources disagree, state the range and cite both.
- Include inline citation like [Source 1].
- If no exact number is found, say "I couldn't find a reliable current figure."`,
        },
        { role: "user", content: `Question: ${query}\n\nSources:\n${combined}` },
      ],
      temperature: 0,
      max_tokens: 300,
    }),
  });

  if (!res.ok) return "";
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

// ── Updated performDeepSearch (freshness hints, top 3) ──
async function performDeepSearch(query: string): Promise<string> {
  // 1. Append freshness & authority hints to the query
  const enhancedQuery = `${query} latest most recent Forbes Bloomberg`;
  const results = await tavilySearch(enhancedQuery);
  if (!results.length) return "";

  // 2. Fetch full content of top 3 results via Firecrawl
  const topResults = results.slice(0, 3);
  const urls = topResults.map(r => r.url);
  const snippets = topResults.map(r => r.snippet);
  const fullContents = await Promise.all(urls.map(firecrawlExtract));

  // 3. Combine snippets + full content for extraction
  const allContent = snippets.map((s, i) => `[Source ${i + 1} snippet]: ${s}`).concat(
    fullContents.filter(Boolean).map((c, i) => `[Source ${i + 1} full]: ${c}`)
  );

  const answer = await extractAnswer(
    `What is the current, most recent value for: ${query}? Use ONLY the most recent figure from an authoritative source like Forbes or Bloomberg.`,
    urls,
    allContent
  );
  if (!answer) return "";

  return `\n\n--- REAL-TIME WEB SEARCH ---\n${answer}\n\nSources:\n${urls.map((url, i) => `- [Source ${i + 1}](${url})`).join("\n")}`;
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
    // ── Extract and store topic (fire‑and‑forget) ──
    extractTopic(userMessage).then(async (topic) => {
      if (topic) {
        await supabase
          .from("user_topics")
          .upsert({ user_id: user.id, topic }, { onConflict: "user_id, topic" });
      }
    });
    const convId = conversationId || crypto.randomUUID();

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
      /weather|temperature|rain|forecast|time|clock|date|calendar/i.test(userMessage);
    const isFactualQuery =
      /news|net worth|current|latest|today|202[4-9]|stock|price|how much|how many|who is|what is/i.test(userMessage);
    const shouldSearch = isSpecialService || (diveDeep && isFactualQuery);

    // Flag for response header
    let searchAttempted = false;

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
        } else if (isFactualQuery) {
          const searchUsage = await checkAndUpdateUsage(supabase, user.id, "web_search");
          if (searchUsage.allowed) {
            liveData = await performDeepSearch(userMessage);
          } else {
            // Search limit reached – we'll inject this into system prompt below
          }
        }
      }

      let extendedMessage = "";
      if (profileNote) {
        extendedMessage += `--- USER PROFILE ---\n${profileNote}\n\n`;
      }
      if (liveData) {
        extendedMessage += `--- REAL-TIME DATA (display exactly as is) ---\n${liveData}\nUse this HTML/Markdown directly in your response. Do not modify the HTML.\n\n`;
      }
      if (shouldSearch && !liveData && !isFactualQuery) {
        // no live data but special service failed, nothing to do
      }
      extendedMessage += `[SYSTEM: Target response length is ${tiers.aai.maxTokens} tokens. Stop before that. End with a complete sentence. If you need more room, summarise and suggest upgrading to a higher tier.]\n\nUser: ${userMessage}`;

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

    // ── Inject user topic memory ──
    const { data: topics } = await supabase
      .from("user_topics")
      .select("topic, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (topics && topics.length > 0) {
      const topicLines = topics.map((t: any) => {
        const timeAgo = getTimeAgo(new Date(t.created_at));
        return `- ${t.topic} (${timeAgo})`;
      });
      apiMessages[0].content += `\n\n--- USER TOPIC HISTORY ---\nThe user has previously discussed or expressed interest in these topics:\n${topicLines.join("\n")}\nUse this context to personalize your responses and make relevant connections.`;
    }

    // ── Inject user preferences ──
    apiMessages[0].content += toneInjection;

    // ── Inject intent label (just the label, no forced formatting) ──
    apiMessages[0].content += `\n\nIntent: ${intent}`;

    // ── Dynamic Rich Content Engine ──
    apiMessages[0].content += DYNAMIC_RICH_CONTENT_ENGINE;

    // ── Web search / real-time data injection ──
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
      } else if (isFactualQuery) {
        const searchUsage = await checkAndUpdateUsage(supabase, user.id, "web_search");
        if (searchUsage.allowed) {
          liveData = await performDeepSearch(userMessage);
        } else {
          apiMessages[0].content += `\n\nNote: The user's daily web search limit has been reached. Answer without live data.`;
        }
      }

      if (liveData) {
        apiMessages[0].content += liveData;
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

      // Compute hard cap: double the soft target, minimum 800 tokens
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