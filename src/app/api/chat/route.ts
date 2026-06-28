import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { aaiRuntime } from "@/lib/aai";
import { tiers } from "@/lib/model-registry";

export async function POST(req: NextRequest) {
  try {
    // Authenticate user
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

    // Get last user message
    const lastMessage = messages[messages.length - 1];
    const userMessage = lastMessage.content;

    // Check if user selected AAI model
    if (modelTier === "aai") {
      const history = messages.slice(0, -1).map((m: any) => ({
        role: m.role,
        content: m.content,
        id: m.id,
        timestamp: Date.now(),
      }));

      // AAI runtime returns a plain object with { response, ... }
      const aaiResult = await aaiRuntime.processRequest({
        userMessage,
        conversationHistory: history,
        modelTier,
        metadata: {
          conversationId,
          userId: user.id,
        },
      });

      const replyText = aaiResult.response || "";

      // Stream the reply text chunk by chunk as SSE
      const encoder = new TextEncoder();
      const words = replyText.split(" ");

      const stream = new ReadableStream({
        async start(controller) {
          for (const word of words) {
            const chunk = {
              choices: [{ delta: { content: word + " " } }],
            };
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            // optional tiny delay for streaming feel
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
          "x-conversation-id": conversationId || "",
        },
      });
    }

    // ── Regular tier with fallback ────────────────────────
    const tier = tiers[modelTier as keyof typeof tiers] || tiers.fast;

    // Build messages array with system prompt (same for all models)
    const apiMessages: Array<{ role: string; content: string }> = [
      { role: "system", content: tier.systemPrompt },
      ...messages.map((m: any) => ({ role: m.role, content: m.content })),
    ];

    let lastError: string | null = null;

    // Try each model in order
    for (const modelConfig of tier.models) {
      const apiKey = process.env[modelConfig.apiKeyEnv];
      if (!apiKey) {
        lastError = `Missing API key for ${modelConfig.modelKey}`;
        continue; // try next model
      }

      try {
        // ── Gemini branch ──────────────────────────────────
        if (modelConfig.provider === "gemini") {
          const geminiUrl = `${modelConfig.endpoint}?key=${apiKey}`;

          // Separate system instructions from conversation
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
            continue; // try next model
          }

          const data = await aiRes.json();
          const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
          if (!replyText.trim()) {
            lastError = "Empty response from Gemini";
            continue;
          }

          // Stream word‑by‑word
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
              "x-conversation-id": conversationId || "",
            },
          });
        }

        // ── Default (OpenAI‑style) branch ─────────────────
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
          continue; // try next model
        }

        // Stream the response
        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
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
                      controller.enqueue(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
                    }
                  } catch (e) {
                    // Skip invalid JSON
                  }
                }
              }
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
            "x-conversation-id": conversationId || "",
          },
        });
      } catch (fetchError: any) {
        console.warn(`Model ${modelConfig.modelName} threw an error:`, fetchError);
        lastError = fetchError.message || "Unknown fetch error";
        // Continue to next model
      }
    }

    // If we reach here, all models failed
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