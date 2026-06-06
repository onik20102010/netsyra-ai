// src/lib/intent.ts

type IntentResult = {
  intent: "time" | "weather" | "search" | "none";
  query: string;
  timezone?: string;
  countryCode?: string;
};

export async function classifyIntent(
  userMessage: string,
  conversationHistory: string
): Promise<IntentResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { intent: "none", query: userMessage };

  const prompt = `You are an intent classifier for an AI assistant. Given the user message and conversation context, determine if the user is asking for:

- "time": current time or date, possibly in a specific city (e.g., "what time is it in Tokyo?")
- "weather": current weather or temperature in a location
- "search": factual, real‑world information that requires a web search (e.g., news, stock prices, sports scores, latest events, who won…, etc.)
- "none": general conversation, advice, or anything that does NOT require live external data.

Return a JSON object with:
{
  "intent": "time" | "weather" | "search" | "none",
  "query": "a clean search query for the retrieval step",
  "timezone": "IANA timezone name (only for 'time' intent, e.g. 'Asia/Tokyo', else empty string)",
  "countryCode": "ISO country code (only for 'weather' or 'time' intent, else empty string)"
}

Conversation history:
${conversationHistory}

User message: "${userMessage}"

Output ONLY JSON.`;

  try {
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
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) throw new Error(`Classifier error: ${response.status}`);
    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    return {
      intent: parsed.intent || "none",
      query: parsed.query || userMessage,
      timezone: parsed.timezone || undefined,
      countryCode: parsed.countryCode || undefined,
    };
  } catch (err) {
    console.error("Intent classification failed:", err);
    return { intent: "none", query: userMessage };
  }
}