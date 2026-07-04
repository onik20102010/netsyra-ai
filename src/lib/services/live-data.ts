import { scrapeUrl } from "./scraper";
import { extractAnswerFromSource } from "./groq-extract";

async function tavilySearch(query: string): Promise<{ title: string; url: string; snippet: string }[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return [];
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: 5,
        include_answer: false,
      }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.content?.slice(0, 300) || "",
    }));
  } catch {
    return [];
  }
}

async function firecrawlExtract(url: string): Promise<string> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) return "";
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: true,
        timeout: 10000,
      }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    if (!data.success) return "";
    return (data.markdown || "").slice(0, 4000);
  } catch {
    return "";
  }
}

export const scrapePage = firecrawlExtract;

export async function extractAnswer(query: string, urls: string[], contents: string[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || contents.length === 0) return "";

  const combined = urls
    .map((url, i) => `[Source ${i + 1}: ${url}]\n${contents[i] || ""}`)
    .join("\n\n");

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
          content: `You are a professional web researcher. Given a user question and several web sources, extract the EXACT answer using ONLY the provided sources. Present it as a clear, direct answer with bullet points (one per line) and [Source X] citations. If the sources truly don't contain the answer (not just a search error), say "I couldn't find this specific information." Do NOT mention search errors, Wikipedia missing-article messages, or the search process itself.`,
        },
        { role: "user", content: `Question: ${query}\n\nSources:\n${combined}` },
      ],
      temperature: 0,
      max_tokens: 300,
    }),
  });

  if (!res.ok) return "";
  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

export async function performDeepSearch(query: string): Promise<string> {
  const enhancedQuery = `${query} latest most recent Forbes Bloomberg`;
  const results = await tavilySearch(enhancedQuery);
  if (!results.length) return "";

  const topResults = results.slice(0, 3);
  const urls = topResults.map(r => r.url);
  const snippets = topResults.map(r => r.snippet);
  const fullContents = await Promise.all(urls.map(firecrawlExtract));

  const allContent = snippets.map((s, i) => `[Source ${i + 1} snippet]: ${s}`).concat(
    fullContents.filter(Boolean).map((c, i) => `[Source ${i + 1} full]: ${c}`)
  );

  const answer = await extractAnswer(
    `What is the current, most recent value for: ${query}? Use ONLY the most recent figure from an authoritative source like Forbes or Bloomberg.`,
    urls,
    allContent
  );
  if (!answer) return "";

  return `\n\n--- REAL-TIME WEB SEARCH ---\n${answer}\n\nSources:\n${urls.map((url, i) => `- [Source ${i + 1}](${url})`).join("\n")}`;
}

// ── Generic Firecrawl scrape + Groq extraction ──
async function scrapeAndExtract(
  url: string,
  query: string,
  extractionPrompt: string
): Promise<string> {
  try {
    const markdown = await scrapeUrl(url);
    if (!markdown) return "";
    return await extractAnswerFromSource(query, markdown, extractionPrompt);
  } catch {
    return "";
  }
}

// ── Sports: Player goals / stats ──────────────
export async function getFootballPlayerGoals(playerName: string): Promise<string> {
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(playerName.replace(/\s/g, "_"))}`;
  return await scrapeAndExtract(
    url,
    `How many career goals has ${playerName} scored?`,
    "Extract the exact number of career goals for this player from the infobox or statistics table. If not found, return 'not found'."
  );
}

// ── Cricket match results ─────────────────────
export async function getCricketScore(matchQuery: string): Promise<string> {
  const searchUrl = `https://www.espncricinfo.com/search?q=${encodeURIComponent(matchQuery)}`;
  return await scrapeAndExtract(
    searchUrl,
    `What is the latest score or result for ${matchQuery}?`,
    "Extract the current score, result, or summary of the match."
  );
}

// ── Education: Wikipedia summary ──────────────
export async function getWikipediaSummary(topic: string): Promise<string> {
  const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/\s/g, "_"))}`;
  return await scrapeAndExtract(
    url,
    `Provide a brief summary of ${topic}`,
    "Extract the first 2-3 sentences of the article that give a concise summary."
  );
}

// ── Current Events (news from Reuters/BBC) ────
export async function getCurrentEvents(): Promise<string> {
  const url = "https://www.reuters.com/world/";
  return await scrapeAndExtract(
    url,
    "What are the top world news headlines right now?",
    "List the top 5 news headlines with a one-sentence description each."
  );
}

// ── Financial data: Forbes net worth ───────────
export async function getForbesNetWorth(personName: string): Promise<string> {
  const url = "https://www.forbes.com/real-time-billionaires/";
  return await scrapeAndExtract(
    url,
    `What is the net worth of ${personName}?`,
    `Extract the exact net worth of ${personName} from the list. Return ONLY the number with unit (e.g., "$986.8 billion"). If not found, return "not found".`
  );
}

// ── Stock price via Yahoo Finance ─────────────
export async function getStockPrice(symbol: string): Promise<string> {
  const url = `https://finance.yahoo.com/quote/${symbol}`;
  return await scrapeAndExtract(
    url,
    `What is the current stock price of ${symbol}?`,
    "Extract the current price as a number with currency (e.g., '$190.53')."
  );
}