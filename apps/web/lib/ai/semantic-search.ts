/**
 * SIDDHI v4.0 — Enterprise Semantic Web Search Engine
 * 
 * Advanced semantic search with:
 * - Knowledge graph integration for entity relationships
 * - Entity extraction and disambiguation
 * - Source credibility scoring
 * - Multi-engine aggregation with deduplication
 * - Contextual relevance ranking
 * - Domain authority validation
 */

import { openSearch, type SearchResult } from './open-search';
import { logger } from '@/lib/utils/logger';

export interface SemanticSearchResult extends SearchResult {
  credibilityScore: number;
  domainAuthority: number;
  entities: string[];
  publishDate?: string;
  contentType: 'article' | 'business' | 'academic' | 'news' | 'blog' | 'unknown';
  relevanceExplanation?: string;
}

export interface KnowledgeGraphNode {
  entity: string;
  type: 'person' | 'organization' | 'location' | 'technology' | 'concept';
  relatedEntities: string[];
  confidence: number;
}

export interface SemanticSearchOptions {
  query: string;
  location?: string;
  numResults?: number;
  language?: string;
  requireCredibleSources?: boolean;
  extractEntities?: boolean;
  signal?: AbortSignal;
}

class SemanticSearchEngine {
  private static instance: SemanticSearchEngine | null = null;
  
  // Domain authority database (simplified - in production use Moz/Ahrefs API)
  private readonly domainAuthorityDB: Record<string, number> = {
    'wikipedia.org': 95,
    'github.com': 98,
    'stackoverflow.com': 93,
    'medium.com': 85,
    'linkedin.com': 98,
    'twitter.com': 97,
    'youtube.com': 100,
    'nytimes.com': 95,
    'bbc.com': 96,
    'reuters.com': 94,
    'forbes.com': 93,
    'techcrunch.com': 91,
    'wired.com': 90,
    'theverge.com': 89,
    'indiatimes.com': 82,
    'ndtv.com': 83,
    'hindustantimes.com': 81,
  };

  // Credibility indicators
  private readonly credibleDomains = new Set([
    '.edu', '.gov', '.org', 'wikipedia.org', 'github.com',
    'stackoverflow.com', 'medium.com', 'linkedin.com',
  ]);

  static getInstance(): SemanticSearchEngine {
    if (!SemanticSearchEngine.instance) {
      SemanticSearchEngine.instance = new SemanticSearchEngine();
    }
    return SemanticSearchEngine.instance;
  }

  /**
   * Perform semantic search with enhanced features
   */
  async semanticSearch(options: SemanticSearchOptions): Promise<{
    results: SemanticSearchResult[];
    entities: KnowledgeGraphNode[];
    totalSearched: number;
    queryExpansion?: string;
  }> {
    const { query, location, numResults = 20, language = 'en', requireCredibleSources = false } = options;

    logger.info(`[SemanticSearch] Starting semantic search for: "${query}"`);

    // Step 1: Extract entities from query
    const entities = options.extractEntities !== false ? this.extractQueryEntities(query) : [];
    
    // Step 2: Expand query with related terms
    const expandedQuery = this.expandQuery(query, entities);
    logger.info(`[SemanticSearch] Expanded query: "${expandedQuery}"`);

    // Step 3: Perform multi-engine search
    const rawResults = await openSearch.search({
      query: expandedQuery,
      location,
      numResults: numResults * 2, // Get more for filtering
      language,
    });

    // Step 4: Enhance results with semantic analysis
    const enhancedResults = await Promise.all(
      rawResults.map(result => this.enhanceResult(result, entities))
    );

    // Step 5: Filter by credibility if required
    const filteredResults = requireCredibleSources
      ? enhancedResults.filter(r => r.credibilityScore >= 0.7)
      : enhancedResults;

    // Step 6: Rank by combined relevance + credibility score
    const rankedResults = filteredResults
      .sort((a, b) => {
        const scoreA = a.relevanceScore! * 0.6 + a.credibilityScore * 0.4;
        const scoreB = b.relevanceScore! * 0.6 + b.credibilityScore * 0.4;
        return scoreB - scoreA;
      })
      .slice(0, numResults);

    logger.info(`[SemanticSearch] Found ${rankedResults.length} results from ${rawResults.length} raw`);

    return {
      results: rankedResults,
      entities,
      totalSearched: rawResults.length,
      queryExpansion: expandedQuery !== query ? expandedQuery : undefined,
    };
  }

