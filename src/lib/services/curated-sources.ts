// ─────────────────────────────────────────────
// CURATED KNOWLEDGE BASE
// Add trusted URLs below. The AI will crawl these
// first when a user's query matches via LLM router.
// If nothing matches, it falls back to live web search.
// ─────────────────────────────────────────────

export interface CuratedSource {
  url: string;
  title: string;
}

export const CURATED_SOURCES: CuratedSource[] = [
  { url: "https://en.wikipedia.org/wiki/Isaac_Newton", title: "Isaac Newton" },
  { url: "https://en.wikipedia.org/wiki/Cristiano_Ronaldo", title: "Cristiano Ronaldo" },
  { url: "https://microsoft.com", title: "microsoft" },
  // add more as needed
];