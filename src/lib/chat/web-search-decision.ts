// Web Search Decision Engine
// Determines whether a user message should trigger a web search.
//
// Philosophy: Search ONLY when needed — either the user explicitly asks,
// or the intent falls into a category that requires real-time / external data.
// For everything else (general knowledge, coding, creative writing, etc.),
// the LLM's own knowledge is sufficient.

// ── Intent categories that REQUIRE web search ──────────────────────────
// These are the categories from the user's spec where information changes
// frequently or comes from external sources.

const SEARCH_REQUIRED_INTENTS = new Set([
  "latest_news",
  "current_events",
  "product_research",
  "company_information",
  "local_search",
  "sports",
  "financial_data",
  "government_info",
  "releases",
  "research_papers",
  "community_opinions",
]);

// ── Explicit search request keywords ───────────────────────────────────
// When the user says any of these, search is triggered regardless of intent.

const EXPLICIT_SEARCH_PATTERNS = [
  /\bsearch\s+(the\s+)?(web|internet|online|net)\b/i,
  /\bweb\s*search\b/i,
  /\blook\s+(this\s+)?up\b/i,
  /\bfind\s+(online|on\s+the\s+web|on\s+the\s+internet)\b/i,
  /\bbrowse\s+(for|the)\b/i,
  /\bsearch\s+for\b/i,
  /\bgoogle\s+(this|it|for)\b/i,
  /\bcan\s+you\s+search\b/i,
  /\bdo\s+a\s+search\b/i,
  /\bsearch\s+and\s+(find|tell|give)\b/i,
];

// ── Keyword patterns for each search-required intent ───────────────────
// Fast regex-based detection (no LLM call needed).

