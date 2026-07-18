// ── Universal web search (Tavily + Wikipedia) ──

async function tavilySearchWithAnswer(query: string): Promise<{
  answer: string;
  sources: { title: string; url: string; snippet: string }[];
}> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return { answer: "", sources: [] };

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "advanced",
        max_results: 5,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!res.ok) return { answer: "", sources: [] };
    const data = await res.json();

    return {
      answer: data.answer || "",
      sources: (data.results || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content?.slice(0, 300) || "",
      })),
    };
  } catch {
    return { answer: "", sources: [] };
  }
}

async function wikipediaExtract(query: string): Promise<string> {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return "";
    const searchData = await searchRes.json();
    const title = searchData[1]?.[0];
    if (!title) return "";

    const extractUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&exintro&explaintext&titles=${encodeURIComponent(title)}&format=json&origin=*`;
    const extractRes = await fetch(extractUrl);
    if (!extractRes.ok) return "";
    const extractData = await extractRes.json();
    const pages = extractData.query?.pages;
    const page = pages ? Object.values(pages)[0] as any : null;
    const extract = page?.extract || "";
    if (!extract) return "";

    const sentences = extract.split(". ");
    return sentences.slice(0, 3).join(". ") + ".";
  } catch {
    return "";
  }
}

export async function performMultiDeepSearch(queries: string[]): Promise<string> {
  const results = await Promise.all(queries.map(q => performDeepSearch(q)));
  // Combine results, removing empty ones
  const validResults = results.filter(r => r.trim().length > 0);
  if (validResults.length === 0) return "";
  
  // If only one query had results, return it directly
  if (validResults.length === 1) return validResults[0];
  
  // Otherwise, combine with headers for each topic
  return validResults
    .map((r, i) => `### Topic ${i + 1}: ${queries[i]}\n${r}`)
    .join("\n\n");
}

export async function performDeepSearch(query: string): Promise<string> {
  // 1. Tavily with built‑in answer
  const tavilyResult = await tavilySearchWithAnswer(query);
  if (tavilyResult.answer) {
    let result = `\n\n--- WEB SEARCH ---\n${tavilyResult.answer}`;
    if (tavilyResult.sources.length > 0) {
      result += `\n\n## Sources\n${tavilyResult.sources.map((s) => `- [${s.title}](${s.url})`).join("\n")}`;
    }
    return result;
  }

  // 2. Wikipedia
  const wikiExtract = await wikipediaExtract(query);
  if (wikiExtract) {
    return `\n\n--- WIKIPEDIA ---\n${wikiExtract}\n\nSource: Wikipedia`;
  }

  return "";
}

// New function for N Live direct streaming (no LLM)
export async function performNLiveSearch(query: string): Promise<{
  answer: string;
  sources: { title: string; url: string }[];
  useLLM: boolean; // If true, pass to LLM (Wikipedia fallback)
  platform: string; // "tavily" or "wikipedia" or "none"
}> {
  // 1. Tavily with built‑in answer
  const tavilyResult = await tavilySearchWithAnswer(query);
  if (tavilyResult.answer) {
    console.log(`🔍 N Live Search: Used Tavily for query "${query}"`);
    return {
      answer: tavilyResult.answer,
      sources: tavilyResult.sources.map((s) => ({ title: s.title, url: s.url })),
      useLLM: false, // Stream directly, no LLM needed
      platform: "tavily",
    };
  }

  // 2. Wikipedia fallback (needs LLM to format)
  const wikiExtract = await wikipediaExtract(query);
  if (wikiExtract) {
    console.log(`🔍 N Live Search: Used Wikipedia for query "${query}"`);
    return {
      answer: wikiExtract,
      sources: [{ title: "Wikipedia", url: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}` }],
      useLLM: true, // Pass to LLM for formatting
      platform: "wikipedia",
    };
  }

  // 3. No results
  console.log(`🔍 N Live Search: No results found for query "${query}"`);
  return {
    answer: "",
    sources: [],
    useLLM: false,
    platform: "none",
  };
}

// Minimal stub exports for backward compatibility
export async function extractAnswer() { return ""; }
export async function scrapePage() { return ""; }
export { wikipediaExtract };