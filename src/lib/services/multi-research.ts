import { scrapePage } from "./live-data";   // your existing scraper (Firecrawl + fallback)
import { routeToCuratedSources } from "./curated-router";

// ── Step 1: Decompose user question into atomic searches ──
async function decomposeQuery(query: string): Promise<string[]> {
  const apiKey = process.env.GROQ_API_KEY_4 || process.env.GROQ_API_KEY;
  if (!apiKey) return [query];

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
            content: `Break down the user's research question into a list of short, specific web searches. Each search should target one piece of information (e.g., "Elon Musk age", "Mark Rober subscribers", "Elon Musk net worth Forbes"). Return ONLY a JSON array of strings. Max 5 searches. Example: ["Elon Musk biography Wikipedia","Mark Rober YouTube subscribers","Elon Musk net worth Forbes"]`,
          },
          { role: "user", content: query },
        ],
        temperature: 0,
        max_tokens: 200,
      }),
    });

    if (!res.ok) return [query];
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [query];
    const searches: string[] = JSON.parse(match[0]);
    return searches.length > 0 ? searches : [query];
  } catch {
    return [query];
  }
}

// ── Step 2: Run a single atomic search ──
async function atomicSearch(query: string): Promise<{ content: string; url: string; title: string } | null> {
  // a) Try curated sources first
  const curated = await routeToCuratedSources(query);
  if (curated.length > 0) {
    const source = curated[0];
    const content = await scrapePage(source.url);
    if (content && content.length > 100) {
      return { content, url: source.url, title: source.title };
    }
  }

  // b) Tavily search
  try {
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (tavilyKey) {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: tavilyKey,
          query,
          search_depth: "basic",
          max_results: 1,
          include_answer: false,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results?.length > 0) {
          const top = data.results[0];
          const content = await scrapePage(top.url);
          if (content && content.length > 100) {
            return { content, url: top.url, title: top.title };
          }
        }
      }
    }
  } catch {}

  // c) Wikipedia fallback
  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json&origin=*`
    );
    if (wikiRes.ok) {
      const wikiData = await wikiRes.json();
      if (wikiData[1]?.length > 0) {
        const title = wikiData[1][0];
        const url = `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s/g, "_"))}`;
        const content = await scrapePage(url);
        if (content && content.length > 100) {
          return { content, url, title };
        }
      }
    }
  } catch {}

  return null;
}

// ── Step 3: Extract a specific fact from a page ──
async function extractFact(
  pageContent: string,
  question: string
): Promise<string> {
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
            content: `Extract the exact answer to the following question from the provided web page content. Return ONLY a short, factual sentence or number. If the information is not found, return "not found". Question: ${question}`,
          },
          { role: "user", content: pageContent.slice(0, 5000) },
        ],
        temperature: 0,
        max_tokens: 150,
      }),
    });

    if (!res.ok) return "";
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "";
  } catch {
    return "";
  }
}

// ── Step 4: Synthesize all findings into a final answer ──
async function synthesize(
  query: string,
  findings: { question: string; answer: string; source: string }[]
): Promise<{ answer: string; sources: { title: string; url: string }[] }> {
  const apiKey = process.env.GROQ_API_KEY_4 || process.env.GROQ_API_KEY;
  if (!apiKey) return { answer: "Research failed.", sources: [] };

  const findingsText = findings
    .map((f) => `Q: ${f.question}\nA: ${f.answer}\nSource: ${f.source}`)
    .join("\n\n");

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
            content: `You are a research assistant. Given a user question and the results of several web searches, create a comprehensive, well-structured answer. Use tables for comparisons, bullet points for lists, and bold for key facts. End with a "## Sources" section listing each source as "- [Title](URL)".`,
          },
          { role: "user", content: `User question: ${query}\n\nResearch findings:\n${findingsText}` },
        ],
        temperature: 0,
        max_tokens: 800,
      }),
    });

    if (!res.ok) return { answer: "Synthesis failed.", sources: [] };

    const data = await res.json();
    const fullAnswer = data.choices?.[0]?.message?.content?.trim() || "";

    // Extract sources from the full answer
    const sourcesRegex = /## Sources\s*\n((?:- \[[^\]]+\]\([^)]+\)\n?)+)/;
    const sourcesMatch = fullAnswer.match(sourcesRegex);
    const cleanAnswer = sourcesMatch ? fullAnswer.replace(sourcesMatch[0], "").trim() : fullAnswer;

    let sources: { title: string; url: string }[] = [];
    if (sourcesMatch) {
      const lines = sourcesMatch[1].match(/- \[([^\]]+)\]\(([^)]+)\)/g);
      sources = (lines || []).map((line: any) => {
        const m = line.match(/- \[([^\]]+)\]\(([^)]+)\)/);
        return { title: m![1], url: m![2] };
      });
    }

    return { answer: cleanAnswer, sources };
  } catch {
    return { answer: "Synthesis failed.", sources: [] };
  }
}

// ── Main export: multi‑source research pipeline ──
export async function performMultiResearch(query: string): Promise<{
  answer: string;
  sources: { title: string; url: string }[];
}> {
  // 1. Decompose
  const subQueries = await decomposeQuery(query);
  console.log(`🔬 Decomposed into ${subQueries.length} searches:`, subQueries);

  // 2. Run all searches in parallel
  const results = await Promise.all(
    subQueries.map(async (q) => {
      const page = await atomicSearch(q);
      if (!page) return { question: q, answer: "not found", source: "" };

      const fact = await extractFact(page.content, q);
      return {
        question: q,
        answer: fact || "not found",
        source: `${page.title} (${page.url})`,
      };
    })
  );

  // 3. Synthesize
  const { answer, sources } = await synthesize(query, results);
  return { answer, sources };
}