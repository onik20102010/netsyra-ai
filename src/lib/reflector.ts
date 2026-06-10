// src/lib/reflector.ts
export async function reflectOnReply(
  userMessage: string,
  reply: string,
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return reply; // can't reflect, return original

  const prompt = `You are a quality reviewer. Review the following AI response for accuracy, completeness, and safety. If it's fine, return it unchanged. If there are issues, fix them and return the corrected version. Only output the final response.

User question: "${userMessage}"

AI response: "${reply}"

Reviewed response:`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });
    if (!response.ok) return reply;
    const data = await response.json();
    return data.choices[0].message.content;
  } catch {
    return reply;
  }
}