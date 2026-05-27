import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "./embeddings";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const extractionModels = [
  "gemini-2.0-flash-lite",
  "gemini-1.5-flash",
  "gemini-2.5-flash",
];

async function callGeminiForExtraction(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  for (const model of extractionModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0, maxOutputTokens: 1024 },
        }),
      });

      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } catch {
      // silently try next model
    }
  }

  throw new Error("All extraction models temporarily unavailable");
}

export async function extractMemories(
  message: string,
  conversationContext: string
): Promise<{ content: string; importance: number }[]> {
  const prompt = `You are a memory extraction AI. Given the user message and conversation context, extract any important personal facts or preferences the user reveals.

Return a JSON object with a key "facts" that contains an array of objects, each with "content" (a concise statement, e.g. "User's name is Onik", "User likes pizza") and "importance" (a number from 0 to 1, where 0.1 = casual mention, 0.9 = core identity).

Only return facts that are explicitly stated. If nothing important, return {"facts": []}.

Conversation context:
${conversationContext}

User message: "${message}"

Output JSON only.`;

  try {
    const result = await callGeminiForExtraction(prompt);
    const parsed = JSON.parse(result);
    return parsed.facts || [];
  } catch {
    // Silently ignore  memory extraction is noncritical
    return [];
  }
}

export async function storeMemory(
  userId: string,
  content: string,
  importance: number
) {
  try {
    const embedding = await generateEmbedding(content);
    await supabaseAdmin.from("memories").insert({
      user_id: userId,
      content,
      importance_score: importance,
      embedding,
    });
  } catch {
    // Silently ignore  embedding may be unavailable on free tier
  }
}

export async function retrieveMemories(
  userId: string,
  query: string,
  limit = 3
): Promise<string[]> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const { data, error } = await supabaseAdmin.rpc("match_memories", {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
      p_user_id: userId,
    });

    if (error) throw error;
    return data.map((m: any) => m.content);
  } catch {
    // Silently ignore  embedding or vector search temporarily unavailable
    return [];
  }
}

export async function getOrCreateProfile(userId: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select()
    .eq("user_id", userId)
    .single();

  if (!data) {
    await supabaseAdmin.from("profiles").insert({ user_id: userId });
    return { id: userId, name: null };
  }
  return data;
}
