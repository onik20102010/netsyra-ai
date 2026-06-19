const cache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export function getCachedResponse(query: string): string | null {
  const entry = cache.get(query);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(query);
    return null;
  }
  return entry.response;
}

export function setCachedResponse(query: string, response: string) {
  if (response.length < 20) return;
  cache.set(query, { response, timestamp: Date.now() });
}