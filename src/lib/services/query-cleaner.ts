// src/lib/services/query-cleaner.ts

const CLEANER_MODEL = {
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  apiKeyEnv: "GROQ_API_KEY_4",
  model: "groq/compound-mini",
};

export async function cleanSearchQuery(rawMessage: string): Promise<string> {
  // Hard safety: extract the most important entity
  const short = rawMessage
    .replace(/what do you know about|tell me about|who is|what is|do some web searching|by doing web searching/gi, "")
    .trim()
    .slice(0, 50);

  if (short.length < 5) return rawMessage.slice(0, 50);

  const apiKey = process.env.GROQ_API_KEY_4;
  if (!apiKey) return short;

  try {
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
            content: "Extract a single short search term (max 3 words) from the user's message. Return ONLY the term, nothing else. Example: 'Yahoo', 'Elon Musk', 'weather London'.",
          },
          { role: "user", content: rawMessage.slice(0, 200) },
        ],
        temperature: 0,
        max_tokens: 15,
      }),
    });
    if (!res.ok) return short;
    const data = await res.json();
    const term = data.choices?.[0]?.message?.content?.trim();
    return term || short;
  } catch {
    return short;
  }
}