export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  date?: string;
  score?: number;
}

export interface SearchOptions {
  limit?: number;
  timeout?: number;
  region?: string;
  includeWikipedia?: boolean;
}

// ─── Tier 1: DuckDuckGo Instant Answer API ──────────────────────────────
async function searchDuckDuckGoInstant(query: string, limit = 5): Promise<SearchResult[]> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json', 'User-Agent': 'KALKI-OS/1.0' } });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`DDG API error: ${response.status}`);
    const data = await response.json();
    const results: SearchResult[] = [];
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (topic.Text && topic.FirstURL) {
          const title = topic.Text.split('.')[0]?.slice(0, 120) || topic.Text.slice(0, 120);
          results.push({ title, url: topic.FirstURL, snippet: topic.Text.slice(0, 500), source: 'DuckDuckGo' });
          if (results.length >= limit) break;
        }
      }
    }
    if (results.length === 0 && data.AbstractText) {
      results.push({
        title: data.AbstractSource || data.Heading || 'DuckDuckGo Result',
        url: data.AbstractURL || data.Redirect || '',
        snippet: data.AbstractText.slice(0, 500),
        source: data.AbstractSource || 'DuckDuckGo',
      });
    }
    return results;
  } catch { return []; }
}

// ─── Tier 2: DuckDuckGo Lite HTML Scraper ──────────────────────────────
async function searchDuckDuckGoLite(query: string, limit = 5): Promise<SearchResult[]> {
  const url = 'https://lite.duckduckgo.com/lite/';
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' },
      body: new URLSearchParams({ q: query, kl: 'us-en' }),
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`DDG Lite error: ${response.status}`);
    const html = await response.text();
    if (html.includes('captcha') || html.includes('anomaly') || html.includes('challenge')) return [];
    const results: SearchResult[] = [];
    const regex = /<a rel="nofollow" href="([^"]+)">([^<]+)<\/a>\s*<br>\s*([^<]+)/g;
    let match;
    while ((match = regex.exec(html)) !== null && results.length < limit) {
      results.push({ title: match[2]?.trim() || 'Untitled', url: match[1]?.trim() || '', snippet: match[3]?.trim()?.slice(0, 500) || '', source: 'DuckDuckGo Lite' });
    }
    return results;
  } catch { return []; }
}

// ─── Tier 3: Wikipedia API ──────────────────────────────────────────────
async function searchWikipedia(query: string, limit = 3): Promise<SearchResult[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { 'User-Agent': 'KALKI-OS/1.0' } });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Wikipedia error: ${response.status}`);
    const data = await response.json();
    const results: SearchResult[] = [];
    if (data.query?.search) {
      for (const item of data.query.search.slice(0, limit)) {
        results.push({ title: item.title, url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`, snippet: item.snippet?.replace(/<[^>]+>/g, '') || item.title, source: 'Wikipedia' });
      }
    }
    return results;
  } catch { return []; }
}

// ─── Tier 4: Brave Search API ──────────────────────────────────────────
async function searchBrave(query: string, limit = 5): Promise<SearchResult[]> {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) return [];
  const url = new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(Math.min(limit, 10)));
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: { 'Accept': 'application/json', 'X-Subscription-Token': apiKey },
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`Brave error: ${response.status}`);
    const data = await response.json();
    const results: SearchResult[] = [];
    if (data.web?.results) {
      for (const item of data.web.results.slice(0, limit)) {
        results.push({ title: item.title || 'Untitled', url: item.url || '', snippet: item.description || item.meta_description || '', source: 'Brave Search', date: item.age });
      }
    }
    return results;
  } catch { return []; }
}

// ─── Main Orchestrator ──────────────────────────────────────────────────
export async function searchWeb(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const { limit = 5, includeWikipedia = true } = options;
  let results = await searchDuckDuckGoInstant(query, limit);
  if (results.length > 0) return results;
  results = await searchDuckDuckGoLite(query, limit);
  if (results.length > 0) return results;
  if (includeWikipedia) {
    results = await searchWikipedia(query, Math.min(limit, 3));
    if (results.length > 0) return results;
  }
  results = await searchBrave(query, limit);
  if (results.length > 0) return results;
  return [];
}

export async function searchWebRobust(query: string, options: SearchOptions = {}): Promise<SearchResult[]> {
  const { limit = 5, includeWikipedia = true } = options;
  const [ddgInstant, ddgLite, wiki, brave] = await Promise.all([
    searchDuckDuckGoInstant(query, limit),
    searchDuckDuckGoLite(query, limit),
    includeWikipedia ? searchWikipedia(query, 3) : Promise.resolve([]),
    searchBrave(query, limit),
  ]);
  const all = [...ddgInstant, ...ddgLite, ...wiki, ...brave];
  const seen = new Set<string>();
  const unique: SearchResult[] = [];
  for (const result of all) {
    const key = result.url?.toLowerCase() || result.title?.toLowerCase();
    if (key && !seen.has(key)) { seen.add(key); unique.push(result); }
    if (unique.length >= limit * 2) break;
  }
  const priority: Record<string, number> = { 'Brave Search': 100, 'DuckDuckGo Lite': 80, 'DuckDuckGo': 70, 'Wikipedia': 60 };
  unique.sort((a, b) => (priority[b.source] || 0) - (priority[a.source] || 0));
  return unique.slice(0, limit);
}
