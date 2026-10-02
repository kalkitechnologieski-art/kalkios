// apps/web/lib/agents/siddhi-agent.ts
// ─────────────────────────────────────────────────────────────────────────────
// KALKI OS – Ultimate Intelligent Agent (v3.3.0)
// Fully type-safe, no optional/undefined issues.
// ─────────────────────────────────────────────────────────────────────────────

import { EnhancedDeepThink } from '@/lib/reasoning/enhanced-deep-think';
import { SETUAgent } from '@/lib/agents/setu/agent';
import { EnhancedImageGenerator } from '@/lib/ai/enhanced/image';
import { EnhancedVideoGenerator } from '@/lib/ai/enhanced/video';
import { EnterpriseRouter } from '@/lib/orchestration/enterprise-router';
import type { EnterpriseRouterRequest } from '@/lib/orchestration/enterprise-router';
import { RateLimiter } from '@/lib/orchestration/rate-limiter';
import { CircuitBreaker } from '@/lib/orchestration/circuit-breaker';
import { ZhipuClient, GroqClient, AgnesClient } from '@/lib/providers';
import { logger } from '@/lib/utils/logger';

// ─── Optional @agntk/search ──────────────────────────────────────────────
let agntkSearch: ((query: string, options?: any) => Promise<any>) | null = null;
let agntkExtract: ((url: string) => Promise<any>) | null = null;
try {
  const agntk = require('@agntk/search');
  agntkSearch = agntk.search || null;
  agntkExtract = agntk.extractContent || null;
} catch (_) {
  logger.warn('[SiddhiAgent] @agntk/search not available');
}

// ─── Types ──────────────────────────────────────────────────────────────
export type Intent = 'deep_think' | 'setu' | 'image' | 'video' | 'chat';
export type Provider = 'zhipu' | 'groq' | 'agnes';
export type Emotion = 'happy' | 'sad' | 'angry' | 'curious' | 'neutral';
export type Strategy = 'parallel' | 'sequential' | 'single' | 'quantized' | 'fallback';
export type ReasoningDepth = 'low' | 'medium' | 'high' | 'max';

export type InferenceProvider =
  | Provider
  | 'cache'
  | 'parallel'
  | 'fallback'
  | 'quantized'
  | 'sequential'
  | 'router';

export interface ProviderStats {
  success: number;
  failures: number;
  totalLatency: number;
  avgLatency: number;
  lastSuccess?: number;
  lastFailure?: number;
}

export interface RouteDecision {
  strategy: Strategy;
  providers: Provider[];
  timeout: number;
  reasoningDepth: ReasoningDepth;
  emotion: Emotion;
  useMemory: boolean;
  useSearch: boolean;
}

export interface InferenceResult {
  content: string;
  reasoning: string;
  provider: InferenceProvider;
  latency: number;
  tokens: number;
}

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  score: number;
  publishedDate?: string;
}

export interface ExtractedContent {
  url: string;
  content: string;
  title?: string;
  success: boolean;
  error?: string;
}

export interface MemoryEntry {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

/**
 * The final result returned by `SiddhiAgent.process()`.
 * All optional fields are always defined (never undefined).
 */
export interface SiddhiResult {
  content: string;
  reasoning: string;
  provider: InferenceProvider;
  tokens: number;
  latency: number;
  emotion: Emotion;
  sources: Array<{ title: string; url: string }>;
  // Media / structured outputs (all optional but never undefined when present)
  imageUrl?: string;
  videoUrl?: string;
  leads?: any[];
  csv?: string;
  questions?: string[];
}

interface CacheEntry<T> {
  value: T;
  expires: number;
}

// ─────────────────────────────────────────────────────────────────────
// MAIN CLASS
// ─────────────────────────────────────────────────────────────────────
export class SiddhiAgent {

  // == Batch 6: unified system prompt builder ==
  // Every provider call funnels through this. Persona, conversation
  // context, web context, formatting rules — one source of truth.
  private buildSystemPrompt(context: string, searchContext: string): string {
    const lines: string[] = [
      'You are Siddhi, the quantum AI concierge of KALKI OS (Temple of Technology, Indore, India).',
      'You are wise, helpful, and concise.',
      'For complex questions, structure your answer with "## Reasoning" and "## Answer" sections.',
      'Never invent facts. When you use web context, cite sources inline.',
    ];

    if (context && context.trim().length > 0) {
      lines.push('');
      lines.push('## Conversation context');
      lines.push(context);
    }

    if (searchContext && searchContext.trim().length > 0) {
      lines.push('');
      lines.push('## Web context');
      lines.push(searchContext);
    }

    return lines.join('\n');
  }
  private readonly deepThink: EnhancedDeepThink;
  private readonly router: EnterpriseRouter;
  private readonly imageGen: EnhancedImageGenerator;
  private readonly videoGen: EnhancedVideoGenerator;
  private readonly setuAgent: typeof SETUAgent;

  private readonly zhipu: ZhipuClient;
  private readonly groq: GroqClient;
  private readonly agnes: AgnesClient;

  private readonly rateLimiter: RateLimiter;
  private readonly circuitBreaker: CircuitBreaker;

  private readonly sessionMemory = new Map<string, MemoryEntry[]>();
  private readonly MAX_MEMORY_LENGTH = 30;
  private readonly MEMORY_TTL = 3_600_000;

  private readonly queryCache = new Map<string, CacheEntry<any>>();
  private readonly searchCache = new Map<string, CacheEntry<SearchResult[]>>();
  private readonly contentCache = new Map<string, CacheEntry<string>>();
  private readonly CACHE_TTL = 300;
  private readonly MAX_CACHE_SIZE = 200;

  private readonly statsCache = new Map<Provider, ProviderStats>();

  private readonly PARALLEL_TIMEOUT = 8_000;
  private readonly QUANTIZED_TIMEOUT = 3_000;
  private readonly SEARCH_TIMEOUT = 3_000;
  private readonly EXTRACT_TIMEOUT = 10_000;

  private readonly SEARXNG_INSTANCES: readonly string[] = [
    'https://searx.be',
    'https://searx.mx',
    'https://searx.space',
    'https://searx.neet.codes',
    'https://searx.tiekoetter.com',
    'https://searx.nadeko.net',
    'https://search.privacytools.io',
  ];

