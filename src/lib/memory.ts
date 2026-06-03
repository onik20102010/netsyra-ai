// src/lib/memory.ts
import { createClient } from "@supabase/supabase-js";

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
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 500,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq extraction error: ${response.status} ${err}`);
  }

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
  } catch (err) {
    console.error("Memory extraction failed:", err);
    return [];
  }
}

export async function storeMemory(
  userId: string,
  content: string,
  importance: number
) {
  try {
    console.log(`Storing memory for user ${userId}: "${content}"`);
    const { error } = await getSupabaseClient().from("memories").insert({
      user_id: userId,
      content,
      importance_score: importance,
      embedding: null,   // no embedding needed
    });
    if (error) {
      console.error("Store memory error:", error.message);
    } else {
      console.log("Memory stored successfully");
    }
  } catch (err) {
    console.error("Store memory exception:", err);
  }
}

export async function retrieveMemories(
  userId: string,
  query: string,
  limit = 3
): Promise<string[]> {
  try {
    // Simple keyword matching instead of vector search
    const keywords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    if (keywords.length === 0) return [];

    let dbQuery = getSupabaseClient()
      .from("memories")
      .select("content")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);   // fetch recent 20, then filter

    const { data, error } = await dbQuery;
    if (error) {
      console.error("Retrieve error:", error.message);
      return [];
    }

    // Filter memories that contain any of the query keywords
    const matches = (data || [])
      .filter((m: any) => keywords.some(kw => m.content.toLowerCase().includes(kw)))
      .slice(0, limit);

    console.log(`Found ${matches.length} matching memories`);
    return matches.map((m: any) => m.content);
  } catch (err) {
    console.error("Retrieve exception:", err);
    return [];
  }
}

export async function getOrCreateProfile(userId: string) {
  const { data } = await getSupabaseClient()
    .from("profiles")
    .select()
    .eq("user_id", userId)
    .single();

  if (!data) {
    await getSupabaseClient().from("profiles").insert({ user_id: userId });
    return { id: userId, name: null };
  }
  return data;
}