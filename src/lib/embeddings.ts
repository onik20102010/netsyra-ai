// Gemini text-embedding-004 (free tier, 768 dimensions)
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const url =
  "https://generativelanguage.googleapis.com/v1/models/text-embedding-004:embedContent";
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      content: { parts: [{ text: text.replace(/\n/g, " ") }] },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Embedding error: ${response.status} ${err}`);
  }

  const data = await response.json();
  return data.embedding?.values || [];
}