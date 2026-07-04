const CLEANER_MODEL = {
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  apiKeyEnv: "GROQ_API_KEY_4",
  model: "groq/compound-mini",
};

export async function cleanSearchQuery(rawMessage: string): Promise<string> {
  const apiKey = process.env[CLEANER_MODEL.apiKeyEnv];
  if (!apiKey) return rawMessage; // fallback to raw message

  try {
    const res = await fetch(CLEANER_MODEL.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: CLEANER_MODEL.model,
        messages: [
          {
            role: "system",
            content:
              "Extract the core search query from the user's message. Remove instructions like 'tell me', 'by doing web searching', 'find for me', etc. Return ONLY the clean query, nothing else. If the message is already a clean question, return it as is.",
          },
          { role: "user", content: rawMessage },
        ],
        temperature: 0,
        max_tokens: 50,
      }),
    });

    if (!res.ok) return rawMessage;
    const data = await res.json();
    const cleaned = data.choices?.[0]?.message?.content?.trim();
    return cleaned || rawMessage;
  } catch {
    return rawMessage;
  }
}
