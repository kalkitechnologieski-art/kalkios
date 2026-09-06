import { SearchProvider, SearchResult } from '../types';

export const duckduckgoProvider: SearchProvider = {
  name: 'duckduckgo',

  async search(query: string, limit = 5): Promise<SearchResult[]> {
    // ─── Tier 1: Instant Answer API ──────────────────────────────
    try {
      const url = new URL('https://api.duckduckgo.com/');
      url.searchParams.set('q', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('no_html', '1');
      url.searchParams.set('skip_disambig', '1');

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000),
        headers: { 'User-Agent': 'KALKI-OS/1.0' },
      });

      if (!response.ok) throw new Error(`DDG API error: ${response.status}`);

      const data = await response.json();
      const results: SearchResult[] = [];

      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        for (const topic of data.RelatedTopics) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split('.')[0]?.slice(0, 120) || topic.Text.slice(0, 120),
              url: topic.FirstURL,
              snippet: topic.Text.slice(0, 500),
              source: 'DuckDuckGo',
            });
            if (results.length >= limit) break;
          }
        }
      }

      if (results.length === 0 && data.AbstractText) {
        results.push({
          title: data.AbstractSource || data.Heading || 'Result',
          url: data.AbstractURL || '',
          snippet: data.AbstractText.slice(0, 500),
          source: 'DuckDuckGo',
        });
      }

      return results;
    } catch (error) {
      console.warn('[DDG] Instant API failed:', error);
    }

    // ─── Tier 2: HTML Scraper ──────────────────────────────────────
    try {
      const response = await fetch('https://html.duckduckgo.com/html/', {
        method: 'POST',
        signal: AbortSignal.timeout(8000),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (compatible; KALKI-OS/1.0)',
        },
        body: new URLSearchParams({ q: query, kl: 'us-en' }),
      });

      if (!response.ok) throw new Error(`DDG HTML error: ${response.status}`);

      const html = await response.text();

      if (html.includes('captcha') || html.includes('challenge')) {
        return [];
      }

      const results: SearchResult[] = [];
      const regex = /<a rel="nofollow" href="([^"]+)">([^<]+)<\/a>\s*<br>\s*([^<]+)/g;
      let match;

      while ((match = regex.exec(html)) !== null && results.length < limit) {
        const [, url, title, snippet] = match;
        if (url && !url.includes('duckduckgo.com/l/?uddg=')) {
          results.push({
            title: title?.trim() || 'Untitled',
            url: url?.trim() || '',
            snippet: snippet?.trim()?.slice(0, 500) || '',
            source: 'DuckDuckGo',
          });
        }
      }

      return results;
    } catch (error) {
      console.warn('[DDG] HTML scraper failed:', error);
      return [];
    }
  },

  isAvailable(): boolean {
    return true;
  },
};
