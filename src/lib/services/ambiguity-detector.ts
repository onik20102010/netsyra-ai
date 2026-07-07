// src/lib/services/ambiguity-detector.ts
const CLASSIFIER_MODEL = {
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  apiKeyEnv: "GROQ_API_KEY_4",
  model: "groq/compound-mini",
};

export type SearchDecision = {
  shouldSearch: boolean;
  widget?: "weather" | "time" | "date" | null;
  reason: string;
};

export async function decideSearchAction(userMessage: string): Promise<SearchDecision> {
  const apiKey = process.env[CLASSIFIER_MODEL.apiKeyEnv];
  if (!apiKey) {
    // Fallback: assume search is needed if message is long enough
    return {
      shouldSearch: userMessage.length > 15,
      widget: null,
      reason: "fallback (no API key)",
    };
  }

  try {
    const res = await fetch(CLASSIFIER_MODEL.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CLASSIFIER_MODEL.model,
        messages: [
          {
            role: "system",
            content: `You are a search router. Given a user message, decide what action to take. Return ONLY a JSON object with these fields:
- shouldSearch: true if the user is asking for factual, current, or real‑time information that requires web search. This includes news, net worth, stock prices, weather, time, date, definitions, comparisons, and any question that benefits from up‑to‑date data.
- widget: "weather" if the user is asking about current weather conditions; "time" if asking about current time; "date" if asking about today's date; null otherwise.
- reason: a very short explanation (max 5 words).

Examples:
"What is the weather in London?" → {"shouldSearch":true,"widget":"weather","reason":"weather request"}
"What time is it in Tokyo?" → {"shouldSearch":true,"widget":"time","reason":"time request"}
"What is today's date?" → {"shouldSearch":true,"widget":"date","reason":"date request"}
"Who is Elon Musk?" → {"shouldSearch":true,"widget":null,"reason":"factual question"}
"Tell me about Yahoo" → {"shouldSearch":true,"widget":null,"reason":"entity info"}
"Net worth of Elon Musk" → {"shouldSearch":true,"widget":null,"reason":"financial data"}
"Hello" → {"shouldSearch":false,"widget":null,"reason":"greeting"}
"How are you?" → {"shouldSearch":false,"widget":null,"reason":"greeting"}`,
          },
          { role: "user", content: userMessage.slice(0, 300) },
        ],
        temperature: 0,
        max_tokens: 100,
      }),
    });

    if (!res.ok) return { shouldSearch: false, widget: null, reason: "classifier error" };

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "{}";
    // Extract JSON object (use [\s\S] for cross‑line matching)
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return { shouldSearch: false, widget: null, reason: "parse error" };

    const decision: SearchDecision = JSON.parse(match[0]);
    return decision;
  } catch {
    return { shouldSearch: false, widget: null, reason: "exception" };
  }
}