const GROQ_API_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const EXTRACTOR_MODEL = "llama-3.3-70b-versatile"; // fast & cheap
const MAX_TOKENS = 150; // short summary

export async function extractAndSummarize(
  url: string,
  contextQuery: string
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "";

  try {
    // Fetch page content with a timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!response.ok) return "";

    const html = await response.text();
    // Basic HTML stripping – remove scripts, styles, and tags
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000); // limit input size

    if (!text) return "";

    // Summarize using Groq
    const res = await fetch(GROQ_API_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: EXTRACTOR_MODEL,
        messages: [
          {
            role: "system",
            content: `You are a search assistant. Given a webpage text and a user query, summarize the key information relevant to the query in 3 concise bullet points. Only include factual information from the page. No speculation.`,
          },
          {
            role: "user",
            content: `User query: "${contextQuery}"\n\nWebpage content:\n${text}`,
          },
        ],
        temperature: 0,
        max_tokens: MAX_TOKENS,
      }),
    });

    if (!res.ok) return "";

    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch (err) {
    console.warn("Content extraction failed for", url, err);
    return "";
  }
}