const INTENT_KEYWORD_PATTERNS: Array<{ intent: string; patterns: RegExp[] }> = [
  {
    intent: "latest_news",
    patterns: [
      /\b(latest|recent|today'?s|this\s+week'?s|breaking)\s+(news|announcement|update|headline)\b/i,
      /\bwhat\s+happened\s+(today|this\s+week|recently)\b/i,
      /\bnews\s+about\b/i,
      /\bannouncement\s+(from|about)\b/i,
    ],
  },
  {
    intent: "current_events",
    patterns: [
      /\bwho\s+is\s+(the\s+)?(president|prime\s+minister|ceo|leader)\s+(of|in)\b/i,
      /\bwhat'?s\s+happening\s+(in|with)\b/i,
      /\bcurrent\s+(situation|status|state)\s+(in|of)\b/i,
    ],
  },
  {
    intent: "product_research",
    patterns: [
      /\bbest\s+\w+\s+(under|below|around|less\s+than)\s+\$?\d/i,
      /\bcompare\s+\w+\s+vs\s+\w+/i,
      /\b(vs|versus)\s+\w+\s+(review|price|specs|comparison)\b/i,
      /\b\w+\s+review\b/i,
      /\bshould\s+i\s+buy\b/i,
      /\b\d{4}\s+(model|edition|version)\b/i,
    ],
  },
  {
    intent: "company_information",
    patterns: [
      /\b\w+\s+pricing\b/i,
      /\bhow\s+much\s+does\s+\w+\s+cost\b/i,
      /\bdoes\s+\w+\s+support\s+\w+/i,
      /\b\w+\s+(plans|subscription|tiers)\b/i,
    ],
  },
  {
    intent: "local_search",
    patterns: [
      /\b(near\s+me|nearby|close\s+to\s+me|around\s+me)\b/i,
      /\b(restaurants|hotels|dentist|doctor|cafe|gym|store|shop|pharmacy)\s+(in|near|around)\b/i,
      /\bdirections\s+to\b/i,
    ],
  },
  {
    intent: "sports",
    patterns: [
      /\b(today'?s|latest|current)\s+(football|soccer|basketball|cricket|tennis|baseball|hockey)\s+(score|result|match)\b/i,
      /\b(match|game|score)\s+(today|yesterday|tonight)\b/i,
      /\b(points\s+table|standings|league\s+table)\b/i,
      /\b\w+\s+(latest|recent)\s+(goals|runs|wickets|points)\b/i,
      /\bIPL\b/i,
      /\b(world\s+cup|champions\s+league|premier\s+league|nba|nfl|ufc)\b/i,
    ],
  },
  {
    intent: "financial_data",
    patterns: [
      /\b(gold|silver|oil|copper)\s+price\b/i,
      /\b(bitcoin|btc|ethereum|eth|crypto)\s+price\b/i,
      /\b(usd|eur|gbp|pkr|inr|aed)\s+to\s+(usd|eur|gbp|pkr|inr|aed)\b/i,
      /\bexchange\s+rate\b/i,
      /\b\w+\s+stock\s+(price|today|today'?s)\b/i,
      /\b(market|dow|nasdaq|s&p|nifty|nikkei)\s+(today|index)\b/i,
      /\b(tesla|apple|google|microsoft|amazon|nvidia)\s+stock\b/i,
    ],
  },
  {
    intent: "government_info",
    patterns: [
      /\b(passport|visa|citizenship)\s+(fee|requirements?|application|process)\b/i,
      /\b(tax|income\s+tax)\s+(rules?|rate|bracket|filing)\b/i,
      /\bgovernment\s+(schem|policy|rule|law|regulation)\b/i,
      /\b(aadhaar|ssn|national\s+id)\b/i,
    ],
  },
  {
    intent: "releases",
    patterns: [
      /\blatest\s+(ubuntu|windows|macos|ios|android|linux|node|python|java|rust)\b/i,
      /\b\w+\s+release\s+notes\b/i,
      /\b\w+\s+(v?\d+(\.\d+)+)\s+release\b/i,
      /\bnew\s+(version|release|update)\s+(of|for)\b/i,
      /\bchangelog\b/i,
    ],
  },
  {
    intent: "research_papers",
    patterns: [
      /\brecent\s+(papers?|research|studies?)\s+(about|on|in)\b/i,
      /\b(arxiv|research\s+paper|academic\s+paper|scientific\s+paper)\b/i,
      /\bAI\s+papers\s+from\s+\d{4}\b/i,
      /\b(literature\s+review|systematic\s+review|meta-analysis)\b/i,
    ],
  },
  {
    intent: "community_opinions",
    patterns: [
      /\bwhat\s+do\s+people\s+(think|say)\s+(about|of)\b/i,
      /\breddit\s+(review|thread|discussion|opinion)\b/i,
      /\bcommunity\s+(opinion|review|feedback|thoughts)\b/i,
      /\b(user|customer)\s+(reviews?|opinions?|experiences?)\b/i,
      /\bforum\s+(discussion|thread)\b/i,
    ],
  },
];

// ── Result type ────────────────────────────────────────────────────────

export interface WebSearchDecision {
  shouldSearch: boolean;
  reason: string;
  intent: string | null;
  explicitRequest: boolean;
}

// ── Main export: decides if a web search should be performed ───────────

export function shouldWebSearch(message: string): WebSearchDecision {
  const trimmed = message.trim();

  // 1. Check explicit search request first — always triggers search
  for (const pattern of EXPLICIT_SEARCH_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        shouldSearch: true,
        reason: "User explicitly requested a web search",
        intent: null,
        explicitRequest: true,
      };
    }
  }

  // 2. Check keyword patterns for search-required intents
  for (const { intent, patterns } of INTENT_KEYWORD_PATTERNS) {
    for (const pattern of patterns) {
      if (pattern.test(trimmed)) {
        return {
          shouldSearch: true,
          reason: `Intent "${intent}" requires real-time/external data`,
          intent,
          explicitRequest: false,
        };
      }
    }
  }

  // 3. No search needed — the LLM's own knowledge is sufficient
  return {
    shouldSearch: false,
    reason: "No search-required intent detected",
    intent: null,
    explicitRequest: false,
  };
}
