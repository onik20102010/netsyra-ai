// src/app/api/chat/route.ts
import { NextRequest } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getNextGroqKey } from "@/lib/scale";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const body = await req.json();
  const { messages, modelTier = "fast" } = body;

  const userMsg = messages?.[messages.length - 1]?.content || "";
  if (!userMsg) return new Response("Missing message", { status: 400 });

  // Simple system prompt (you can swap in your full tier system later)
  const systemPrompt = `You are Netsyra AI, a helpful assistant. Answer the user concisely.`;

  const apiKey = getNextGroqKey();
  const model = "llama-3.1-8b-instant";

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        ...(messages || []).slice(-8).map((m: any) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    return new Response(err, { status: response.status });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}