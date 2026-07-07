// src/lib/services/wikipedia-search.ts
import FirecrawlApp from "@mendable/firecrawl-js";
import { groqScrape } from "./groq-scraper";

const WIKI_API = "https://en.wikipedia.org/w/api.php";

async function searchWikipediaTitles(query: string, limit = 3): Promise<string[]> {
  const url = `${WIKI_API}?action=opensearch&search=${encodeURIComponent(query)}&limit=${limit}&namespace=0&format=json&origin=*`;
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return data[1] || [];
  } catch {
    return [];
  }
}

// Robust scraper (same logic as in route.ts and live-data.ts)
async function scrapePage(url: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (apiKey) {
    try {
      const fc = new FirecrawlApp({ apiKey });
      const doc = await fc.scrapeUrl(url, {
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 12000,
      });
      const md = (doc as any).markdown || "";
      if (md.trim().length > 200) return md.slice(0, 5000);
    } catch {}
  }

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
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 5000);
  } catch {
    return await groqScrape(url);
  }
}

export async function wikipediaSearch(query: string): Promise<string> {
  const titles = await searchWikipediaTitles(query, 3);
  console.log(`📚 Wikipedia titles found: ${titles.length}`, titles);
  if (titles.length === 0) return "";

  const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(titles[0].replace(/\s/g, "_"))}`;
  const content = await scrapePage(pageUrl);
  console.log(`📄 Wikipedia page content length: ${content?.length || 0}`);
  if (!content || content.length < 50) return "";

  const apiKey = process.env.GROQ_API_KEY_4 || process.env.GROQ_API_KEY;
  if (!apiKey) return "";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
            content: `You are a helpful assistant. Given a Wikipedia article about "${query}", extract the most relevant information to answer the user's question. Provide a concise, factual summary in 3-5 bullet points. Use only the provided content.`,
          },
          { role: "user", content: content.slice(0, 5000) },
        ],
        temperature: 0,
        max_tokens: 400,
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch {
    return "";
  }
}