// ─── DuckDuckGo Instant Answer API – Free, No API Key ──────────────────
// Documentation: https://duckduckgo.com/api
// Rate limit: ~1 request per second (unofficial, be gentle)

export interface DDGSearchResult {
  title: string;
  snippet: string;
  link: string;
  source?: string;
}

export async function searchDuckDuckGo(
  query: string,
  limit = 5
): Promise<DDGSearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; KALKI-OS/1.0)',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`DuckDuckGo API error: ${response.status}`);
    }

    const data = await response.json();
    const results: DDGSearchResult[] = [];

    // Parse RelatedTopics
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (topic.Text && topic.FirstURL) {
          // Extract title from text (first sentence)
          const title = topic.Text.split('.')[0]?.slice(0, 100) || topic.Text.slice(0, 100);
          results.push({
            title: title,
            snippet: topic.Text.slice(0, 400),
            link: topic.FirstURL,
            source: 'DuckDuckGo',
          });
          if (results.length >= limit) break;
        }
      }
    }

    // If no results from RelatedTopics, try Abstract
    if (results.length === 0 && data.AbstractText) {
      results.push({
        title: data.AbstractSource || 'DuckDuckGo Result',
        snippet: data.AbstractText.slice(0, 400),
        link: data.AbstractURL || data.Redirect || '',
        source: data.AbstractSource || 'DuckDuckGo',
      });
    }

    return results;
  } catch (error) {
    console.warn('[DDG] Search failed:', error);
    return [];
  }
}

// ─── Combined search with multiple fallbacks ─────────────────────────────
export async function searchWithFallback(
  query: string,
  limit = 5
): Promise<DDGSearchResult[]> {
  // Try DuckDuckGo first
  let results = await searchDuckDuckGo(query, limit);
  if (results.length > 0) return results;

  // Fallback: try a simple Wikipedia lookup
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const response = await fetch(wikiUrl, { signal: AbortSignal.timeout(3000) });
    const data = await response.json();
    if (data.query?.search) {
      results = data.query.search.slice(0, limit).map((item: any) => ({
        title: item.title,
        snippet: item.snippet?.replace(/<[^>]+>/g, '') || item.title,
        link: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
        source: 'Wikipedia',
      }));
    }
  } catch (e) {
    // Ignore fallback failure
  }

  return results;
}
