// src/lib/summariser.ts
export async function summariseMessages(
  messages: { role: string; content: string }[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || messages.length === 0) return "";

  const text = messages.map(m => `${m.role}: ${m.content}`).join("\n");

  const prompt = `Summarise this conversation into a single paragraph, preserving key facts and context. Only output the summary, nothing else.

Conversation:
${text}

Summary:`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.choices[0].message.content.trim();
  } catch {
    return "";
  }
}