import { scrapeUrl } from "./scraper";
import { extractAnswerFromSource } from "./groq-extract";

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