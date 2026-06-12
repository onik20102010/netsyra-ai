// src/lib/intent.ts

type IntentResult = {
  intent: "time" | "weather" | "search" | "none";
  query: string;
  timezone?: string;
  countryCode?: string;
};

function fallbackIntent(userMessage: string): IntentResult {
  const lower = userMessage.toLowerCase();

  if (lower.includes("what time") || lower.includes("time in")) {
    return { intent: "time", query: userMessage };
  }
  if (lower.includes("weather") || lower.includes("temperature")) {
    return { intent: "weather", query: userMessage };
  }
  if (
    lower.includes("latest") || lower.includes("news") ||
    lower.includes("current") || lower.includes("net worth") ||
    lower.includes("price") || lower.includes("stock") ||
    lower.includes("elon") || lower.includes("musk") ||
    lower.includes("2026") || lower.includes("today") ||
    lower.includes("who won") || lower.includes("score") ||
    lower.includes("who is") || lower.includes("what is") ||
    lower.includes("how many") || lower.includes("when did")
  ) {
    return { intent: "search", query: userMessage };
  }
  return { intent: "none", query: userMessage };
}

export async function classifyIntent(
  userMessage: string,
  conversationHistory: string
): Promise<IntentResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fallbackIntent(userMessage);

  const prompt = `Classify the user's intent. Return ONLY a JSON object with these fields:
- "intent": one of "time", "weather", "search", or "none"
- "query": a clean search query (or the original message if not a search)
- "timezone": IANA timezone string if relevant, else ""
- "countryCode": ISO country code if relevant, else ""

Conversation context:
${conversationHistory}

User message: "${userMessage}"

Output ONLY JSON, nothing else. Example: {"intent":"search","query":"Elon Musk net worth 2026","timezone":"","countryCode":""}`;

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
      }),
    });

    if (!response.ok) {
      // Any non‑200 response → fall back to keyword check
      console.warn(`Intent classifier returned ${response.status}, using fallback`);
      return fallbackIntent(userMessage);
    }

    const data = await response.json();
    const raw = data.choices[0].message.content.trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallbackIntent(userMessage);

    const parsed = JSON.parse(jsonMatch[0]);
    return {
      intent: parsed.intent || "none",
      query: parsed.query || userMessage,
      timezone: parsed.timezone || undefined,
      countryCode: parsed.countryCode || undefined,
    };
  } catch (err) {
    console.error("Intent classification failed:", err);
    return fallbackIntent(userMessage);
  }
}