  /**
   * Extract entities from search query
   */
  private extractQueryEntities(query: string): KnowledgeGraphNode[] {
    const entities: KnowledgeGraphNode[] = [];
    
    // Location entities
    const locationPattern = /\b(in|from|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g;
    for (const match of query.matchAll(locationPattern)) {
      entities.push({
        entity: match[2],
        type: 'location',
        relatedEntities: [],
        confidence: 0.9,
      });
    }

    // Organization entities
    const orgPattern = /\b(find|collect|search)\s+(astrologers|restaurants|studios|companies|agencies)\b/gi;
    for (const match of query.matchAll(orgPattern)) {
      entities.push({
        entity: match[2],
        type: 'organization',
        relatedEntities: [match[2]],
        confidence: 0.85,
      });
    }

    // Technology entities
    const techKeywords = ['react', 'angular', 'vue', 'node', 'python', 'javascript', 'typescript', 'aws', 'docker'];
    const lowerQuery = query.toLowerCase();
    for (const tech of techKeywords) {
      if (lowerQuery.includes(tech)) {
        entities.push({
          entity: tech,
          type: 'technology',
          relatedEntities: [],
          confidence: 0.8,
        });
      }
    }

    return entities;
  }

  /**
   * Expand query with semantically related terms
   */
  private expandQuery(query: string, entities: KnowledgeGraphNode[]): string {
    let expanded = query;

    // Add synonyms and related terms based on detected entities
    const expansions: Record<string, string[]> = {
      'astrologers': ['astrology services', 'palmistry', 'horoscope readers', 'vedic astrologers'],
      'restaurants': ['dining', 'food delivery', 'cafes', 'eateries'],
      'yoga': ['yoga classes', 'meditation', 'wellness centers', 'fitness studios'],
      'marketing': ['digital marketing', 'SEO', 'social media', 'advertising'],
      'website': ['web development', 'web design', 'online presence'],
    };

    for (const entity of entities) {
      const relatedTerms = expansions[entity.entity.toLowerCase()];
      if (relatedTerms && !query.toLowerCase().includes(relatedTerms[0])) {
        expanded += ` OR ${relatedTerms.slice(0, 2).join(' OR ')}`;
      }
    }

    return expanded;
  }

  /**
   * Enhance search result with semantic metadata
   */
  private async enhanceResult(result: SearchResult, queryEntities: KnowledgeGraphNode[]): Promise<SemanticSearchResult> {
    const domain = this.extractDomain(result.url);
    const domainAuth = this.getDomainAuthority(domain);
    const credibility = this.calculateCredibility(result, domain);
    const contentType = this.detectContentType(result);
    const entities = this.extractResultEntities(result, queryEntities);

    const enhanced: SemanticSearchResult = {
      ...result,
      credibilityScore: credibility,
      domainAuthority: domainAuth,
      entities,
      contentType,
    };

    // Now generate explanation using the enhanced result
    enhanced.relevanceExplanation = this.generateRelevanceExplanation(enhanced, queryEntities);

    return enhanced;
  }

  /**
   * Calculate source credibility score (0-1)
   */
  private calculateCredibility(result: SearchResult, domain: string): number {
    let score = 0.5; // Base score

    // Domain authority contribution (0-0.3)
    const domainAuth = this.getDomainAuthority(domain);
    score += (domainAuth / 100) * 0.3;

    // Credible domain bonus (0-0.2)
    const isCredible = this.credibleDomains.has(domain) || 
                       Array.from(this.credibleDomains).some(cd => domain.endsWith(cd));
    if (isCredible) score += 0.2;

    // Content quality indicators (0-0.15)
    if (result.snippet.length > 100) score += 0.05;
    if (result.title.length > 20) score += 0.05;
    if (result.source === 'searxng') score += 0.05; // Aggregated sources tend to be better

    // URL structure (0-0.05)
    if (!result.url.includes('?') && !result.url.includes('#')) score += 0.05;

    return Math.min(score, 1.0);
  }

  /**
   * Get domain authority score (0-100)
   */
  private getDomainAuthority(domain: string): number {
    // Check exact match first
    if (this.domainAuthorityDB[domain]) {
      return this.domainAuthorityDB[domain];
    }

    // Check base domain
    const parts = domain.split('.');
    const baseDomain = parts.length > 2 ? parts.slice(-2).join('.') : domain;
    if (this.domainAuthorityDB[baseDomain]) {
      return this.domainAuthorityDB[baseDomain];
    }

    // Default based on TLD
    if (domain.endsWith('.edu')) return 90;
    if (domain.endsWith('.gov')) return 95;
    if (domain.endsWith('.org')) return 75;
    if (domain.endsWith('.com')) return 60;
    
    return 50; // Default for unknown domains
  }

  /**
   * Detect content type
   */
  private detectContentType(result: SearchResult): SemanticSearchResult['contentType'] {
    const url = result.url.toLowerCase();
    const title = result.title.toLowerCase();
    const snippet = result.snippet.toLowerCase();

    if (url.includes('/blog/') || title.includes('blog')) return 'blog';
    if (url.includes('/news/') || snippet.includes('reported')) return 'news';
    if (url.includes('.edu/') || title.includes('research')) return 'academic';
    if (title.includes('contact') || title.includes('about')) return 'business';
    if (snippet.includes('article') || snippet.includes('published')) return 'article';

    return 'unknown';
  }

  /**
   * Extract entities from result that match query entities
   */
  private extractResultEntities(result: SearchResult, queryEntities: KnowledgeGraphNode[]): string[] {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    const matched: string[] = [];

    for (const entity of queryEntities) {
      if (text.includes(entity.entity.toLowerCase())) {
        matched.push(entity.entity);
      }
    }

    return [...new Set(matched)];
  }

  /**
   * Generate human-readable relevance explanation
   */
  private generateRelevanceExplanation(result: SemanticSearchResult, queryEntities: KnowledgeGraphNode[]): string {
    const explanations: string[] = [];

    if (result.entities && result.entities.length > 0) {
      explanations.push(`Contains ${result.entities.length} matching entit${result.entities.length > 1 ? 'ies' : 'y'}`);
    }

    if (result.credibilityScore > 0.8) {
      explanations.push('High credibility source');
    } else if (result.credibilityScore > 0.6) {
      explanations.push('Moderate credibility');
    }

    if (result.domainAuthority > 80) {
      explanations.push(`Authoritative domain (${result.domainAuthority}/100)`);
    }

    return explanations.join(' • ') || 'Standard relevance';
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return url;
    }
  }

  /**
   * Build knowledge graph from multiple searches
   */
  async buildKnowledgeGraph(queries: string[]): Promise<Map<string, KnowledgeGraphNode>> {
    const graph = new Map<string, KnowledgeGraphNode>();

    for (const query of queries) {
      const entities = this.extractQueryEntities(query);
      
      for (const entity of entities) {
        if (graph.has(entity.entity)) {
          const existing = graph.get(entity.entity)!;
          existing.relatedEntities = [...new Set([...existing.relatedEntities, ...entity.relatedEntities])];
          existing.confidence = Math.max(existing.confidence, entity.confidence);
        } else {
          graph.set(entity.entity, entity);
        }
      }
    }

    logger.info(`[SemanticSearch] Built knowledge graph with ${graph.size} nodes`);
    return graph;
  }
}

export const semanticSearch = SemanticSearchEngine.getInstance();
