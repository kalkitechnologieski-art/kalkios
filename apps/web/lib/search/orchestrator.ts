import { SearchResult, SearchOptions } from './types';
import { duckduckgoProvider } from './providers/duckduckgo';
import { wikipediaProvider } from './providers/wikipedia';
import { braveProvider } from './providers/brave';
import { getCachedSearch, setCachedSearch } from './cache';

const PROVIDERS = [
  duckduckgoProvider,
  wikipediaProvider,
  braveProvider,
];

export async function searchWeb(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { limit = 5, timeout = 10000, skipCache = false } = options;

  if (!skipCache) {
    const cached = getCachedSearch(query);
    if (cached) {
      console.log(`[Search] ✅ Cache hit for "${query}"`);
      return cached.slice(0, limit);
    }
  }

  let lastError: Error | null = null;

  for (const provider of PROVIDERS) {
    if (!provider.isAvailable()) {
      console.log(`[Search] ⏭️ ${provider.name} not available, skipping`);
      continue;
    }

    try {
      console.log(`[Search] 🔍 Trying ${provider.name}...`);
      const startTime = Date.now();

      const results = await Promise.race([
        provider.search(query, limit),
        new Promise<SearchResult[]>((_, reject) =>
          setTimeout(() => reject(new Error('Provider timeout')), timeout)
        ),
      ]);

      const duration = Date.now() - startTime;

      if (results && results.length > 0) {
        console.log(`[Search] ✅ ${provider.name} returned ${results.length} results (${duration}ms)`);
        setCachedSearch(query, results);
        return results.slice(0, limit);
      }

      console.log(`[Search] ⚠️ ${provider.name} returned 0 results`);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      lastError = err;
      console.warn(`[Search] ❌ ${provider.name} failed:`, err.message);
    }
  }

  console.error(`[Search] ❌ All providers failed. Last error:`, lastError?.message || 'Unknown error');
  return [];
}

export async function searchWithContext(
  query: string,
  options: SearchOptions = {}
): Promise<{ results: SearchResult[]; summary: string; sources: string[] }> {
  const results = await searchWeb(query, options);

  const sources = results.map((r) => r.url).filter(Boolean);
  const summary =
    results.length > 0
      ? results.map((r, i) => `${i + 1}. ${r.title}: ${r.snippet}`).join('\n')
      : 'No search results found.';

  return { results, summary, sources };
}
