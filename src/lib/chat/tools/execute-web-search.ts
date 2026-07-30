// Web Search Execution — plan-aware provider cascade with limit enforcement
//
// Provider order:
//   Free:    Tavily → Wikipedia
//   Paid:    Serper → Tavily → Wikipedia
//
// Limits (per time window):
//   Free:    3 searches / 24h
//   Go Plus: 100 searches / 6h
//   Pro:     200 searches / 6h
//   Plus Pro: 250 searches / 6h

import { performTavilySearch, performWikipediaSearch, performSerperSearch } from "@/lib/chat/services/live-data";
import { cleanSearchQueries } from "@/lib/chat/services/query-cleaner";
import { checkWebSearchLimit, incrementWebSearchUsage } from "@/lib/chat/web-search-limiter";
import type { WebSearchArgs } from "./web-search";

export async function executeWebSearch(args: WebSearchArgs): Promise<{ result: string; sources: { title: string; url: string }[] }> {
  const { query, userId, limit, windowHours, isPaidUser = false } = args;

  try {
    // ── Check search limit ──
    if (userId && limit && windowHours) {
      const limitCheck = await checkWebSearchLimit(userId, limit, windowHours);
      if (!limitCheck.allowed) {
        return {
          result: `Web search limit reached (${limitCheck.used}/${limitCheck.limit} in the last ${windowHours}h). Please try again later.`,
          sources: [],
        };
      }
    }

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
    
    // Increment usage counter if a search was actually performed
    if (searchResult && searchResult.trim().length > 0 && userId) {
      await incrementWebSearchUsage(userId);
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
