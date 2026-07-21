// Intelligent Search Planner
// Uses AI to understand entities, classify temporal relevance, and build enriched search queries.
// Falls back to fast keyword-based detection for obvious cases.

export interface SearchPlan {
  shouldSearch: boolean;
  searchQuery: string;
  reason: string;
}

// Fast-path keywords that always trigger search without LLM call
const EXPLICIT_SEARCH_KEYWORDS = [
  "search the web", "search online", "browse the internet", "browse the web",
  "use the internet", "look it up", "google it", "bing it", "find online",
  "check online", "verify online", "search for me", "do a web search",
  "web search", "internet search",
];

// Time/weather/date queries - these should NOT trigger web search (use API instead)
const TIME_WEATHER_DATE_KEYWORDS = [
  "what's the time", "what is the time", "current time", "what time", "time now",
  "what's the date", "what is the date", "today's date", "current date", "what date",
  "what's the weather", "what is the weather", "weather in", "temperature in",
  "forecast", "weather", "temperature", "clock",
  "what is it time", "what time is it", "tell me the time", "show me the time",
  "tell me the date", "show me the date", "what day is it", "what day today",
  "what's today", "what is today", "current weather", "weather today",
  "temperature today", "weather forecast", "time in", "date in",
];

const OBVIOUS_TIME_SENSITIVE = [
  "stock price", "crypto price",
  "exchange rate", "live score", "flight status", "breaking news",
  "today news", "current news", "latest news", "trending",
  "air quality", "traffic", "road closure", "server status",
  "api status", "website status", "live stream", "election result",
];

const OBVIOUS_HISTORICAL = [
  "world war", "french revolution", "moon landing", "cold war",
  "ancient rome", "ancient greece", "egyptian empire", "byzantine",
  "napoleon bonaparte", "julius caesar", "alexander the great",
  "isaac newton", "albert einstein", "leonardo da vinci", "galileo",
  "charles darwin", "nikola tesla", "thomas edison", "benjamin franklin",
  "winston churchill", "abraham lincoln", "george washington",
  "mahatma gandhi", "nelson mandela", "martin luther king",
  "binary search tree", "bubble sort", "quick sort", "merge sort",
  "linked list", "hash table", "binary tree", "stack data structure",
  "queue data structure", "big o notation", "cpu architecture",
  "ram memory", "http protocol", "dns protocol", "tcp ip",
  "photosynthesis", "solar system", "periodic table", "atomic structure",
  "thermodynamics", "electromagnetism", "newton's laws", "relativity",
  "pythagorean theorem", "calculus basics", "linear algebra",
];

const SEARCH_PLANNER_PROMPT = `You are an intelligent search planner. Your job is to decide whether a web search is needed and build an optimal search query.

RULES:
1. Identify what entity the user is asking about (person, company, technology, concept, event, etc.)
2. Classify it temporally:
   - LIVING/ACTIVE: Living people, active companies, active technologies, current events → SEARCH
   - HISTORICAL/STATIC: Dead people, past events, stable scientific concepts, basic programming concepts → NO SEARCH
   - AMBIGUOUS: Could be either → SEARCH if fresh info could exist

3. Key question: "Can the answer realistically be different today than when the model was trained?"
   - YES → search
   - NO → no search

4. IMPORTANT: Time, weather, and date queries should NOT trigger web search. These are handled by dedicated APIs.
   - If query is about current time, date, or weather → NO SEARCH

5. If searching, EXPAND the query with relevant context:
   - Living person → add "latest news, recent achievements, current status"
   - Company → add "latest announcements, products, updates"
   - Technology → add "latest release, documentation, new features"
   - Preserve any time references (today, this week, 2026, etc.)

6. If the user mentions a year (2025, 2026) with a historical entity, SEARCH for modern developments.

7. Single-word entity queries (e.g. "Ronaldo", "OpenAI", "React") should be expanded intelligently.

OUTPUT FORMAT (strict - no markdown, no explanation):
SEARCH: yes or no
QUERY: the enriched search query (only if SEARCH is yes)

Examples:
Input: "Ronaldo"
SEARCH: yes
QUERY: Cristiano Ronaldo latest news, recent matches, goals, records, achievements

Input: "Newton"
SEARCH: no
QUERY: none

Input: "Newton 2026 discoveries"
SEARCH: yes
QUERY: new discoveries related to Newton's laws 2026

Input: "OpenAI"
SEARCH: yes
QUERY: OpenAI latest announcements, new models, API updates, pricing, products

Input: "React"
SEARCH: yes
QUERY: React latest release, documentation updates, new features

Input: "Binary search tree"
SEARCH: no
QUERY: none

Input: "Tesla this month"
SEARCH: yes
QUERY: Tesla latest news this month

Input: "Messi yesterday"
SEARCH: yes
QUERY: Lionel Messi yesterday latest news

Input: "what time is it"
SEARCH: no
QUERY: none

Input: "weather in London"
SEARCH: no
QUERY: none

Input: "today's date"
SEARCH: no
QUERY: none

Input: "World War 2"
SEARCH: no
QUERY: none`;

