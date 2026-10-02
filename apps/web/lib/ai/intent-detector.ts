/**
 * SIDDHI v4.0 — Enterprise Intent Detection Engine
 * 
 * Advanced NLP-based intent classification to route queries to optimal processing pipelines:
 * - Informational (facts, research, knowledge)
 * - Transactional (lead generation, actions, tasks)
 * - Navigational (find specific resources)
 * - Creative (image/video generation, brainstorming)
 * - Analytical (data analysis, comparisons)
 * - Technical (code, debugging, development)
 */

import { logger } from '@/lib/utils/logger';

export type IntentType = 
  | 'informational'
  | 'transactional'
  | 'navigational'
  | 'creative'
  | 'analytical'
  | 'technical'
  | 'conversational';

export interface IntentDetection {
  primaryIntent: IntentType;
  confidence: number;
  secondaryIntent?: IntentType;
  entities: string[];
  keywords: string[];
  requiresSearch: boolean;
  requiresMultimodal: boolean;
  requiresCodeExecution: boolean;
  complexity: 'simple' | 'moderate' | 'complex';
  suggestedProvider: 'agnes' | 'groq' | 'zhipu' | 'openrouter' | 'local';
  suggestedModel?: string;
}

interface IntentPattern {
  intent: IntentType;
  patterns: RegExp[];
  keywords: string[];
  weight: number;
}

class IntentDetector {
  private static instance: IntentDetector | null = null;
  
  // Comprehensive pattern definitions
  private readonly patterns: IntentPattern[] = [
    {
      intent: 'informational',
      patterns: [
        /what is|who is|when did|where is|how does|why do|explain|define|describe|tell me about/i,
        /research|study|learn about|understand|information about/i,
        /history of|origin of|background on|overview of/i,
      ],
      keywords: ['what', 'who', 'when', 'where', 'how', 'why', 'explain', 'define', 'research', 'learn'],
      weight: 1.0,
    },
    {
      intent: 'transactional',
      patterns: [
        /find|search|collect|extract|generate|create list|compile/i,
        /get me|fetch|download|export|make csv/i,
        /contact details|email addresses|phone numbers|leads/i,
      ],
      keywords: ['find', 'search', 'collect', 'extract', 'generate', 'leads', 'contacts', 'csv', 'download'],
      weight: 1.2,
    },
    {
      intent: 'navigational',
      patterns: [
        /go to|open|navigate to|show me|take me to/i,
        /website of|page for|link to|url for/i,
        /find.*website|locate.*site/i,
      ],
      keywords: ['go to', 'open', 'navigate', 'website', 'link', 'url', 'page'],
      weight: 1.0,
    },
    {
      intent: 'creative',
      patterns: [
        /generate image|create video|make picture|design logo/i,
        /illustrate|visualize|draw|paint|render/i,
        /imagine|brainstorm|ideate|conceptualize/i,
      ],
      keywords: ['generate', 'create', 'image', 'video', 'design', 'illustrate', 'visualize'],
      weight: 1.1,
    },
    {
      intent: 'analytical',
      patterns: [
        /compare|analyze|evaluate|assess|review/i,
        /pros and cons|advantages|disadvantages|benefits vs drawbacks/i,
        /statistics|data|metrics|trends|performance/i,
      ],
      keywords: ['compare', 'analyze', 'evaluate', 'pros', 'cons', 'statistics', 'data', 'metrics'],
      weight: 1.0,
    },
    {
      intent: 'technical',
      patterns: [
        /write code|debug|fix error|implement function/i,
        /programming|javascript|typescript|python|react/i,
        /api endpoint|database query|algorithm|optimize/i,
      ],
      keywords: ['code', 'debug', 'fix', 'implement', 'programming', 'function', 'api', 'database'],
      weight: 1.1,
    },
    {
      intent: 'conversational',
      patterns: [
        /hello|hi |hey|good morning|good evening/i,
        /how are you|what's up|help me|can you/i,
        /thank you|thanks|bye|goodbye/i,
      ],
      keywords: ['hello', 'hi', 'hey', 'help', 'thanks', 'please', 'can you'],
      weight: 0.8,
    },
  ];

