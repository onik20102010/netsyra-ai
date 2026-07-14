import FirecrawlApp from "@mendable/firecrawl-js";

const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY! });

export async function scrapeUrl(url: string): Promise<string> {
  // 1. Try Firecrawl
  try {
    const doc = await firecrawl.scrapeUrl(url, {
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 15000,
    });
    const markdown = (doc as any).markdown || "";
    if (markdown.trim().length > 200) return markdown.slice(0, 5000);
  } catch (err) {
    console.warn("Firecrawl failed, falling back:", err);
  }

  // 2. Fallback: direct fetch
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

    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&[a-z]+;/g, " ") // remove HTML entities
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);
    return text;
  } catch {
    return "";
  }
}