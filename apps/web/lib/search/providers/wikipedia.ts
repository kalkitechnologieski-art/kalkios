import { SearchProvider, SearchResult } from '../types';

export const wikipediaProvider: SearchProvider = {
  name: 'wikipedia',

  async search(query: string, limit = 3): Promise<SearchResult[]> {
    try {
      const url = new URL('https://en.wikipedia.org/w/api.php');
      url.searchParams.set('action', 'query');
      url.searchParams.set('list', 'search');
      url.searchParams.set('srsearch', query);
      url.searchParams.set('format', 'json');
      url.searchParams.set('origin', '*');

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(3000),
        headers: { 'User-Agent': 'KALKI-OS/1.0' },
      });

      if (!response.ok) throw new Error(`Wikipedia error: ${response.status}`);

      const data = await response.json();
      const results: SearchResult[] = [];

      if (data.query?.search) {
        for (const item of data.query.search.slice(0, limit)) {
          results.push({
            title: item.title,
            url: `https://en.wikipedia.org/wiki/${encodeURIComponent(item.title)}`,
            snippet: item.snippet?.replace(/<[^>]+>/g, '') || item.title,
            source: 'Wikipedia',
          });
        }
      }

      return results;
    } catch (error) {
      console.warn('[Wikipedia] Search failed:', error);
      return [];
    }
  },

  isAvailable(): boolean {
    return true;
  },
};
