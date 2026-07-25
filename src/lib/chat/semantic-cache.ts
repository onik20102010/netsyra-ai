// Semantic + Deterministic Response Cache
// Reduces token usage by 30-40% for repeat/similar queries.
// Two layers: deterministic (exact match for common patterns) + semantic (embedding-based).

// ── Deterministic cache for common patterns ─────────────────
const DETERMINISTIC_CACHE = new Map<string, { response: string; timestamp: number }>();
const DET_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_DET_CACHE = 200;

// Common greeting patterns → cached responses
const GREETING_RESPONSES: Record<string, string> = {
  'hello': 'Hello! How can I help you today?',
  'hi': "Hi there! What can I do for you?",
  'hey': "Hey! What's on your mind?",
  'good morning': 'Good morning! How can I assist you today?',
  'good evening': 'Good evening! What can I help you with?',
  'good afternoon': 'Good afternoon! How may I assist you?',
  'sup': "Hey! What's up?",
  'yo': "Yo! What's going on?",
};

const CAPABILITY_RESPONSE = `I'm Netsyra-AI, a high-level AI assistant. I can help with:

• **Coding** — write, debug, review, and optimize code in any language
• **Reasoning** — solve complex problems, explain concepts, plan projects
• **Creative work** — write stories, essays, emails, brainstorm ideas
• **Analysis** — analyze data, logs, performance, security
• **Web search** — get real-time information (enable Dive Deep)
• **Image analysis** — analyze uploaded images

What would you like help with?`;

const IDENTITY_RESPONSE = `I'm Netsyra-AI, built by Netsyra. Onik is the founder of Netsyra AI. I'm powered by an intelligent routing system that selects the best model for each request.`;

// ── Deterministic patterns ──────────────────────────────────
const DET_PATTERNS: Array<{ re: RegExp; response: string | ((match: RegExpMatchArray) => string) }> = [
  // Greetings
  { re: /^(hi+|hello+|hey+|sup|yo|good (morning|night|evening|afternoon))\b[\s!.?]*$/i, response: (m) => {
    const key = m[0].toLowerCase().replace(/[!.\s]+$/, '').trim();
    return GREETING_RESPONSES[key] || "Hello! How can I help you?";
  }},
  // Capability questions
  { re: /\b(what (can|do) you do|what are your (capabilities|features|abilities)|how (can|do) you help|what can (i|you) (do|ask)|help\?)\b/i, response: CAPABILITY_RESPONSE },
  // Identity questions
  { re: /\b(who (are|made|created|built) you|what (are|is) you|tell me about (yourself|you)|your (name|creator|founder))\b/i, response: IDENTITY_RESPONSE },
  // Model questions
  { re: /\b(what model|which model|what ai|which ai|are you (gpt|claude|gemini|llama))\b/i, response: "I'm Netsyra-AI, powered by an intelligent routing system that automatically selects the best model for each request — from fast Llama models to premium Claude, GPT-5, and Gemini models depending on your plan and task complexity." },
  // Thanks
  { re: /^(thanks?|thank you|thx|ty|appreciate it)\b[\s!.?]*$/i, response: "You're welcome! Let me know if you need anything else." },
  // Bye
  { re: /^(bye|goodbye|see (you|ya)|later|cya)\b[\s!.?]*$/i, response: "Goodbye! Feel free to return anytime." },
];

/**
 * Check deterministic cache for common patterns.
 * Returns cached response if found, null otherwise.
 */
export function checkDeterministicCache(message: string): string | null {
  const normalized = message.trim();

  // Check in-memory cache first
  const cacheKey = normalized.toLowerCase();
  const cached = DETERMINISTIC_CACHE.get(cacheKey);
  if (cached) {
    if (Date.now() - cached.timestamp < DET_CACHE_TTL_MS) {
      return cached.response;
    }
    DETERMINISTIC_CACHE.delete(cacheKey);
  }

  // Check patterns
  for (const pattern of DET_PATTERNS) {
    const match = normalized.match(pattern.re);
    if (match) {
      const response = typeof pattern.response === 'function' ? pattern.response(match) : pattern.response;
      // Cache it
      if (DETERMINISTIC_CACHE.size >= MAX_DET_CACHE) {
        const firstKey = DETERMINISTIC_CACHE.keys().next().value;
        if (firstKey) DETERMINISTIC_CACHE.delete(firstKey);
      }
      DETERMINISTIC_CACHE.set(cacheKey, { response, timestamp: Date.now() });
      return response;
    }
  }

  return null;
}

