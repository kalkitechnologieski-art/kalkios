import { SearchProvider, SearchResult } from '../types';

export const braveProvider: SearchProvider = {
  name: 'brave',

  async search(query: string, limit = 5): Promise<SearchResult[]> {
    const apiKey = process.env.BRAVE_API_KEY;
    if (!apiKey) {
      console.warn('[Brave] No API key configured');
      return [];
    }

    try {
      const url = new URL('https://api.search.brave.com/res/v1/web/search');
      url.searchParams.set('q', query);
      url.searchParams.set('count', String(Math.min(limit, 10)));

      const response = await fetch(url.toString(), {
        signal: AbortSignal.timeout(5000),
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': apiKey,
        },
      });

      if (!response.ok) throw new Error(`Brave error: ${response.status}`);

      const data = await response.json();
      const results: SearchResult[] = [];

      if (data.web?.results) {
        for (const item of data.web.results.slice(0, limit)) {
          results.push({
            title: item.title || 'Untitled',
            url: item.url || '',
            snippet: item.description || item.meta_description || '',
            source: 'Brave Search',
            date: item.age,
          });
        }
      }

      return results;
    } catch (error) {
      console.warn('[Brave] Search failed:', error);
      return [];
    }
  },

  isAvailable(): boolean {
    return !!process.env.BRAVE_API_KEY;
  },
};
