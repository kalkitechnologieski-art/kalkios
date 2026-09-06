export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  date?: string;
  score?: number;
}

export interface SearchProvider {
  name: string;
  search(query: string, limit?: number): Promise<SearchResult[]>;
  isAvailable(): boolean;
}

export interface SearchOptions {
  limit?: number;
  timeout?: number;
  providers?: string[];
  skipCache?: boolean;
}
