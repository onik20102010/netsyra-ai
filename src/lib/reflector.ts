// src/lib/reflector.ts
export async function reflectOnReply(
  userMessage: string,
  reply: string,
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return reply;

  const prompt = `Review the following AI response for accuracy, completeness, and safety. If it's fine, return the EXACT SAME text with NO changes. If there are issues, fix ONLY the problematic parts and return the corrected version. Do NOT add any extra text like "Revised response:" or "Corrected version:". Just output the final response.

User question: "${userMessage}"

AI response: "${reply}"

Output ONLY the final response:`;

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
    const reflected = data.choices[0].message.content.trim();

    // If the reflector returned the original with minor changes, use it; otherwise keep original
    if (reflected && reflected.length > 10 && reflected !== reply) return reflected;
    return reply;
  } catch {
    return reply;
  }
}