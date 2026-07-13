// src/lib/scale.ts
// Lightweight caching + key rotation + deduplication — no external services needed

// ── Cache ──────────────────────────────────────────
const cache = new Map<string, { reply: string; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function fingerprint(query: string): string {
  const stopwords = new Set([
    "a", "an", "the", "is", "are", "was", "were",
    "what", "how", "when", "where", "who", "why",
    "can", "you", "i", "me", "my", "please", "tell",
  ]);
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => !stopwords.has(w))
    .sort()
    .join("|");
}

export function getCachedReply(query: string): string | null {
  const fp = fingerprint(query);
  const entry = cache.get(fp);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(fp);
    return null;
  }
  return entry.reply;
}

export function setCachedReply(query: string, reply: string): void {
  if (reply.length < 20) return;
  const fp = fingerprint(query);
  cache.set(fp, { reply, timestamp: Date.now() });
}

// Cleanup every minute
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) cache.delete(key);
  }
}, 60_000);

// ── API Key Rotation (Groq only) ───────────────────
// IDE requests should use Groq API key 2 only.
const GROQ_KEYS: string[] = [process.env.GROQ_API_KEY_2 || ""].filter(Boolean);

let keyIndex = 0;

export function getNextGroqKey(): string {
  if (GROQ_KEYS.length === 0) throw new Error("No Groq API key 2 configured");
  const key = GROQ_KEYS[keyIndex % GROQ_KEYS.length];
  keyIndex++;
  return key;
}

// ── Request Deduplication ──────────────────────────
const inFlight = new Set<string>();

export function isDuplicateRequest(userId: string, query: string): boolean {
  const id = `${userId}:${fingerprint(query)}`;
  if (inFlight.has(id)) return true;
  inFlight.add(id);
  // Auto‑remove after 30 seconds to prevent leaks
  setTimeout(() => inFlight.delete(id), 30_000);
  return false;
}