function parsePlannerResponse(response: string): SearchPlan {
  const lines = response.trim().split("\n");
  let shouldSearch = false;
  let searchQuery = "";
  let reason = "";

  for (const line of lines) {
    const lower = line.toLowerCase().trim();
    if (lower.startsWith("search:")) {
      const val = line.split(":")[1]?.trim().toLowerCase() || "";
      shouldSearch = val === "yes" || val === "true";
    } else if (lower.startsWith("query:")) {
      searchQuery = line.split(":").slice(1).join(":").trim();
      if (searchQuery.toLowerCase() === "none") searchQuery = "";
    } else if (lower.startsWith("reason:")) {
      reason = line.split(":").slice(1).join(":").trim();
    }
  }

  return {
    shouldSearch,
    searchQuery: searchQuery || "",
    reason: reason || (shouldSearch ? "Entity is active/living" : "Entity is historical/static"),
  };
}

export async function planSearch(userMessage: string): Promise<SearchPlan> {
  const lowerQuery = userMessage.toLowerCase().trim();

  // Fast path 0: Time/weather/date queries → use API, not web search
  if (TIME_WEATHER_DATE_KEYWORDS.some((kw) => lowerQuery.includes(kw))) {
    return {
      shouldSearch: false,
      searchQuery: "",
      reason: "Time/weather/date query - use API instead of web search",
    };
  }

  // Fast path 1: Explicit search requests → always search
  if (EXPLICIT_SEARCH_KEYWORDS.some((kw) => lowerQuery.includes(kw))) {
    return {
      shouldSearch: true,
      searchQuery: userMessage,
      reason: "User explicitly requested web search",
    };
  }

  // Fast path 2: Obvious time-sensitive keywords → always search
  if (OBVIOUS_TIME_SENSITIVE.some((kw) => lowerQuery.includes(kw))) {
    return {
      shouldSearch: true,
      searchQuery: userMessage,
      reason: "Time-sensitive keyword detected",
    };
  }

  // Fast path 3: Obvious historical/static entities → no search (unless year reference)
  const hasYearRef = /\b(20[2-9]\d|2030)\b/.test(userMessage);
  if (!hasYearRef) {
    if (OBVIOUS_HISTORICAL.some((kw) => lowerQuery.includes(kw))) {
      return {
        shouldSearch: false,
        searchQuery: "",
        reason: "Static/historical entity - model knowledge sufficient",
      };
    }
  }

  // AI path: Use LLM for entity understanding and temporal classification
  const apiKey = process.env.GROQ_API_KEY_2 || process.env.GROQ_API_KEY;
  if (!apiKey) {
    // Fallback: if no API key, use simple keyword heuristic
    return {
      shouldSearch: false,
      searchQuery: "",
      reason: "No API key for search planner",
    };
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: SEARCH_PLANNER_PROMPT },
            { role: "user", content: userMessage.slice(0, 300) },
          ],
          temperature: 0.1,
          max_tokens: 80,
        }),
      }
    );

    if (!response.ok) {
      console.error("Search planner failed:", response.statusText);
      return {
        shouldSearch: false,
        searchQuery: "",
        reason: "Search planner API error",
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim() || "";
    const plan = parsePlannerResponse(content);

    // If planner says search but didn't provide a query, use original message
    if (plan.shouldSearch && !plan.searchQuery) {
      plan.searchQuery = userMessage;
    }

    console.log(
      `🔍 Search planner: "${userMessage.slice(0, 50)}" → search=${plan.shouldSearch}, query="${plan.searchQuery.slice(0, 60)}"`
    );

    return plan;
  } catch (error) {
    console.error("Search planner error:", error);
    return {
      shouldSearch: false,
      searchQuery: "",
      reason: "Search planner error",
    };
  }
}
