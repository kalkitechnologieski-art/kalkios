// Simple in-memory cache for web search results
const cache = new Map<string, { data: any; timestamp: number }>();
const TTL = 3600 * 1000; // 1 hour

export function getCachedSearch(query: string): any | null {
  const key = `search:${query.slice(0, 100)}`;
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < TTL) {
    return entry.data;
  }
  return null;
}

export function setCachedSearch(query: string, data: any): void {
  const key = `search:${query.slice(0, 100)}`;
  cache.set(key, { data, timestamp: Date.now() });
}
