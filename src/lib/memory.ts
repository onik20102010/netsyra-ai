import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "./embeddings";

function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function callGroqForExtraction(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing GROQ_API_KEY");

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 500,
    }),
  });

  if (!response.ok) throw new Error(`Groq extraction error: ${response.status}`);
  const data = await response.json();
  return data.choices[0].message.content;
}

export async function extractMemories(
  message: string,
  conversationContext: string
): Promise<{ content: string; importance: number }[]> {
  const prompt = `Extract personal facts from this message. Return a JSON object: {"facts":[{"content":"...","importance":0.0}]}. Only include explicitly stated facts. If nothing, return {"facts":[]}.

User message: "${message}"
Context: ${conversationContext}
Output ONLY JSON.`;

  try {
    const result = await callGroqForExtraction(prompt);
    const parsed = JSON.parse(result);
    return parsed.facts || [];
  } catch {
    return [];
  }
}

export async function storeMemory(userId: string, content: string, importance: number) {
  try {
    const embedding = await generateEmbedding(content);
    const { error } = await getSupabaseClient().from("memories").insert({
      user_id: userId,
      content,
      importance_score: importance,
      embedding,            // ← vector stored correctly
    });
    if (error) console.error("Store memory error:", error.message);
  } catch (err) {
    console.error("Store memory exception:", err);
  }
}

export async function retrieveMemories(userId: string, query: string, limit = 3): Promise<string[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const { data, error } = await getSupabaseClient().rpc("match_memories", {
      query_embedding: queryEmbedding,
      match_threshold: 0.5,
      match_count: limit,
      p_user_id: userId,
    });
    if (error) throw error;
    return (data || []).map((m: any) => m.content);
  } catch {
    return [];
  }
}