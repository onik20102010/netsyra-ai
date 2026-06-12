// src/lib/query-rewriter.ts
export async function generateSearchQueries(
  userMessage: string,
  conversationHistory: string
): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return [userMessage]; // fallback

  const prompt = `Generate 3 different search queries to find the most accurate and current answer for the user's question.
Return a JSON object: {"queries":["query1","query2","query3"]}

Conversation history:
${conversationHistory}

User message: "${userMessage}"

Output ONLY JSON.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return [userMessage];
    const data = await response.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    return parsed.queries || [userMessage];
  } catch {
    return [userMessage];
  }
}