// src/lib/persona.ts
export async function extractPersona(
  message: string,
  existingPersona: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return existingPersona;

  const prompt = `Analyze this user message and update the persona summary. Keep it under 50 words. Focus on tone, detail level, and preferred style.

Existing persona: "${existingPersona}"

User message: "${message}"

Updated persona:`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
        max_tokens: 100,
      }),
    });
    if (!response.ok) return existingPersona;
    const data = await response.json();
    return data.choices[0].message.content;
  } catch {
    return existingPersona;
  }
}