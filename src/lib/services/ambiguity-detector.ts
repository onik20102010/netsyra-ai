const DETECTOR_MODEL = {
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  apiKeyEnv: "GROQ_API_KEY_4",   // small model to keep it fast
  model: "groq/compound-mini",
};

/**
 * Returns true if the query is ambiguous, refers to an unknown entity,
 * or definitely needs real‑time web search to provide a good answer.
 */
export async function shouldForceWebSearch(query: string): Promise<boolean> {
  const apiKey = process.env[DETECTOR_MODEL.apiKeyEnv];
  if (!apiKey) return false;

  try {
    const res = await fetch(DETECTOR_MODEL.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: DETECTOR_MODEL.model,
        messages: [
          {
            role: "system",
            content: `You are a search decision engine. Determine if the following user query requires a real‑time web search to answer correctly. Answer ONLY "true" or "false".
Examples that need web search (true):
- "tell me about that company" (ambiguous – which company?)
- "what's the latest news about that topic?" (current events)
- "explain the meaning of this article" (external reference)
- queries about very new or niche entities you aren't sure about
- "what's the price of bitcoin right now?" (real‑time data)
Examples that DON'T need web search (false):
- "what is 2+2?" (math)
- "tell me a joke" (creative)
- "how are you?" (greeting)`,
          },
          { role: "user", content: query },
        ],
        temperature: 0,
        max_tokens: 5,
      }),
    });

    if (!res.ok) return false;
    const data = await res.json();
    const answer = data.choices?.[0]?.message?.content?.trim().toLowerCase();
    return answer === "true";
  } catch {
    return false;
  }
}