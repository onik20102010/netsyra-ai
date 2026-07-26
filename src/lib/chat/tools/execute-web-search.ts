// Web Search Execution
// Executes web search using existing search infrastructure

import { performTavilySearch, performWikipediaSearch } from "@/lib/chat/services/live-data";
import { cleanSearchQueries } from "@/lib/chat/services/query-cleaner";
import type { WebSearchArgs } from "./web-search";

export async function executeWebSearch(args: WebSearchArgs): Promise<string> {
  const { query } = args;

  try {
    // Clean the query to extract multiple search queries if needed
    const queries = await cleanSearchQueries(query);
    
    // Try Tavily first, fall back to Wikipedia
    const tavilyResult = await performTavilySearch(queries[0] || query);
    
    if (tavilyResult && tavilyResult.trim().length > 0) {
      return tavilyResult;
    }
    
    // Fall back to Wikipedia
    const wikiResult = await performWikipediaSearch(queries[0] || query);
    
    if (!wikiResult || wikiResult.trim().length === 0) {
      return "No search results found.";
    }

    return wikiResult;
  } catch (error) {
    console.error("Web search execution error:", error);
    return `Failed to perform web search: ${error instanceof Error ? error.message : "Unknown error"}`;
  }
}
