// src/lib/deep-search.ts

async function fetchWithTimeout(url: string, ms: number): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();
    // Quick text extraction – remove scripts/styles, get body text
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .substring(0, 1500);
    return text;
  } catch {
    return null;
  }
}

export async function deepSearch(query: string): Promise<string> {
  // Step 1 – get top URLs from SearXNG
  const urls: string[] = [];
  try {
    const params = new URLSearchParams({ q: query, format: "json", categories: "general" });
    const res = await fetch(`https://searx.be/search?${params}`, { headers: { Accept: "application/json" } });
    if (res.ok) {
      const data = await res.json();
      urls.push(...(data.results || []).slice(0, 8).map((r: any) => r.url as string));
    }
  } catch {}

  // Fallback – use Jina to get a few results
  if (urls.length === 0) {
    try {
      const jinaKey = process.env.JINA_API_KEY;
      if (jinaKey) {
        const res = await fetch(`https://s.jina.ai/${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${jinaKey}`, Accept: "application/json" },
        });
        if (res.ok) {
          const data = await res.json();
          urls.push(...(data.data || []).slice(0, 8).map((r: any) => r.url as string));
        }
      }
    } catch {}
  }

  if (urls.length === 0) return "";

  // Step 2 – fetch each page with a 2‑second timeout
  const pagePromises = urls.map((url) => fetchWithTimeout(url, 2000));
  const pages = (await Promise.all(pagePromises)).filter(Boolean) as string[];

  if (pages.length === 0) return "";

  // Step 3 – summarise all pages into one compact context
  const combined = pages.map((p, i) => `[Source ${i + 1}]\n${p}`).join("\n\n");

  // Step 4 – if the combined text is too long, trim intelligently
  const maxChars = 6000;
  if (combined.length > maxChars) {
    const perPage = Math.floor(maxChars / pages.length);
    const trimmed = pages.map((p, i) => `[Source ${i + 1}]\n${p.substring(0, perPage)}`).join("\n\n");
    return trimmed;
  }

  return combined;
}