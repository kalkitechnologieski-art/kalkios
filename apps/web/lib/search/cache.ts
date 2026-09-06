import { SearchResult } from './types';

interface CacheEntry {
  results: SearchResult[];
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const TTL = 60 * 60 * 1000; // 1 hour

export function getCachedSearch(query: string): SearchResult[] | null {
  const key = `search:${query.slice(0, 100)}`;
  const entry = cache.get(key);
  if (entry && Date.now() - entry.timestamp < TTL) {
    return entry.results;
  }
  return null;
}

export function setCachedSearch(query: string, results: SearchResult[]): void {
  const key = `search:${query.slice(0, 100)}`;
  cache.set(key, { results, timestamp: Date.now() });
}

export function clearCache(): void {
  cache.clear();
}
