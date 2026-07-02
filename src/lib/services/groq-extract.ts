export async function extractAnswerFromSource(
  query: string,
  sourceMarkdown: string,
  extractionPrompt: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: extractionPrompt,
        },
        {
          role: "user",
          content: `Source content:\n${sourceMarkdown.slice(0, 10000)}\n\nQuery: ${query}`,
        },
      ],
      temperature: 0,
      max_tokens: 200,
    }),
  });

  if (!res.ok) return "";
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}