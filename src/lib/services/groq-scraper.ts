/**
 * Groq‑based scraper fallback.
 * Fetches the HTML directly, then uses Groq to extract the readable text.
 */
export async function groqScrape(url: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY_4 || process.env.GROQ_API_KEY;
  if (!apiKey) return "";

  // 1. Fetch the page with browser‑like headers
  let html = "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.5",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return "";
    html = await res.text();
  } catch {
    return "";
  }

  // 2. Strip scripts and styles to reduce tokens
  const cleanHtml = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 8000); // limit input size

  if (cleanHtml.length < 100) return "";

  // 3. Use Groq to extract the main content
  try {
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "groq/compound-mini",
        messages: [
          {
            role: "system",
            content: "Extract the main textual content from this HTML page. Return only the readable article text, ignoring navigation, ads, and sidebars. Keep paragraphs intact. Limit to 3000 characters.",
          },
          { role: "user", content: cleanHtml },
        ],
        temperature: 0,
        max_tokens: 800,
      }),
    });

    if (!groqRes.ok) return "";
    const data = await groqRes.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch {
    return "";
  }
}