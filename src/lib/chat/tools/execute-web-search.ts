// Web Search Execution — plan-aware provider cascade (no limits)
//
// Provider order:
//   Free:    Tavily → Wikipedia
//   Paid:    Serper → Tavily → Wikipedia

import { performTavilySearch, performWikipediaSearch, performSerperSearch } from "@/lib/chat/services/live-data";
import { cleanSearchQueries } from "@/lib/chat/services/query-cleaner";
import type { WebSearchArgs } from "./web-search";

export async function executeWebSearch(args: WebSearchArgs): Promise<{ result: string; sources: { title: string; url: string }[] }> {
  const { query, isPaidUser = false } = args;

  try {
    // Clean the query to extract multiple search queries if needed
    const queries = await cleanSearchQueries(query);

    let searchResult = "";

    // Paid users: Try Serper first, then Tavily, then Wikipedia
    // Free users: Try Tavily first, then Wikipedia
    if (isPaidUser) {
      console.log(`🔍 Web Search (Paid): Using Serper`);
      searchResult = await performSerperSearch(queries[0] || query);

      if (!searchResult || searchResult.trim().length === 0) {
        console.log(`🔄 Serper failed, falling back to Tavily`);
        searchResult = await performTavilySearch(queries[0] || query);
      }

      if (!searchResult || searchResult.trim().length === 0) {
        console.log(`🔄 Tavily failed, falling back to Wikipedia`);
        searchResult = await performWikipediaSearch(queries[0] || query);
      }
    } else {
      console.log(`🔍 Web Search (Free): Using Tavily`);
      searchResult = await performTavilySearch(queries[0] || query);

      if (!searchResult || searchResult.trim().length === 0) {
        console.log(`🔄 Tavily failed, falling back to Wikipedia`);
        searchResult = await performWikipediaSearch(queries[0] || query);
      }
    }

    if (!searchResult || searchResult.trim().length === 0) {
      return { result: "No search results found.", sources: [] };
    }

    // Parse sources from markdown links in the result
    const sources: { title: string; url: string }[] = [];
    const sourceRegex = /-\s*\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = sourceRegex.exec(searchResult)) !== null) {
      sources.push({ title: match[1], url: match[2] });
    }

    return { result: searchResult, sources };
  } catch (error) {
    console.error("Web search execution error:", error);
    return {
      result: `Failed to perform web search: ${error instanceof Error ? error.message : "Unknown error"}`,
      sources: [],
    };
  }
}
