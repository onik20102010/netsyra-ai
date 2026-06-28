import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { aaiRuntime } from "@/lib/aai";
import { tiers } from "@/lib/model-registry";

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

  // No record or limit period expired → reset
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

  // Increment usage
  await supabase
    .from("chat_usage")
    .update({ messages_used: usage.messages_used + 1 })
    .eq("user_id", userId)
    .eq("model_tier", modelTier);

  return { allowed: true, remaining: limit - (usage.messages_used + 1), resetAt: usage.reset_at };
}

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

    // Enforce 80‑line limit per message
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

    // Check rate limit for the selected tier
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

    // Create conversation if new
    if (newConversation || !conversationId) {
      await createConversation(supabase, user.id, convId, userMessage);
    }

    // Save user message
    await saveMessage(supabase, user.id, convId, "user", userMessage);

    // ── AAI branch ─────────────────────────────
    if (modelTier === "aai") {
      const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role,
        content: m.content,
        id: m.id,
        timestamp: Date.now(),
      }));

      const aaiResult = await aaiRuntime.processRequest({
        userMessage,
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

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "x-conversation-id": convId,
        },
      });
    }

    // ── Regular tier with fallback ────────────
    const tier = tiers[modelTier as keyof typeof tiers] || tiers.fast;
    const apiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: tier.systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    let lastError: string | null = null;

    for (const modelConfig of tier.models) {
      const apiKey = process.env[modelConfig.apiKeyEnv];
      if (!apiKey) {
        lastError = `Missing API key for ${modelConfig.modelKey}`;
        continue;
      }

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
              maxOutputTokens: tier.maxTokens,
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

          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
              "x-conversation-id": convId,
            },
          });
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
            max_tokens: tier.maxTokens,
            stream: true,
          }),
        });

        if (!aiRes.ok) {
          const errorText = await aiRes.text();
          console.warn(`Model ${modelConfig.modelName} failed:`, errorText);
          lastError = errorText;
          continue;
        }

        // Stream and accumulate
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

              // Save the full assistant message to DB
              saveMessage(supabase, user.id, convId, "assistant", fullContent).catch(console.error);

              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
            } catch (error) {
              console.error("Stream error:", error);
              controller.error(error);
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
            "x-conversation-id": convId,
          },
        });
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