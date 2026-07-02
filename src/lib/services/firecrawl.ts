import FirecrawlApp from "@mendable/firecrawl-js";

export async function firecrawlExtract(url: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return "";

  const client = new FirecrawlApp({ apiKey });

  try {
    // scrapeUrl returns a Document, not { success, markdown }
    const doc = await client.scrapeUrl(url, {
      formats: ["markdown"],
      onlyMainContent: true,
      timeout: 10000,
    });

    // Extract the markdown content from the document
    const markdown = (doc as any).markdown || "";
    if (!markdown) {
      console.warn("Firecrawl returned no markdown for", url);
      return "";
    }

    return markdown.slice(0, 3000);
  } catch (err) {
    console.error("Firecrawl extract failed:", err);
    return "";
  }
}