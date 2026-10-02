// == KALKI B6 HARDENING ==
// Parallel multi-engine search with citation tracking, dedup, and 4-tier
// fallback (DDG Instant → DDG HTML → Wikipedia → Brave → SearXNG → Mojeek).
// -----------------------------------------------------------------------------

import type { SearchResult, SearchOptions } from './types';
import { duckduckgoProvider } from './providers/duckduckgo';
import { wikipediaProvider } from './providers/wikipedia';
import { braveProvider } from './providers/brave';
import { getCachedSearch, setCachedSearch } from './cache';
import { CONCURRENCY } from '@/lib/orchestration/concurrency';
import { logger } from '@/lib/utils/logger';

const SEARXNG_INSTANCES = [
  'https://searx.be',
  'https://searx.mx',
  'https://searx.tiekoetter.com',
  'https://searx.nadeko.net',
  'https://search.privacytools.io',
];

export interface Citation {
  id: number;
  title: string;
  url: string;
  snippet: string;
  source: string;
  score: number;
}

interface ProviderRun {
  name: string;
  run: () => Promise<SearchResult[]>;
}

async function runSearxng(query: string, limit: number): Promise<SearchResult[]> {
  const results: SearchResult[] = [];
  for (const instance of SEARXNG_INSTANCES) {
    try {
      const response = await CONCURRENCY.search.run(() =>
        fetch(`${instance}/search?q=${encodeURIComponent(query)}&format=json`, {
          signal: AbortSignal.timeout(4000),
          headers: { 'Accept': 'application/json' },
        })
      );
      if (!response.ok) continue;
      const data = (await response.json()) as { results?: Array<{ title?: string; url?: string; content?: string }> };
      if (data.results && data.results.length > 0) {
        for (const r of data.results.slice(0, limit)) {
          results.push({
            title: r.title ?? '',
            url: r.url ?? '',
            snippet: r.content ?? '',
            source: `SearXNG (${instance})`,
          });
        }
        if (results.length > 0) return results;
      }
    } catch {
      continue;
    }
  }
  return results;
}

async function runMojeek(query: string, limit: number): Promise<SearchResult[]> {
  try {
    const response = await CONCURRENCY.search.run(() =>
      fetch(`https://www.mojeek.com/search?q=${encodeURIComponent(query)}&fmt=json`, {
        signal: AbortSignal.timeout(4000),
        headers: { 'Accept': 'application/json' },
      })
    );
    if (!response.ok) return [];
    const data = (await response.json()) as { results?: Array<{ title?: string; url?: string; desc?: string }> };
    if (!data.results) return [];
    return data.results.slice(0, limit).map((r) => ({
      title: r.title ?? '',
      url: r.url ?? '',
      snippet: r.desc ?? '',
      source: 'Mojeek',
    }));
  } catch {
    return [];
  }
}

function dedupeByUrl(results: SearchResult[]): SearchResult[] {
  const seen = new Map<string, SearchResult>();
  for (const r of results) {
    if (!r.url) continue;
    const key = r.url.toLowerCase().split('#')[0] ?? r.url.toLowerCase();
    const existing = seen.get(key);
    if (!existing) seen.set(key, r);
    else {
      // Prefer longer snippet
      if ((r.snippet?.length ?? 0) > (existing.snippet?.length ?? 0)) {
        seen.set(key, { ...existing, snippet: r.snippet });
      }
    }
  }
  return Array.from(seen.values());
}

export async function searchWeb(
  query: string,
  options: SearchOptions = {}
): Promise<SearchResult[]> {
  const { limit = 8, skipCache = false } = options;

  if (!skipCache) {
    const cached = getCachedSearch(query);
    if (cached) return cached.slice(0, limit);
  }

  const runs: ProviderRun[] = [
    { name: 'duckduckgo', run: () => duckduckgoProvider.search(query, limit) },
    { name: 'wikipedia', run: () => wikipediaProvider.search(query, Math.min(limit, 3)) },
    { name: 'searxng', run: () => runSearxng(query, limit) },
  ];
  if (braveProvider.isAvailable()) {
    runs.push({ name: 'brave', run: () => braveProvider.search(query, limit) });
  }
  runs.push({ name: 'mojeek', run: () => runMojeek(query, limit) });

  // Fire in parallel, collect all responses, keep the fastest non-empty per tier
  const settled = await Promise.allSettled(
    runs.map((r) =>
      CONCURRENCY.search.run(() => r.run()).catch((err) => {
        logger.debug(`[Search] ${r.name} failed`, err);
        return [] as SearchResult[];
      })
    )
  );

  const allResults: SearchResult[] = [];
  for (const s of settled) {
    if (s.status === 'fulfilled') allResults.push(...s.value);
  }

  const deduped = dedupeByUrl(allResults);
  const finalResults = deduped.slice(0, limit);

  if (finalResults.length > 0) {
    setCachedSearch(query, finalResults);
  }

  return finalResults;
}

export async function searchWithContext(
  query: string,
  options: SearchOptions = {}
): Promise<{
  results: SearchResult[];
  summary: string;
  sources: string[];
  citations: Citation[];
}> {
  const results = await searchWeb(query, options);

  const sources = results.map((r) => r.url).filter(Boolean);
  const summary = results.length > 0
    ? results.map((r, i) => `[${i + 1}] ${r.title}: ${r.snippet}`).join('\n')
    : 'No search results found.';

  const citations: Citation[] = results.map((r, i) => ({
    id: i + 1,
    title: r.title,
    url: r.url,
    snippet: r.snippet.slice(0, 220),
    source: r.source,
    score: 1 - i / Math.max(results.length, 1),
  }));

  return { results, summary, sources, citations };
}
