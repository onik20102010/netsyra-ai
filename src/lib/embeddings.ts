// Uses Gemini embedding model "embedding-001" (free, stable)
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");

  const url = "https://generativelanguage.googleapis.com/v1beta/models/embedding-001:embedContent";

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
    throw new Error(`Embedding error: ${response.status}`);
  }

  const data = await response.json();
  return data.embedding?.values || [];
}