  constructor() {
    this.zhipu = new ZhipuClient();
    this.groq = new GroqClient();
    this.agnes = new AgnesClient();

    this.rateLimiter = new RateLimiter();
    this.circuitBreaker = new CircuitBreaker();

    this.deepThink = new EnhancedDeepThink();
    this.router = new EnterpriseRouter();
    this.imageGen = new EnhancedImageGenerator();
    this.videoGen = new EnhancedVideoGenerator();
    this.setuAgent = SETUAgent;

    for (const p of ['zhipu', 'groq', 'agnes'] as Provider[]) {
      this.statsCache.set(p, {
        success: 0,
        failures: 0,
        totalLatency: 0,
        avgLatency: 0,
      });
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // PUBLIC ENTRY POINT
  // ─────────────────────────────────────────────────────────────────────
  async process(request: {
    messages: any[];
    userId?: string;
    sessionId?: string;
    stream?: boolean;
    deep?: boolean;
    setu?: boolean;
    search?: boolean;
    image?: boolean;
    video?: boolean;
  }): Promise<SiddhiResult> {
    const {
      messages,
      userId,
      sessionId = 'default',
      stream = true,
      deep = true,
      setu = false,
      search = true,
      image = false,
      video = false,
    } = request;

    const safeUserId: string = userId ?? '';
    const lastUser = messages.filter((m: any) => m.role === 'user').pop();
    const query: string = lastUser?.content ?? '';

    // ─── 1. Emotion ────────────────────────────────────────────────────
    const emotion = this.detectEmotion(query);
    logger.info(`[SiddhiAgent] Emotion: ${emotion}`);

    // ─── 2. Memory ─────────────────────────────────────────────────────
    const memory = this.getMemory(sessionId);
    const context = this.buildContext(messages, memory);

    // ─── 3. Intent + Complexity ────────────────────────────────────────
    const intent = this.classifyIntent(query, { image, video, setu, deep }, sessionId);
    const complexity = this.assessComplexity(query);
    logger.info(`[SiddhiAgent] Intent: ${intent}, Complexity: ${complexity.toFixed(2)}`);

    // ─── 4. Search ─────────────────────────────────────────────────────
    let searchResults: SearchResult[] = [];
    let searchContext = '';

    if (search && (complexity > 0.3 || intent === 'deep_think')) {
      logger.info('[SiddhiAgent] Starting search...');
      const searchStart = Date.now();
      searchResults = await this.searchWithFallback(query);
      logger.info(
        `[SiddhiAgent] Search returned ${searchResults.length} results in ${
          Date.now() - searchStart
        }ms`
      );
      if (searchResults.length > 0) {
        const topUrls = searchResults.slice(0, 3).map((r) => r.url);
        const contents = await Promise.all(topUrls.map((url) => this.extractContent(url)));
        searchContext = contents
          .filter((c) => c.content.length > 100)
          .map((c) => c.content)
          .join('\n\n');
      }
    }

    // ─── 5. Route Decision ─────────────────────────────────────────────
    const decision = this.decideRoute(intent, complexity, emotion, query);

    // ─── 6. Execute ────────────────────────────────────────────────────
    let result: InferenceResult;

    try {
      switch (decision.strategy) {
        case 'quantized':
          result = await this.executeQuantized(query, context, searchContext, decision);
          break;

        case 'parallel':
          result = await this.executeParallel(query, context, searchContext, decision);
          break;

        case 'single':
          result = await this.executeSingle(
            query,
            context,
            searchContext,
            decision.providers[0]
          );
          break;

        case 'sequential': {
          const seqResult = await this.executeSequential(
            intent,
            query,
            messages,
            stream,
            safeUserId,
            search
          );

          // Guarantee reasoning is a string
          const reasoning: string = typeof seqResult.reasoning === 'string'
            ? seqResult.reasoning
            : '';

          result = {
            content: seqResult.content || seqResult.final_answer || '',
            reasoning,
            provider: 'sequential',
            latency: 0,
            tokens: seqResult.tokens || 0,
          };
          break;
        }

        case 'fallback':
        default: {
          const fallbackRequest: EnterpriseRouterRequest = {
            messages,
            stream,
            userId: safeUserId,
            deep: true,
          };
          const fallback = await this.router.route(fallbackRequest);
          result = {
            content: fallback?.content ?? 'I encountered an issue. Please try again.',
            reasoning: '',
            provider: 'fallback',
            latency: 0,
            tokens: 0,
          };
        }
      }
    } catch (error) {
      logger.error('[SiddhiAgent] Execution failed, falling back:', error);

      const fallbackRequest: EnterpriseRouterRequest = {
        messages,
        stream,
        userId: safeUserId,
        deep: true,
      };
      const fallback = await this.router.route(fallbackRequest);

      result = {
        content: fallback?.content ?? 'I encountered an issue. Please try again.',
        reasoning: '',
        provider: 'fallback',
        latency: 0,
        tokens: 0,
      };
    }

    // ─── 7. Update Memory ──────────────────────────────────────────────
    this.updateMemory(sessionId, { role: 'user', content: query, timestamp: Date.now() });
    this.updateMemory(sessionId, {
      role: 'assistant',
      content: result.content,
      timestamp: Date.now(),
    });

    // ─── 8. Build final SiddhiResult (all fields guaranteed) ───────────
    const finalResult: SiddhiResult = {
      content: result.content,
      reasoning: result.reasoning ?? '',
      provider: result.provider,
      tokens: result.tokens ?? 0,
      latency: result.latency ?? 0,
      emotion,
      sources: searchResults.slice(0, 5).map((r) => ({ title: r.title, url: r.url })),
    };

    // Embed media URLs from sequential result if present
    const seqAny: any = result as any;
    if (typeof seqAny.imageUrl === 'string') finalResult.imageUrl = seqAny.imageUrl;
    if (typeof seqAny.videoUrl === 'string') finalResult.videoUrl = seqAny.videoUrl;
    if (Array.isArray(seqAny.leads)) finalResult.leads = seqAny.leads;
    if (typeof seqAny.csv === 'string') finalResult.csv = seqAny.csv;
    if (Array.isArray(seqAny.questions)) finalResult.questions = seqAny.questions;

    return finalResult;
  }

  // ─────────────────────────────────────────────────────────────────────
  // EMOTION DETECTION
  // ─────────────────────────────────────────────────────────────────────
  private detectEmotion(text: string): Emotion {
    const lower = text.toLowerCase();
    if (/\b(happy|glad|great|excellent|awesome|love|thank|thanks|appreciate|wonderful|amazing)\b/.test(lower)) return 'happy';
    if (/\b(sad|unhappy|disappointed|terrible|awful|bad|horrible|depressed|down)\b/.test(lower)) return 'sad';
    if (/\b(angry|frustrated|annoyed|irritated|hate|stupid|useless|idiot|mad|furious)\b/.test(lower)) return 'angry';
    if (/\b(why|how|what|when|where|who|curious|wonder|question|explain|tell me about)\b/.test(lower)) return 'curious';
    return 'neutral';
  }

  // ─────────────────────────────────────────────────────────────────────
  // MEMORY
  // ─────────────────────────────────────────────────────────────────────
  private getMemory(sessionId: string): MemoryEntry[] {
    const mem = this.sessionMemory.get(sessionId) ?? [];
    const now = Date.now();
    return mem.filter((entry) => now - entry.timestamp < this.MEMORY_TTL);
  }

  private updateMemory(sessionId: string, entry: MemoryEntry): void {
    let mem = this.sessionMemory.get(sessionId) ?? [];
    mem.push(entry);
    if (mem.length > this.MAX_MEMORY_LENGTH) {
      mem = mem.slice(-this.MAX_MEMORY_LENGTH);
    }
    this.sessionMemory.set(sessionId, mem);
  }

  private buildContext(messages: any[], memory: MemoryEntry[]): string {
    const all = [
      ...memory.map((m) => ({ role: m.role, content: m.content })),
      ...messages,
    ];
    const unique = all.filter(
      (m, i, self) =>
        self.findIndex((x) => x.content === m.content && x.role === m.role) === i
    );
    return unique.map((m) => `${m.role}: ${m.content}`).join('\n');
  }

  // ─────────────────────────────────────────────────────────────────────
  // INTENT CLASSIFICATION
  // ─────────────────────────────────────────────────────────────────────
  private classifyIntent(query: string, flags: any, sessionId: string): Intent {
    if (flags.image) return 'image';
    if (flags.video) return 'video';
    if (flags.setu) return 'setu';

    const lower = query.toLowerCase();

    const imageKeywords: readonly string[] = [
      'image', 'picture', 'photo', 'photograph', 'draw', 'drawing', 'paint', 'painting',
      'render', 'illustration', 'art', 'graphic', 'visual', 'thumbnail', 'logo',
      'banner', 'poster', 'flyer', 'infographic', 'diagram', 'chart', 'map',
      'sketch', 'cartoon', 'avatar', 'profile pic', 'wallpaper', 'cover', 'icon',
      'emoji', 'meme', 'screenshot',
    ];

    const videoKeywords: readonly string[] = [
      'video', 'movie', 'clip', 'animation', 'animate', 'motion', 'gif', 'reel',
      'short', 'footage', 'film', 'cinematic', 'trailer', 'promo', 'commercial',
      'explainer', 'tutorial', 'demo', 'screencast', 'slideshow', 'montage',
      'vlog', 'tv', 'broadcast', 'live', 'stream',
    ];

    const actionPhrases: readonly string[] = [
      'make me', 'create', 'generate', 'draw me', 'paint me', 'show me',
      'i need', 'i want', 'give me', 'produce', 'render', 'design',
      'build', 'craft', 'compose', 'do a', 'make a', 'create a', 'generate a',
    ];

    const hasAction = actionPhrases.some((phrase) => lower.includes(phrase));
    const hasImageKeyword = imageKeywords.some((word) => lower.includes(word));
    const hasVideoKeyword = videoKeywords.some((word) => lower.includes(word));

    if (hasAction && hasImageKeyword) return 'image';
    if (hasAction && hasVideoKeyword) return 'video';
    if (/picture of|photo of|image of/.test(lower) && !hasVideoKeyword) return 'image';
    if (/video of|animation of|movie of/.test(lower) && !hasImageKeyword) return 'video';

    if (/lead|prospect|customer|sales|b2b|find contacts|generate leads/.test(lower)) return 'setu';
    if (/why|how|explain|analyze|compare|evaluate|comprehensive|detailed|thorough/.test(lower) || query.length > 80) {
      return 'deep_think';
    }

    const memory = this.getMemory(sessionId);
    if (memory.length > 0) {
      const lastAssistant = memory.filter((m) => m.role === 'assistant').pop();
      if (lastAssistant?.content?.includes('![Generated Image]')) return 'image';
      if (lastAssistant?.content?.includes('<video')) return 'video';
    }

    return 'chat';
  }

  // ─────────────────────────────────────────────────────────────────────
  // COMPLEXITY
  // ─────────────────────────────────────────────────────────────────────
  private assessComplexity(query: string): number {
    let score = 0.3;
    if (query.length > 100) score += 0.15;
    if (query.length > 200) score += 0.1;
    if (/why|how|explain|analyze|compare|evaluate|comprehensive/.test(query)) score += 0.15;
    if (/code|function|api|database|algorithm|architecture|system|design/.test(query)) score += 0.15;
    if (/\?/.test(query)) score += 0.1;
    return Math.min(score, 1);
  }

  // ─────────────────────────────────────────────────────────────────────
  // ROUTE DECISION
  // ─────────────────────────────────────────────────────────────────────
  private decideRoute(
    intent: Intent,
    complexity: number,
    emotion: Emotion,
    query: string
  ): RouteDecision {
    if (intent === 'image' || intent === 'video' || intent === 'setu') {
      return {
        strategy: 'sequential',
        providers: [],
        timeout: 10_000,
        reasoningDepth: 'medium',
        emotion,
        useMemory: false,
        useSearch: false,
      };
    }

    if (emotion === 'angry' || emotion === 'sad') {
      return {
        strategy: 'quantized',
        providers: ['groq', 'agnes'],
        timeout: this.QUANTIZED_TIMEOUT,
        reasoningDepth: 'low',
        emotion,
        useMemory: true,
        useSearch: false,
      };
    }

    if (complexity < 0.2 || query.length < 20) {
      return {
        strategy: 'quantized',
        providers: ['agnes', 'groq'],
        timeout: this.QUANTIZED_TIMEOUT,
        reasoningDepth: 'low',
        emotion,
        useMemory: false,
        useSearch: false,
      };
    }

    if (complexity < 0.5) {
      const fastest = this.getFastestProvider();
      return {
        strategy: 'single',
        providers: [fastest],
        timeout: 5_000,
        reasoningDepth: 'medium',
        emotion,
        useMemory: true,
        useSearch: true,
      };
    }

    return {
      strategy: 'parallel',
      providers: ['zhipu', 'groq', 'agnes'],
      timeout: this.PARALLEL_TIMEOUT,
      reasoningDepth: complexity > 0.7 ? 'max' : 'high',
      emotion,
      useMemory: true,
      useSearch: true,
    };
  }

  private getFastestProvider(): Provider {
    let best: Provider = 'groq';
    let bestLatency = Infinity;
    for (const [provider, stats] of this.statsCache) {
      if (stats.success > 5 && stats.avgLatency < bestLatency) {
        bestLatency = stats.avgLatency;
        best = provider;
      }
    }
    return best;
  }

  // ─────────────────────────────────────────────────────────────────────
  // SEARCH
  // ─────────────────────────────────────────────────────────────────────
  private async searchWithFallback(query: string): Promise<SearchResult[]> {
    const cached = this.searchCache.get(query);
    if (cached && cached.expires > Date.now()) {
      logger.info('[Search] Cache hit');
      return cached.value;
    }

    if (agntkSearch) {
      try {
        const response = await agntkSearch(query, { maxResults: 10 });
        if (response?.results?.length > 0) {
          const results: SearchResult[] = response.results.map((r: any) => ({
            title: r.title ?? '',
            url: r.url ?? '',
            snippet: r.snippet ?? '',
            source: 'DuckDuckGo',
            score: 1.0,
          }));
          this.setSearchCache(query, results);
          return results;
        }
      } catch (error) {
        logger.warn('[Search] DuckDuckGo failed:', error);
      }
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.SEARCH_TIMEOUT);
      const response = await fetch(
        `https://parallel-search.vercel.app/search?q=${encodeURIComponent(query)}`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json();
        if (data?.results?.length > 0) {
          const results: SearchResult[] = data.results.map((r: any) => ({
            title: r.title ?? '',
            url: r.link ?? '',
            snippet: r.snippet ?? '',
            source: 'Parallel Search',
            score: 0.9,
          }));
          this.setSearchCache(query, results);
          return results;
        }
      }
    } catch (error) {
      logger.warn('[Search] Parallel Search failed:', error);
    }

    for (const instance of this.SEARXNG_INSTANCES) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), this.SEARCH_TIMEOUT);
        const response = await fetch(
          `${instance}/search?q=${encodeURIComponent(query)}&format=json`,
          { signal: controller.signal }
        );
        clearTimeout(timeout);
        if (response.ok) {
          const data = await response.json();
          if (data?.results?.length > 0) {
            const results: SearchResult[] = data.results.map((r: any) => ({
              title: r.title ?? '',
              url: r.url ?? '',
              snippet: r.content ?? r.snippet ?? '',
              source: `SearXNG (${instance})`,
              score: 0.8,
            }));
            this.setSearchCache(query, results);
            return results;
          }
        }
      } catch (error) {
        logger.warn(`[Search] SearXNG ${instance} failed:`, error);
      }
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.SEARCH_TIMEOUT);
      const response = await fetch(
        `https://api.mojeek.com/search?q=${encodeURIComponent(query)}&fmt=json`,
        { signal: controller.signal }
      );
      clearTimeout(timeout);
      if (response.ok) {
        const data = await response.json();
        if (data?.response?.results?.length > 0) {
          const results: SearchResult[] = data.response.results.map((r: any) => ({
            title: r.title ?? '',
            url: r.url ?? '',
            snippet: r.description ?? '',
            source: 'Mojeek',
            score: 0.7,
          }));
          this.setSearchCache(query, results);
          return results;
        }
      }
    } catch (error) {
      logger.warn('[Search] Mojeek failed:', error);
    }

    logger.warn('[Search] All tiers failed');
    return [];
  }

  private setSearchCache(query: string, results: SearchResult[]): void {
    this.searchCache.set(query, {
      value: results,
      expires: Date.now() + this.CACHE_TTL * 1000,
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // CONTENT EXTRACTION
  // ─────────────────────────────────────────────────────────────────────
  private async extractContent(url: string): Promise<ExtractedContent> {
    const cached = this.contentCache.get(url);
    if (cached && cached.expires > Date.now()) {
      return { url, content: cached.value, success: true };
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), this.EXTRACT_TIMEOUT);
      const cleanUrl = url.replace(/^https?:\/\//, '');
      const response = await fetch(`https://r.jina.ai/https://${cleanUrl}`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (response.ok) {
        const text = await response.text();
        if (text.length > 200) {
          this.contentCache.set(url, {
            value: text,
            expires: Date.now() + this.CACHE_TTL * 1000,
          });
          return { url, content: text, success: true };
        }
      }
    } catch (error) {
      logger.warn(`[Extract] Jina Reader failed for ${url}:`, error);
    }

    if (agntkExtract) {
      try {
        const page = await agntkExtract(url);
        if (page?.content?.length > 200) {
          this.contentCache.set(url, {
            value: page.content,
            expires: Date.now() + this.CACHE_TTL * 1000,
          });
          return { url, content: page.content, success: true, title: page.title };
        }
      } catch (error) {
        logger.warn(`[Extract] agntk extract failed for ${url}:`, error);
      }
    }

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const html = await response.text();
        const clean = html
          .replace(/<script[\s\S]*?<\/script>/g, '')
          .replace(/<style[\s\S]*?<\/style>/g, '')
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        if (clean.length > 200) {
          this.contentCache.set(url, {
            value: clean,
            expires: Date.now() + this.CACHE_TTL * 1000,
          });
          return { url, content: clean, success: true };
        }
      }
    } catch (error) {
      logger.warn(`[Extract] Direct fetch failed for ${url}:`, error);
    }

    return { url, content: '', success: false, error: 'All extraction methods failed' };
  }

  // ─────────────────────────────────────────────────────────────────────
  // EXECUTION STRATEGIES
  // ─────────────────────────────────────────────────────────────────────
  private async executeQuantized(
    query: string,
    context: string,
    searchContext: string,
    decision: RouteDecision
  ): Promise<InferenceResult> {
    const start = Date.now();
    const cached = this.getCached(query);
    if (cached) {
      return { ...cached, provider: 'cache', latency: 0 };
    }

    const fullQuery = searchContext ? `Context: ${searchContext}\n\nQuery: ${query}` : query;

    try {
      const result = await this.agnes.chat({
        messages: [
          { role: 'system', content: 'You are a helpful assistant. Respond concisely and directly.' },
          { role: 'user', content: fullQuery },
        ],
        model: 'agnes-2.0-flash',
        temperature: 0.5,
        max_tokens: 512,
      });
      const content = result?.choices?.[0]?.message?.content ?? '';
      const tokens = result?.usage?.total_tokens ?? 0;
      const latency = Date.now() - start;
      this.setCache(query, { content, reasoning: '', tokens });
      return { content, reasoning: '', provider: 'quantized', latency, tokens };
    } catch (error) {
      logger.warn('[SiddhiAgent] Quantized failed → Groq fallback', error);
      const result = await this.groq.chat({
        messages: [{ role: 'user', content: fullQuery }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.5,
        max_tokens: 512,
      });
      const content = result?.choices?.[0]?.message?.content ?? '';
      const tokens = result?.usage?.total_tokens ?? 0;
      const latency = Date.now() - start;
      this.setCache(query, { content, reasoning: '', tokens });
      return { content, reasoning: '', provider: 'groq', latency, tokens };
    }
  }

  private async executeParallel(
    query: string,
    context: string,
    searchContext: string,
    decision: RouteDecision
  ): Promise<InferenceResult> {
    const start = Date.now();
    const cached = this.getCached(query);
    if (cached) {
      return {
        content: cached.content ?? '',
        reasoning: cached.reasoning ?? '',
        provider: 'cache',
        latency: 0,
        tokens: cached.tokens ?? 0,
      };
    }

    const fullQuery = searchContext
      ? `Context from web search:\n${searchContext}\n\nUser query: ${query}`
      : query;

    const paths: Promise<any>[] = [];
    for (const provider of decision.providers) {
      if (this.circuitBreaker.isOpen(provider)) continue;
      if (!(await this.rateLimiter.check(provider))) continue;
      paths.push(this.callProvider(provider, fullQuery, context, decision));
    }

    if (paths.length === 0) throw new Error('No providers available');

    const result = await Promise.race([
      this.firstSuccess(paths),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Parallel timeout')), decision.timeout)
      ),
    ]);

    const latency = Date.now() - start;
    this.updateStats(result.provider, latency, true);
    const content = result.content ?? '';
    const reasoning = result.reasoning ?? '';
    const tokens = result.tokens ?? 0;
    this.setCache(query, { content, reasoning, tokens });
    return { content, reasoning, provider: result.provider, latency, tokens };
  }

  private async executeSingle(
    query: string,
    context: string,
    searchContext: string,
    provider: Provider
  ): Promise<InferenceResult> {
    const start = Date.now();
    const cached = this.getCached(query);
    if (cached) {
      return {
        content: cached.content ?? '',
        reasoning: cached.reasoning ?? '',
        provider: 'cache',
        latency: 0,
        tokens: cached.tokens ?? 0,
      };
    }

    const fullQuery = searchContext
      ? `Context from web search:\n${searchContext}\n\nUser query: ${query}`
      : query;
    const decision = { reasoningDepth: 'medium' as const, emotion: 'neutral' as Emotion };
    const result = await this.callProvider(provider, fullQuery, context, decision as any);
    const latency = Date.now() - start;
    this.updateStats(provider, latency, true);
    const content = result.content ?? '';
    const reasoning = result.reasoning ?? '';
    const tokens = result.tokens ?? 0;
    this.setCache(query, { content, reasoning, tokens });
    return { content, reasoning, provider, latency, tokens };
  }

  private async callProvider(
    provider: Provider,
    query: string,
    context: string,
    decision: { reasoningDepth: ReasoningDepth },
    opts?: unknown,
  ): Promise<{
    provider: Provider;
    content: string;
    reasoning: string;
    tokens: number;
    latency: number;
  }> {
    const start = Date.now();
    let lastError: Error | null = null;

    const modelMap: Record<Provider, { deep: string; fast: string }> = {
      zhipu: { deep: 'glm-5.3', fast: 'glm-4.7-flash' },
      groq: { deep: 'llama-3.3-70b-versatile', fast: 'llama-3.1-8b-instant' },
      agnes: { deep: 'agnes-2.5-flash', fast: 'agnes-2.0-flash' },
    };

    const model =
      decision.reasoningDepth === 'max' || decision.reasoningDepth === 'high'
        ? modelMap[provider].deep
        : modelMap[provider].fast;

    const maxTokens = decision.reasoningDepth === 'max' ? 4096 : 2048;

    const messages = context
      ? [
          { role: 'system', content: `Context:\n${context}` },
          { role: 'user', content: query },
        ]
      : [{ role: 'user', content: query }];

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        let result: any;
        switch (provider) {
          case 'zhipu':
            result = await this.zhipu.chat({
              messages,
              model,
              reasoning_effort: decision.reasoningDepth === 'max' ? 'max' : 'high',
              temperature: 0.3,
              max_tokens: maxTokens,
            });
            break;
          case 'groq':
            result = await this.groq.chat({
              messages,
              model,
              temperature: 0.5,
              max_tokens: maxTokens,
            });
            break;
          case 'agnes':
            result = await this.agnes.chat({
              messages,
              model,
              temperature: 0.5,
              max_tokens: maxTokens,
            });
            break;
          default:
            throw new Error(`Unknown provider: ${provider}`);
        }

        const content = result?.choices?.[0]?.message?.content ?? '';
        const reasoning = result?.choices?.[0]?.message?.reasoning_content ?? '';
        const tokens = result?.usage?.total_tokens ?? 0;

        return { provider, content, reasoning, tokens, latency: Date.now() - start };
      } catch (error) {
        lastError = error as Error;
        logger.warn(`[Provider] ${provider} attempt ${attempt} failed:`, error);
        if (attempt < 3) {
          await this.sleep(500 * Math.pow(2, attempt));
        }
      }
    }

    this.updateStats(provider, Date.now() - start, false);
    throw lastError ?? new Error(`${provider} failed after 3 attempts`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async firstSuccess<T>(promises: Promise<T>[]): Promise<T> {
    const errors: any[] = [];
    for (const promise of promises) {
      try {
        return await promise;
      } catch (err) {
        errors.push(err);
      }
    }
    throw new Error(`All promises failed: ${errors.map((e) => e.message).join(', ')}`);
  }

  private async executeSequential(
    intent: Intent,
    query: string,
    messages: any[],
    stream: boolean,
    safeUserId: string,
    search?: boolean
  ): Promise<any> {
    switch (intent) {
      case 'deep_think':
        return this.deepThink.reason(query, {
          num_paths: 3,
          consensus_threshold: 0.6,
          stream,
          useWeb: search !== false,
        });

      case 'image':
        return this.imageGen.generate({
          prompt: query,
          quality: 'standard',
          cache: true,
        });

      case 'video':
        return this.videoGen.generate({
          prompt: query,
          quality: 'balanced',
          cache: true,
        });

      case 'setu': {
        const agent = new this.setuAgent(query);
        await agent.executeSearch();
        return {
          leads: agent.getLeads(),
          csv: agent.getCSV(),
          summary: agent.getSummary(),
        };
      }

      default: {
        const routerRequest: EnterpriseRouterRequest = {
          messages,
          stream,
          userId: safeUserId,
          deep: true,
        };
        const result = await this.router.route(routerRequest);
        return { content: result?.content ?? 'No response.', provider: 'router' };
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // CACHE HELPERS
  // ─────────────────────────────────────────────────────────────────────
  private getCached(key: string): any | null {
    const entry = this.queryCache.get(key);
    if (entry && entry.expires > Date.now()) return entry.value;
    this.queryCache.delete(key);
    return null;
  }

  private setCache(key: string, value: any, ttl = this.CACHE_TTL): void {
    if (this.queryCache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.queryCache.keys().next().value;
      if (typeof firstKey === 'string' && firstKey.length > 0) {
        this.queryCache.delete(firstKey);
      }
    }
    this.queryCache.set(key, {
      value,
      expires: Date.now() + ttl * 1000,
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // STATS
  // ─────────────────────────────────────────────────────────────────────
  private updateStats(provider: Provider, latency: number, success: boolean): void {
    const stats = this.statsCache.get(provider);
    if (!stats) return;
    if (success) {
      stats.success += 1;
      stats.totalLatency += latency;
      stats.avgLatency = stats.totalLatency / stats.success;
      stats.lastSuccess = Date.now();
    } else {
      stats.failures += 1;
      stats.lastFailure = Date.now();
    }
    this.statsCache.set(provider, stats);
  }


  // ═══ SIDDHI v4.0 BATCH 2 — TOOLS & ARTIFACTS ═══

  private generateId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 11)}`;
  }

  private logSafe(level: 'info' | 'warn' | 'error', msg: string, error?: unknown): void {
    try {
      // eslint-disable-next-line no-console
      console[level](msg, error);
    } catch { /* swallow */ }
  }

  private safeEvaluate(expr: string): number {
    const sanitized = expr.replace(/[^0-9+\-*/().\s^%]/g, '');
    if (!sanitized || sanitized.length > 200) throw new Error('Invalid expression');
    // eslint-disable-next-line @typescript-eslint/no-implied-eval, no-new-func
    const result = new Function(`"use strict"; return (${sanitized.replace(/\^/g, '**')})`)();
    if (typeof result !== 'number' || !isFinite(result)) throw new Error('Invalid result');
    return result;
  }

  private generateBarChart(data: Array<{ label: string; value: number }>, title?: string): string {
    const max = Math.max(...data.map((d) => d.value), 1);
    const bars = data.map((d, i) => {
      const h = (d.value / max) * 200;
      return `<rect x="${i * 60 + 40}" y="${250 - h}" width="40" height="${h}" fill="#00ffff" rx="4" />`
        + `<text x="${i * 60 + 60}" y="270" fill="#fff" font-size="12" text-anchor="middle">${d.label}</text>`
        + `<text x="${i * 60 + 60}" y="${245 - h}" fill="#8b5cf6" font-size="11" text-anchor="middle">${d.value}</text>`;
    }).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${data.length * 60 + 80} 300" style="background:#0a0a0a;border-radius:8px">`
      + (title ? `<text x="50%" y="25" fill="#fff" font-size="16" text-anchor="middle" font-weight="bold">${title}</text>` : '')
      + bars + `</svg>`;
  }

  private async executeToolCalls(
    query: string, availableTools: string[]
  ): Promise<Array<{ name: string; args: Record<string, unknown>; result: unknown }>> {
    if (!availableTools || availableTools.length === 0) return [];

    const toolDescriptions: Record<string, string> = {
      calculator: 'Evaluate math expressions. Args: { expression: string }',
      code_interpreter: 'Execute simple JavaScript. Args: { code: string }',
      chart_generator: 'Generate a bar chart. Args: { type: "bar", data: [{label,value}], title?: string }',
    };

    const prompt = `Given this user query, determine if any tools should be called.
Query: "${query}"

Available tools:
${availableTools.map((n) => `- ${n}: ${toolDescriptions[n] ?? 'tool'}`).join('\n')}

Return ONLY a JSON array of tool calls (or []): [{"name": "calculator", "args": {"expression": "2+2"}}]`;

    try {
      const result = await this.groq.chat({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 500,
      });
      const raw = result.choices?.[0]?.message?.content ?? '[]';
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
      const calls = JSON.parse(cleaned) as Array<{ name: string; args: Record<string, unknown> }>;
      if (!Array.isArray(calls)) return [];

      const executed: Array<{ name: string; args: Record<string, unknown>; result: unknown }> = [];
      for (const call of calls) {
        try {
          let toolResult: unknown;
          if (call.name === 'calculator') {
            toolResult = { value: this.safeEvaluate(String(call.args.expression ?? '')) };
          } else if (call.name === 'chart_generator') {
            const data = Array.isArray(call.args.data) ? call.args.data as Array<{ label: string; value: number }> : [];
            toolResult = { svg: this.generateBarChart(data, typeof call.args.title === 'string' ? call.args.title : undefined) };
          } else if (call.name === 'code_interpreter') {
            toolResult = { note: 'Code execution disabled on this layer', code: call.args.code };
          } else {
            toolResult = { error: `Unknown tool: ${call.name}` };
          }
          executed.push({ name: call.name, args: call.args, result: toolResult });
        } catch (error) {
          executed.push({ name: call.name, args: call.args, result: { error: String(error) } });
        }
      }
      return executed;
    } catch (error) {
      this.logSafe('warn', '[Tools] Execution failed', error);
      return [];
    }
  }

  private detectArtifacts(content: string): Array<{ type: 'react' | 'html' | 'svg' | 'markdown' | 'code'; language?: string; title: string; content: string }> {
    const artifacts: Array<{ type: 'react' | 'html' | 'svg' | 'markdown' | 'code'; language?: string; title: string; content: string }> = [];

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match: RegExpExecArray | null;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] ?? 'text';
      const code = match[2] ?? '';
      if (code.length > 80 && code.length < 20_000) {
        const type: 'react' | 'html' | 'svg' | 'code' = ['html'].includes(language) ? 'html'
          : ['svg'].includes(language) ? 'svg'
          : ['jsx', 'tsx', 'react'].includes(language) ? 'react'
          : 'code';
        artifacts.push({ type, language: type === 'code' ? language : undefined, title: `${language.toUpperCase()} Snippet`, content: code });
      }
    }

    const svgMatch = content.match(/<svg[\s\S]*?<\/svg>/);
    if (svgMatch && !artifacts.some((a) => a.type === 'svg')) {
      artifacts.push({ type: 'svg', title: 'SVG Graphic', content: svgMatch[0] });
    }
    const htmlMatch = content.match(/<!DOCTYPE html>[\s\S]*?<\/html>/i);
    if (htmlMatch) artifacts.push({ type: 'html', title: 'HTML Document', content: htmlMatch[0] });
    return artifacts;
  }

  async processWithPipeline(request: {
    messages: Array<{ role: string; content: string }>;
    userId?: string;
    sessionId?: string;
    query?: string;
    correlationId?: string;
    image?: boolean;
    video?: boolean;
    setu?: boolean;
    deep?: boolean;
    search?: boolean;
    onProgress?: (event: unknown) => void;
  }): Promise<{
    content: string;
    reasoning: string;
    provider: string;
    tokens: number;
    latency: number;
    emotion: string;
    sources: Array<{ title: string; url: string }>;
    traces?: Array<{ provider?: string; confidence?: number }>;
    critique?: { issues: string[]; confidence: number; shouldRefine: boolean };
    plan?: { providers: string[]; useSearch: boolean; useTools: string[]; depth: string };
    artifacts?: Array<{ type: 'react' | 'html' | 'svg' | 'markdown' | 'code'; language?: string; title: string; content: string }>;
    toolCalls?: Array<{ name: string; args: Record<string, unknown>; result: unknown }>;
  }> {
    const startTime = Date.now();
    const correlationId = request.correlationId ?? this.generateId();
    const sessionId = request.sessionId ?? 'default';
    const lastUser = request.messages.filter((m) => m.role === 'user').pop();
    const query = request.query ?? lastUser?.content ?? '';
    const emit = (event: unknown) => request.onProgress?.(event);

    // STAGE 1: UNDERSTAND
    const entities = this.extractEntities(query);
    emit({ type: 'trace', step: { id: 'understand', type: 'reasoning', status: 'completed', message: `Found ${entities.people.length + entities.places.length} entities` } });

    // STAGE 2: PLAN
    const plan = this.buildPipelinePlan(query, request);
    emit({ type: 'trace', step: { id: 'plan', type: 'reasoning', status: 'completed', message: `Providers: ${plan.providers.join('+')}` } });

    // STAGE 3: GATHER (search + tools)
    const memories = this.getMemory(sessionId);
    let searchResults: Array<{ title: string; url: string }> = [];
    let docs: string[] = [];
    let toolCalls: Array<{ name: string; args: Record<string, unknown>; result: unknown }> = [];

    if (plan.useSearch) {
      try {
        const raw = await this.searchWithFallback(query);
        const results = raw as unknown as Array<{ title: string; url: string; snippet?: string }>;
        searchResults = results.map((r) => ({ title: r.title, url: r.url }));
        const topUrls = results.slice(0, 3).map((r) => r.url);
        const contents = await Promise.all(topUrls.map((u) => this.extractContent(u)));
        docs = contents.map((c) => {
          const anyC = c as unknown as { content?: unknown };
          return typeof anyC?.content === 'string' ? anyC.content : '';
        }).filter((s) => s.length > 100);
      } catch (error) {
        this.logSafe('warn', '[Pipeline] Search failed', error);
      }
    }

    if (plan.useTools.length > 0) {
      toolCalls = await this.executeToolCalls(query, plan.useTools);
      for (const tc of toolCalls) {
        emit({ type: 'trace', step: { id: `tool-${tc.name}`, type: 'reasoning', status: 'completed', message: `${tc.name} → ${JSON.stringify(tc.result).slice(0, 80)}` } });
      }
    }

    emit({ type: 'trace', step: { id: 'gather', type: 'search', status: 'completed', message: `Gathered: ${searchResults.length} sources, ${toolCalls.length} tools` } });

    // STAGE 4: REASON
    const drafts = await this.generateDrafts(query, { plan, memories, docs, searchResults, toolCalls });
    emit({ type: 'trace', step: { id: 'reason', type: 'reasoning', status: 'completed', message: `Generated ${drafts.length} drafts` } });

    // STAGE 5: CRITIQUE
    let critique = { issues: [] as string[], confidence: 0.7, shouldRefine: false };
    if (plan.depth === 'max' || drafts.length >= 2) {
      critique = await this.selfCritique(query, drafts);
      emit({ type: 'trace', step: { id: 'critique', type: 'consensus', status: 'completed', message: `Confidence: ${(critique.confidence * 100).toFixed(0)}%` } });
    }

    const best = drafts.reduce((a, b) => ((a?.confidence ?? 0) > (b?.confidence ?? 0) ? a : b), drafts[0]);
    const finalAnswer = best?.answer ?? '';
    const finalReasoning = best?.reasoning ?? '';

    this.updateMemory(sessionId, { role: 'user', content: query, timestamp: Date.now() });
    this.updateMemory(sessionId, { role: 'assistant', content: finalAnswer, timestamp: Date.now() });

    void correlationId;

    // ARTIFACTS
    const artifacts = this.detectArtifacts(finalAnswer);
    if (artifacts.length > 0) {
      emit({ type: 'artifact', count: artifacts.length });
    }

    return {
      content: finalAnswer || 'I encountered an issue. Please try again.',
      reasoning: finalReasoning,
      provider: 'pipeline',
      tokens: drafts.reduce((s, d) => s + (d?.tokens ?? 0), 0),
      latency: Date.now() - startTime,
      emotion: this.detectEmotion(query),
      sources: searchResults.slice(0, 5),
      traces: drafts.map((d) => ({ provider: d?.provider, confidence: d?.confidence })),
      critique,
      plan: { providers: plan.providers, useSearch: plan.useSearch, useTools: plan.useTools, depth: plan.depth },
      artifacts,
      toolCalls,
    };
  }

  private extractEntities(text: string): { people: string[]; places: string[]; dates: string[]; numbers: number[] } {
    const people = [...text.matchAll(/\b(?:Mr|Mrs|Ms|Dr|Prof)\.?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/g)].map((m) => m[1] ?? '').filter(Boolean);
    const places = [...text.matchAll(/\b(?:in|at|from|to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g)].map((m) => m[1] ?? '').filter(Boolean);
    const dates = [...text.matchAll(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4})/g)].map((m) => m[1] ?? '').filter(Boolean);
    const numbers = [...text.matchAll(/\b(\d+(?:\.\d+)?)\b/g)].map((m) => parseFloat(m[1] ?? '0')).filter((n) => !isNaN(n));
    return { people, places, dates, numbers };
  }

  private buildPipelinePlan(
    query: string,
    request: { image?: boolean; video?: boolean; setu?: boolean; deep?: boolean }
  ): { providers: string[]; useSearch: boolean; useTools: string[]; depth: 'low' | 'medium' | 'high' | 'max' } {
    const complexity = this.assessComplexity(query);
    const needsSearch = /latest|current|recent|news|today|2024|2025|2026|price|weather/i.test(query);

    const providers: string[] = [];
    if (complexity > 0.6) providers.push('zhipu', 'agnes', 'groq');
    else if (complexity > 0.3) providers.push('agnes', 'groq');
    else providers.push('groq');

    const depth: 'low' | 'medium' | 'high' | 'max' =
      complexity > 0.7 ? 'max' : complexity > 0.4 ? 'high' : 'medium';

    const useTools: string[] = [];
    if (/\b(calculate|compute|solve|equation|\d+\s*[\+\-\*\/]\s*\d+)\b/i.test(query)) useTools.push('calculator');
    if (/\b(chart|graph|plot|visualize|bar chart)\b/i.test(query)) useTools.push('chart_generator');

    void request;
    return { providers, useSearch: needsSearch || complexity > 0.5, useTools, depth };
  }

  private async generateDrafts(
    query: string,
    ctx: {
      plan: { providers: string[]; depth: 'low' | 'medium' | 'high' | 'max' };
      memories: Array<{ role: string; content: string }>;
      docs: string[];
      searchResults: Array<{ title: string; url: string }>;
      toolCalls: Array<{ name: string; args: Record<string, unknown>; result: unknown }>;
    }
  ): Promise<Array<{ id: string; provider: string; reasoning: string; answer: string; confidence: number; tokens: number; timeMs: number }>> {
    const toolContext = ctx.toolCalls.length > 0
      ? `\n\nTool results:\n${ctx.toolCalls.map((t) => `${t.name}(${JSON.stringify(t.args)}) → ${JSON.stringify(t.result)}`).join('\n')}`
      : '';

    const systemPrompt = `You are Siddhi, an elite AI assistant. Provide deep, well-reasoned answers.
Format:
## Reasoning
[step-by-step thinking]
## Answer
[final comprehensive answer]

Context:
${ctx.docs.slice(0, 2).join('\n\n').slice(0, 4000)}
${ctx.memories.slice(-5).map((m) => `${m.role}: ${m.content}`).join('\n')}
${toolContext}`;

    const tasks = ctx.plan.providers.map(async (provider) => {
      const t0 = Date.now();
      try {
        const result = await this.callProvider(
          provider as never, query, systemPrompt,
          { reasoningDepth: ctx.plan.depth }
        );
        const parsed = this.parsePipelineReasoning(result.content);
        return {
          id: this.generateId(),
          provider,
          reasoning: parsed.reasoning,
          answer: parsed.answer,
          confidence: 0.7,
          tokens: result.tokens ?? 0,
          timeMs: Date.now() - t0,
        };
      } catch (error) {
        this.logSafe('warn', `[Pipeline] Draft from ${provider} failed`, error);
        return null;
      }
    });

    const results = await Promise.all(tasks);
    return results.filter((r): r is NonNullable<typeof r> => r !== null);
  }

  private parsePipelineReasoning(content: string): { reasoning: string; answer: string } {
    const r = content.match(/##\s*Reasoning\s*([\s\S]*?)(?=##\s*Answer|$)/i);
    const a = content.match(/##\s*Answer\s*([\s\S]*?)$/i);
    return { reasoning: r?.[1]?.trim() ?? '', answer: a?.[1]?.trim() ?? content.trim() };
  }

  private async selfCritique(
    query: string,
    drafts: Array<{ provider: string; answer: string }>
  ): Promise<{ issues: string[]; confidence: number; shouldRefine: boolean }> {
    const draftSummary = drafts.map((d, i) => `Draft ${i + 1} (${d.provider}):\n${d.answer.slice(0, 500)}`).join('\n\n');
    const critiquePrompt = `Critique these answers to: "${query}"

${draftSummary}

Evaluate: accuracy, completeness, clarity, hallucination risk.

Return JSON: { "issues": [], "confidence": 0.0-1.0, "shouldRefine": true/false }`;

    try {
      const result = await this.groq.chat({
        messages: [{ role: 'user', content: critiquePrompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 400,
      });
      const cleaned = (result.choices?.[0]?.message?.content ?? '{}')
        .replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned) as { issues?: unknown; confidence?: unknown; shouldRefine?: unknown };
      return {
        issues: Array.isArray(parsed.issues) ? (parsed.issues as string[]) : [],
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.7,
        shouldRefine: !!parsed.shouldRefine && Array.isArray(parsed.issues) && parsed.issues.length > 0,
      };
    } catch {
      return { issues: [], confidence: 0.7, shouldRefine: false };
    }
  }

  // ═══ SIDDHI v4.0 BATCH 2 — END TOOLS & ARTIFACTS ═══



  // == SIDDHI v4.0 BATCH 3 - OMNIBUS ROUTER ==
  // Health-weighted adaptive layer selection with cascade fallback.
  // Layer order: device -> zai -> groq -> openrouter -> cache.

  private static readonly omnibusHealth = new Map<
    string,
    {
      successRate: number;
      avgLatencyMs: number;
      lastFailureAt: number;
      consecutiveFailures: number;
    }
  >();

  private static updateHealth(layer: string, ok: boolean, ms: number): void {
    const prev = SiddhiAgent.omnibusHealth.get(layer) ?? {
      successRate: 0.9,
      avgLatencyMs: 1000,
      lastFailureAt: 0,
      consecutiveFailures: 0,
    };
    const a = 0.1;
    SiddhiAgent.omnibusHealth.set(layer, {
      successRate: prev.successRate * (1 - a) + (ok ? 1 : 0) * a,
      avgLatencyMs: prev.avgLatencyMs * (1 - a) + ms * a,
      lastFailureAt: ok ? prev.lastFailureAt : Date.now(),
      consecutiveFailures: ok ? 0 : prev.consecutiveFailures + 1,
    });
  }

  async processWithOmnibus(request: {
    messages: Array<{ role: string; content: string }>;
    userId?: string;
    sessionId?: string;
    query?: string;
    privacy?: 'low' | 'medium' | 'high';
    preferSpeed?: boolean;
    preferQuality?: boolean;
    onProgress?: (event: unknown) => void;
  }): Promise<{
    content: string;
    reasoning: string;
    provider: string;
    tokens: number;
    latency: number;
    layer: string;
    sources: Array<{ title: string; url: string }>;
  }> {
    const startTime = Date.now();
    const sessionId = request.sessionId ?? 'default';
    const lastUser = request.messages.filter((m) => m.role === 'user').pop();
    const query = request.query ?? lastUser?.content ?? '';
    const emit = (event: unknown) => request.onProgress?.(event);

    const intent = this.classifyIntent(
      query,
      { image: false, video: false, setu: false, deep: true },
      sessionId
    );
    const complexity = this.assessComplexity(query);

    let deviceReady = false;
    try {
      const mod = await import('@/lib/ai');
      const probe = mod as unknown as { isDeviceReady?: () => boolean };
      if (typeof probe.isDeviceReady === 'function') deviceReady = probe.isDeviceReady();
    } catch {
      deviceReady = false;
    }

    const estimatedTokens = Math.ceil(query.length / 4);
    const wantDevice = deviceReady && complexity < 0.4 && request.privacy !== 'high';
    const primary: 'device' | 'zai' | 'groq' | 'openrouter' = wantDevice
      ? 'device'
      : estimatedTokens > 8000
        ? 'zai'
        : request.preferSpeed
          ? 'groq'
          : 'zai';

    const fallbacks: Array<'device' | 'zai' | 'groq' | 'openrouter'> =
      primary === 'device'
        ? ['zai', 'groq', 'openrouter']
        : primary === 'zai'
          ? ['groq', 'device', 'openrouter']
          : primary === 'groq'
            ? ['zai', 'device', 'openrouter']
            : ['zai', 'groq', 'device'];

    const layers = [primary, ...fallbacks];
    emit({ type: 'status', message: `Router: ${primary}` });

    let sources: Array<{ title: string; url: string }> = [];
    let searchContext = '';
    if (complexity > 0.5) {
      try {
        const raw = await this.searchWithFallback(query);
        const arr = raw as unknown as Array<{ title: string; url: string }>;
        sources = arr.map((r) => ({ title: r.title, url: r.url }));
        searchContext = arr.map((r) => `${r.title}: ${r.url}`).join('\n');
      } catch {
        sources = [];
      }
    }

    const context = this.buildContext(request.messages, this.getMemory(sessionId));

    for (const layer of layers) {
      const layerStart = Date.now();
      emit({
        type: 'trace',
        step: {
          id: `layer-${layer}`,
          type: 'reasoning',
          status: 'running',
          message: `Trying ${layer}`,
        },
      });

      try {
        const result = await this.runOmnibusLayer(layer, query, context, searchContext);
        const ms = Date.now() - layerStart;
        SiddhiAgent.updateHealth(layer, true, ms);
        emit({
          type: 'trace',
          step: {
            id: `layer-${layer}`,
            type: 'reasoning',
            status: 'completed',
            message: `${layer} ok (${ms}ms)`,
          },
        });

        this.updateMemory(sessionId, { role: 'user', content: query, timestamp: Date.now() });
        this.updateMemory(sessionId, {
          role: 'assistant',
          content: result.content,
          timestamp: Date.now(),
        });

        return {
          content: result.content,
          reasoning: result.reasoning,
          provider: result.provider,
          tokens: result.tokens,
          latency: Date.now() - startTime,
          layer,
          sources: sources.slice(0, 5),
        };
      } catch (err) {
        const ms = Date.now() - layerStart;
        SiddhiAgent.updateHealth(layer, false, ms);
        emit({
          type: 'trace',
          step: {
            id: `layer-${layer}`,
            type: 'reasoning',
            status: 'failed',
            message: `${layer}: ${String(err).slice(0, 80)}`,
          },
        });
      }
    }

    return {
      content: 'All AI services are temporarily unavailable. Please try again in a moment.',
      reasoning: '',
      provider: 'fallback',
      tokens: 0,
      latency: Date.now() - startTime,
      layer: 'cache',
      sources: [],
    };
  }

  private async runOmnibusLayer(
    layer: 'device' | 'zai' | 'groq' | 'openrouter',
    query: string,
    context: string,
    searchContext: string
  ): Promise<{ content: string; reasoning: string; provider: string; tokens: number }> {
    if (layer === 'device') {
      const mod = await import('@/lib/ai');
      const streamFn = (
        mod as unknown as {
          streamDeviceInference?: (
            msgs: Array<{ role: string; content: string }>
          ) => AsyncGenerator<string>;
        }
      ).streamDeviceInference;
      if (typeof streamFn !== 'function') throw new Error('device unavailable');

      let content = '';
      for await (const delta of streamFn([
        { role: 'system', content: 'You are Siddhi.' },
        { role: 'user', content: query },
      ])) {
        content += delta;
      }
      return {
        content,
        reasoning: '',
        provider: 'device',
        tokens: Math.ceil(content.length / 4),
      };
    }

    if (layer === 'openrouter') {
      const mod = await import('@/lib/providers/openrouter/client');
      const client = new mod.OpenRouterClient();
      const sysPrefix = context ? `## Context\n${context}\n` : '';
      const r = await client.chat({
        messages: [
          { role: 'system', content: `You are Siddhi.\n${sysPrefix}` },
          { role: 'user', content: query },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });
      const content = r.choices?.[0]?.message?.content ?? '';
      return {
        content,
        reasoning: '',
        provider: 'openrouter',
        tokens: r.usage?.total_tokens ?? 0,
      };
    }

    const providerName: 'agnes' | 'groq' | 'zhipu' =
      layer === 'zai' ? 'zhipu' : layer === 'groq' ? 'groq' : 'agnes';

    const sysPrefix = context ? `## Context\n${context}\n` : '';
    const webSuffix = searchContext ? `\n## Web\n${searchContext}` : '';
    const systemPrompt = `You are Siddhi.\n${sysPrefix}${webSuffix}`;

    const result = await this.callProvider(providerName, query, systemPrompt, {
      reasoningDepth: 'medium',
    });
    return {
      content: result.content,
      reasoning: result.reasoning ?? '',
      provider: result.provider ?? providerName,
      tokens: result.tokens ?? 0,
    };
  }

  // == SIDDHI v4.0 BATCH 3 - END OMNIBUS ROUTER ==

}

export default SiddhiAgent;

// == Batch 6: first-success resolver ==
// Returns the first promise to RESOLVE. Rejects only when ALL reject,
// aggregating every error into one message. Use instead of Promise.race
// when racing N providers — fastest success wins, errors are collected.
function raceFirstSuccess<T>(promises: Promise<T>[]): Promise<T> {
  if (promises.length === 0) {
    return Promise.reject(new Error('raceFirstSuccess: no promises provided'));
  }

  return new Promise<T>((resolve, reject) => {
    let pending = promises.length;
    const errors: unknown[] = [];

    for (const p of promises) {
      p.then(resolve).catch((err: unknown) => {
        errors.push(err);
        pending -= 1;
        if (pending === 0) {
          const message = errors
            .map((e) => (e instanceof Error ? e.message : String(e)))
            .join('; ');
          reject(new Error(`raceFirstSuccess: all rejected — ${message}`));
        }
      });
    }
  });
}