// ── Semantic cache (embedding-based) ────────────────────────
interface SemanticCacheEntry {
  embedding: number[];
  response: string;
  timestamp: number;
  ttl: number; // milliseconds
}

const semanticCache: SemanticCacheEntry[] = [];
const MAX_SEMANTIC_CACHE = 100;
const SIMILARITY_THRESHOLD = 0.92; // Cosine similarity threshold

/**
 * Compute cosine similarity between two vectors.
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Get embedding for a text using Groq API (fast, cheap model).
 * Returns null on failure.
 */
async function getEmbedding(text: string): Promise<number[] | null> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        input: text.slice(0, 500),
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

/**
 * Check semantic cache for similar queries.
 * Returns cached response if a semantically similar query is found.
 */
export async function checkSemanticCache(message: string): Promise<string | null> {
  if (semanticCache.length === 0) return null;

  const embedding = await getEmbedding(message);
  if (!embedding) return null;

  // Clean expired entries
  const now = Date.now();
  for (let i = semanticCache.length - 1; i >= 0; i--) {
    if (now - semanticCache[i].timestamp > semanticCache[i].ttl) {
      semanticCache.splice(i, 1);
    }
  }

  // Find most similar
  let bestSimilarity = 0;
  let bestEntry: SemanticCacheEntry | null = null;

  for (const entry of semanticCache) {
    const similarity = cosineSimilarity(embedding, entry.embedding);
    if (similarity > bestSimilarity) {
      bestSimilarity = similarity;
      bestEntry = entry;
    }
  }

  if (bestEntry && bestSimilarity >= SIMILARITY_THRESHOLD) {
    return bestEntry.response;
  }

  return null;
}

/**
 * Store a response in the semantic cache.
 */
export async function storeSemanticCache(
  query: string,
  response: string,
  ttlMs: number = 30 * 60 * 1000 // 30 min default
): Promise<void> {
  const embedding = await getEmbedding(query);
  if (!embedding) return;

  if (semanticCache.length >= MAX_SEMANTIC_CACHE) {
    semanticCache.shift();
  }

  semanticCache.push({
    embedding,
    response,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

/**
 * Combined cache check: deterministic first, then semantic.
 * Returns cached response or null.
 */
export async function checkCache(message: string): Promise<{ response: string; source: 'deterministic' | 'semantic' } | null> {
  // Layer 1: Deterministic (fast, no API call)
  const detResult = checkDeterministicCache(message);
  if (detResult) {
    return { response: detResult, source: 'deterministic' };
  }

  // Layer 2: Semantic (requires embedding API call)
  const semResult = await checkSemanticCache(message);
  if (semResult) {
    return { response: semResult, source: 'semantic' };
  }

  return null;
}

/**
 * Store in both caches after a successful response.
 */
export async function storeInCache(query: string, response: string): Promise<void> {
  // Deterministic cache for short queries
  if (query.length < 100) {
    const cacheKey = query.toLowerCase().trim();
    if (DETERMINISTIC_CACHE.size >= MAX_DET_CACHE) {
      const firstKey = DETERMINISTIC_CACHE.keys().next().value;
      if (firstKey) DETERMINISTIC_CACHE.delete(firstKey);
    }
    DETERMINISTIC_CACHE.set(cacheKey, { response, timestamp: Date.now() });
  }

  // Semantic cache for longer queries
  if (query.length > 20 && response.length > 50) {
    await storeSemanticCache(query, response);
  }
}

/**
 * Get cache stats for monitoring.
 */
export function getCacheStats(): { deterministic: number; semantic: number } {
  return {
    deterministic: DETERMINISTIC_CACHE.size,
    semantic: semanticCache.length,
  };
}