  // Entity extraction patterns
  private readonly entityPatterns = {
    location: /\b(in|from|at|near)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/g,
    organization: /\b(companies|businesses|studios|agencies|firms|organizations)\s+(in|from)?\s*([A-Z][a-z]+)?/g,
    person: /\b(find|contact|email)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)\b/g,
    technology: /\b(react|angular|vue|node|python|javascript|typescript|aws|docker)\b/gi,
  };

  static getInstance(): IntentDetector {
    if (!IntentDetector.instance) {
      IntentDetector.instance = new IntentDetector();
    }
    return IntentDetector.instance;
  }

  /**
   * Detect user intent from query text
   */
  detectIntent(query: string, context?: {
    hasAttachments?: boolean;
    previousIntent?: IntentType;
    userRole?: string;
  }): IntentDetection {
    const normalizedQuery = query.trim();
    
    if (!normalizedQuery) {
      return this.getDefaultIntent();
    }

    // Score each intent type
    const scores = this.patterns.map(pattern => ({
      intent: pattern.intent,
      score: this.calculateScore(normalizedQuery, pattern),
    }));

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);

    const primaryScore = scores[0];
    const secondaryScore = scores[1];

    // Extract entities and keywords
    const entities = this.extractEntities(normalizedQuery);
    const keywords = this.extractKeywords(normalizedQuery);

    // Determine complexity
    const complexity = this.assessComplexity(normalizedQuery, entities.length, keywords.length);

    // Determine required capabilities
    const requiresSearch = this.needsSearch(primaryScore.intent, keywords);
    const requiresMultimodal = this.needsMultimodal(primaryScore.intent, context?.hasAttachments || false);
    const requiresCodeExecution = primaryScore.intent === 'technical';

    // Select optimal provider
    const suggestedProvider = this.selectProvider(primaryScore.intent, complexity);
    const suggestedModel = this.selectModel(suggestedProvider, primaryScore.intent);

    const result: IntentDetection = {
      primaryIntent: primaryScore.intent,
      confidence: Math.min(primaryScore.score, 1.0),
      secondaryIntent: secondaryScore.score > 0.5 ? secondaryScore.intent : undefined,
      entities,
      keywords,
      requiresSearch,
      requiresMultimodal,
      requiresCodeExecution,
      complexity,
      suggestedProvider,
      suggestedModel,
    };

    logger.info(`[IntentDetector] Detected "${result.primaryIntent}" (${(result.confidence * 100).toFixed(0)}%) for: "${query.slice(0, 50)}..."`);

    return result;
  }

  /**
   * Calculate match score for a pattern against query
   */
  private calculateScore(query: string, pattern: IntentPattern): number {
    let score = 0;
    let maxPatternMatch = 0;

    // Check regex patterns
    for (const regex of pattern.patterns) {
      const matches = query.match(regex);
      if (matches) {
        maxPatternMatch = Math.max(maxPatternMatch, matches.length);
      }
    }

    // Check keyword matches
    const keywordMatches = pattern.keywords.filter(kw => 
      query.toLowerCase().includes(kw.toLowerCase())
    ).length;

    // Calculate weighted score
    score = (maxPatternMatch * 2 + keywordMatches) * pattern.weight;

    // Normalize to 0-1 range
    const totalPossible = (pattern.patterns.length * 2 + pattern.keywords.length) * pattern.weight;
    return totalPossible > 0 ? score / totalPossible : 0;
  }

  /**
   * Extract named entities from query
   */
  private extractEntities(query: string): string[] {
    const entities: string[] = [];

    // Extract locations
    const locationMatches = query.matchAll(this.entityPatterns.location);
    for (const match of locationMatches) {
      if (match[2]) entities.push(match[2]);
    }

    // Extract organizations
    const orgMatches = query.matchAll(this.entityPatterns.organization);
    for (const match of orgMatches) {
      if (match[1]) entities.push(match[1]);
    }

    // Extract technologies
    const techMatches = query.matchAll(this.entityPatterns.technology);
    for (const match of techMatches) {
      if (match[1]) entities.push(match[1]);
    }

    return [...new Set(entities)]; // Deduplicate
  }

  /**
   * Extract meaningful keywords from query
   */
  private extractKeywords(query: string): string[] {
    const stopWords = new Set(['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
      'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of', 'in', 'for', 'on',
      'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after']);

    const words = query.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));

    return [...new Set(words)];
  }

  /**
   * Assess query complexity
   */
  private assessComplexity(query: string, entityCount: number, keywordCount: number): 'simple' | 'moderate' | 'complex' {
    const wordCount = query.split(/\s+/).length;
    const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;
    const hasComplexTerms = /\b(analyze|compare|evaluate|synthesize|comprehensive)\b/i.test(query);

    if (wordCount > 20 || entityCount > 3 || hasMultipleQuestions || hasComplexTerms) {
      return 'complex';
    } else if (wordCount > 10 || entityCount > 1) {
      return 'moderate';
    }
    return 'simple';
  }

  /**
   * Determine if search is needed
   */
  private needsSearch(intent: IntentType, keywords: string[]): boolean {
    const searchIntents = ['informational', 'transactional', 'navigational', 'analytical'];
    const searchKeywords = ['find', 'search', 'current', 'latest', 'recent', 'today', 'news'];
    
    return searchIntents.includes(intent) || 
           keywords.some(kw => searchKeywords.includes(kw));
  }

  /**
   * Determine if multimodal processing is needed
   */
  private needsMultimodal(intent: IntentType, hasAttachments: boolean): boolean {
    return intent === 'creative' || hasAttachments;
  }

  /**
   * Select optimal AI provider based on intent and complexity
   */
  private selectProvider(intent: IntentType, complexity: 'simple' | 'moderate' | 'complex'): 'agnes' | 'groq' | 'zhipu' | 'openrouter' | 'local' {
    switch (intent) {
      case 'creative':
        return 'agnes'; // Best for creative tasks
      case 'technical':
        return complexity === 'complex' ? 'groq' : 'agnes';
      case 'analytical':
        return complexity === 'complex' ? 'openrouter' : 'groq';
      case 'transactional':
        return 'agnes'; // Good for structured tasks
      case 'informational':
        return complexity === 'complex' ? 'openrouter' : 'groq';
      default:
        return 'agnes'; // Default fallback
    }
  }

  /**
   * Select specific model based on provider and intent
   */
  private selectModel(provider: string, intent: IntentType): string | undefined {
    const models: Record<string, Record<string, string>> = {
      agnes: {
        creative: 'agnes-2.5-flash',
        technical: 'agnes-2.5-pro',
        default: 'agnes-2.5-flash',
      },
      groq: {
        technical: 'llama-3.3-70b-versatile',
        analytical: 'llama-3.3-70b-versatile',
        default: 'llama-3.1-8b-instant',
      },
      zhipu: {
        informational: 'glm-4-flash',
        default: 'glm-4-plus',
      },
      openrouter: {
        analytical: 'meta-llama/llama-3.3-70b-instruct:free',
        default: 'meta-llama/llama-3.1-8b-instruct:free',
      },
    };

    const providerModels = models[provider];
    if (!providerModels) return undefined;

    // Map intent to model category
    const modelKey = intent === 'creative' ? 'creative' : 
                     intent === 'technical' ? 'technical' :
                     intent === 'analytical' ? 'analytical' :
                     intent === 'informational' ? 'informational' : 'default';

    return providerModels[modelKey] || providerModels.default;
  }

  /**
   * Get default intent for empty queries
   */
  private getDefaultIntent(): IntentDetection {
    return {
      primaryIntent: 'conversational',
      confidence: 0.5,
      entities: [],
      keywords: [],
      requiresSearch: false,
      requiresMultimodal: false,
      requiresCodeExecution: false,
      complexity: 'simple',
      suggestedProvider: 'agnes',
      suggestedModel: 'agnes-2.5-flash',
    };
  }
}

export const intentDetector = IntentDetector.getInstance();
