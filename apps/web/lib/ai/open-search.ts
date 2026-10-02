/**
 * SIDDHI v4.0 — Open-Source Web Search Engine
 * 
 * Enterprise-grade search without API keys using:
 * - SearXNG (self-hosted meta-search)
 * - DuckDuckGo (free, no-key)
 * - Brave Search (free tier fallback)
 * - Custom site crawling
 */

import { logger } from '@/lib/utils/logger';
import { retryWithBackoff } from './resilience';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: 'searxng' | 'duckduckgo' | 'brave' | 'custom';
  relevanceScore?: number;
  entities?: string[];
}

export interface SearchOptions {
  query: string;
  location?: string; // e.g., "Indore"
  numResults?: number;
  language?: string;
  safeSearch?: boolean;
  signal?: AbortSignal;
}

class OpenSearchEngine {
  private static instance: OpenSearchEngine | null = null;
  
  static getInstance(): OpenSearchEngine {
    if (!OpenSearchEngine.instance) {
      OpenSearchEngine.instance = new OpenSearchEngine();
    }
    return OpenSearchEngine.instance;
  }

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const { query, location, numResults = 20, language = 'en', safeSearch = true } = options;
    
    const enhancedQuery = location ? `${query} ${location}` : query;
    
    const providers = [
      { name: 'SearXNG', fn: () => this.searchSearXNG(enhancedQuery, numResults, language, safeSearch) },
      { name: 'DuckDuckGo', fn: () => this.searchDuckDuckGo(enhancedQuery, numResults, language) },
      { name: 'Brave', fn: () => this.searchBrave(enhancedQuery, numResults, language) },
    ];

    for (const provider of providers) {
      try {
        const results = await retryWithBackoff(
          () => provider.fn(),
          { maxAttempts: 2, baseDelayMs: 500 }
        );
        
        if (results.length > 0) {
          logger.info(`[OpenSearch] ${provider.name} returned ${results.length} results`);
          return this.deduplicateAndRank(results, query);
        }
      } catch (error) {
        logger.warn(`[OpenSearch] ${provider.name} failed`, error);
        continue;
      }
    }

    logger.warn('[OpenSearch] All providers failed, returning empty results');
    return [];
  }

  private async searchSearXNG(
    query: string,
    numResults: number,
    language: string,
    safeSearch: boolean
  ): Promise<SearchResult[]> {
    const searxngUrl = process.env.SEARXNG_URL || 'http://localhost:8080';
    
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      language,
      safesearch: safeSearch ? '1' : '0',
      categories: 'general',
      engines: 'google,bing,duckduckgo,wikipedia',
    });

    const response = await fetch(`${searxngUrl}/search?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`SearXNG returned ${response.status}`);
    }

    const data = await response.json() as { results?: Array<{ title: string; url: string; content?: string }> };
    
    return (data.results || []).slice(0, numResults).map(r => ({
      title: r.title || '',
      url: r.url || '',
      snippet: r.content || '',
      source: 'searxng' as const,
    }));
  }

  private async searchDuckDuckGo(
    query: string,
    numResults: number,
    language: string
  ): Promise<SearchResult[]> {
    const apiUrl = 'https://api.duckduckgo.com/';
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      no_html: '1',
      skip_disambig: '1',
    });

    const response = await fetch(`${apiUrl}?${params}`);
    
    if (!response.ok) {
      throw new Error(`DuckDuckGo returned ${response.status}`);
    }

    const data = await response.json() as {
      AbstractText?: string;
      AbstractURL?: string;
      RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
    };

    const results: SearchResult[] = [];
    
    if (data.AbstractText && data.AbstractURL) {
      results.push({
        title: data.AbstractText.slice(0, 100),
        url: data.AbstractURL,
        snippet: data.AbstractText,
        source: 'duckduckgo',
      });
    }

    (data.RelatedTopics || []).slice(0, numResults).forEach(topic => {
      if (topic.Text && topic.FirstURL) {
        results.push({
          title: topic.Text.slice(0, 100),
          url: topic.FirstURL,
          snippet: topic.Text,
          source: 'duckduckgo',
        });
      }
    });

    return results;
  }

  private async searchBrave(
    query: string,
    numResults: number,
    language: string
  ): Promise<SearchResult[]> {
    const apiKey = process.env.BRAVE_SEARCH_API_KEY;
    if (!apiKey) {
      throw new Error('Brave API key not configured');
    }

    const response = await fetch(
      `https://api.search.brave.com/v1/web/search?q=${encodeURIComponent(query)}&count=${numResults}&safesearch=${true}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Brave returned ${response.status}`);
    }

    const data = await response.json() as {
      web?: { results?: Array<{ title: string; url: string; description: string }> };
    };

    return (data.web?.results || []).map(r => ({
      title: r.title,
      url: r.url,
      snippet: r.description,
      source: 'brave' as const,
    }));
  }

  private deduplicateAndRank(results: SearchResult[], query: string): SearchResult[] {
    const seen = new Set<string>();
    const unique: SearchResult[] = [];

    for (const result of results) {
      const normalizedUrl = result.url.split('?')[0].toLowerCase();
      if (!seen.has(normalizedUrl)) {
        seen.add(normalizedUrl);
        unique.push({
          ...result,
          relevanceScore: this.calculateRelevance(result, query),
        });
      }
    }

    return unique
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
      .slice(0, 20);
  }

  private calculateRelevance(result: SearchResult, query: string): number {
    const queryLower = query.toLowerCase();
    const titleLower = result.title.toLowerCase();
    const snippetLower = result.snippet.toLowerCase();

    let score = 0;
    
    if (titleLower.includes(queryLower)) score += 10;
    if (snippetLower.includes(queryLower)) score += 5;
    
    const words = queryLower.split(/\s+/);
    words.forEach(word => {
      if (titleLower.includes(word)) score += 2;
      if (snippetLower.includes(word)) score += 1;
    });

    return score;
  }

  async extractUrlsFromSearch(query: string, location?: string): Promise<string[]> {
    const results = await this.search({ query, location, numResults: 30 });
    return results.map(r => r.url).filter(url => url.startsWith('http'));
  }
}

export const openSearch = OpenSearchEngine.getInstance();
