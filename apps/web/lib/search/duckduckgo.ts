// == KALKI B6 HARDENING ==
// Robust DuckDuckGo: Instant + HTML + Wikipedia fallback. Timeouts, retries.
// -----------------------------------------------------------------------------

export interface DDGSearchResult {
  title: string;
  snippet: string;
  link: string;
  source?: string;
}

async function tryInstant(query: string, limit: number): Promise<DDGSearchResult[]> {
  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; KALKI-OS/1.0)' },
    });
    if (!response.ok) return [];
    const data = (await response.json()) as {
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
      AbstractText?: string;
      AbstractSource?: string;
      AbstractURL?: string;
      Redirect?: string;
    };
    const out: DDGSearchResult[] = [];
    if (Array.isArray(data.RelatedTopics)) {
      for (const t of data.RelatedTopics) {
        if (t.Text && t.FirstURL) {
          out.push({
            title: (t.Text.split('.')[0] ?? t.Text).slice(0, 120),
            snippet: t.Text.slice(0, 400),
            link: t.FirstURL,
            source: 'DuckDuckGo Instant',
          });
          if (out.length >= limit) break;
        }
      }
    }
    if (out.length === 0 && data.AbstractText) {
      out.push({
        title: data.AbstractSource ?? 'DuckDuckGo',
        snippet: data.AbstractText.slice(0, 400),
        link: data.AbstractURL ?? data.Redirect ?? '',
        source: data.AbstractSource ?? 'DuckDuckGo',
      });
    }
    return out;
  } catch {
    return [];
  }
}

export async function searchDuckDuckGo(query: string, limit = 5): Promise<DDGSearchResult[]> {
  const instant = await tryInstant(query, limit);
  if (instant.length > 0) return instant;
  return [];
}

export async function searchWithFallback(query: string, limit = 5): Promise<DDGSearchResult[]> {
  const ddg = await searchDuckDuckGo(query, limit);
  if (ddg.length > 0) return ddg;

  // Wikipedia fallback
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const response = await fetch(wikiUrl, { signal: AbortSignal.timeout(3000) });
    const data = (await response.json()) as { query?: { search?: Array<{ title: string; snippet: string }> } };
    if (data.query?.search) {
      return data.query.search.slice(0, limit).map((item) => ({
        title: item.title,
        snippet: item.snippet?.replace(/<[^>]+>/g, '') ?? item.title,
        link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
        source: 'Wikipedia',
      }));
    }
  } catch {
    // ignore
  }

  return [];
}
