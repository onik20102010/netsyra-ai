const EXTRACTOR_MODEL = {
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  apiKeyEnv: "GROQ_API_KEY",
  model: "llama-3.3-70b-versatile",
};

export async function extractTopic(message: string): Promise<string | null> {
  const apiKey = process.env[EXTRACTOR_MODEL.apiKeyEnv];
  if (!apiKey) return null;

  const systemPrompt =
    "Extract the main topic or subject the user is interested in from their message. Return ONLY a short phrase (max 5 words). If the message is just a greeting or vague, return null. Output null for no topic.";

  try {
    const res = await fetch(EXTRACTOR_MODEL.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EXTRACTOR_MODEL.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0,
        max_tokens: 20,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const topic = data.choices?.[0]?.message?.content?.trim();
    if (!topic || topic.toLowerCase() === "null") return null;
    return topic;
  } catch {
    return null;
  }
}