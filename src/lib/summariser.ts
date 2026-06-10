// src/lib/summariser.ts
export async function summariseMessages(
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "";

  const text = messages.map(m => `${m.role}: ${m.content}`).join("\n");
  const prompt = `Summarise this conversation into a single paragraph, preserving key facts and context:\n\n${text}\n\nSummary:`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 500,
      }),
    });
    if (!response.ok) return "";
    const data = await response.json();
    return data.choices[0].message.content;
  } catch {
    return "";
  }
}