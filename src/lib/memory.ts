const EXTRACTOR_MODEL = {
  endpoint: "https://api.groq.com/openai/v1/chat/completions",
  apiKeyEnv: "GROQ_API_KEY",
  model: "llama-3.3-70b-versatile",
};

export async function extractPersonaNote(message: string): Promise<string | null> {
  const apiKey = process.env[EXTRACTOR_MODEL.apiKeyEnv];
  if (!apiKey) return null;

  const systemPrompt = `The user may ask you to adopt a specific persona, tone, or behavior (e.g., "act like a pokemon", "be a strict teacher", "always use emojis"). Extract the exact instruction as a short, imperative sentence that describes how you should behave. If no such instruction is present, return null. Examples:
  "You are my pokemon" → "Act like a Pokemon and respond with 'Pika pika' sometimes."
  "Be very formal" → "Use formal language and address the user as Sir/Madam."
  "I am sad" → null`;

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
        max_tokens: 100,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const note = data.choices?.[0]?.message?.content?.trim();
    if (!note || note.toLowerCase() === "null") return null;
    return note;
  } catch { return null; }
}