// ═══ SIDDHI v4.0 BATCH 2 v3.4 ═══
// FIXED: client.chat(body as never) — union of 3 provider clients.
// ─────────────────────────────────────────────────────────────────────────────

import { AgnesClient, GroqClient, ZhipuClient } from '@/lib/providers';
import { deepThinkCache } from '@/lib/ai/enhanced/cache';
import { searchWithContext } from '@/lib/search/orchestrator';
import { logger } from '@/lib/utils/logger';
import { generateUUID } from '@/lib/ai/enhanced/types';
import type { ConsensusResult, ReasoningPath } from '@/lib/ai/enhanced/types';

export type { ConsensusResult, ReasoningPath };

const GROQ_MODEL = 'llama-3.3-70b-versatile';

interface NormalizedChatResponse {
  choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
  usage?: { total_tokens?: number };
}

const REASONING_VARIANTS = [
  { name: 'direct',      system: 'Answer directly and concisely.' },
  { name: 'analytical',  system: 'Break down the problem step by step. Analyze each component.' },
  { name: 'creative',    system: 'Consider unconventional angles and edge cases.' },
  { name: 'critical',    system: 'Challenge assumptions. What could be wrong with common answers?' },
  { name: 'practical',   system: 'Focus on actionable, practical advice.' },
  { name: 'theoretical', system: 'Explain the underlying principles and theory.' },
  { name: 'synthesis',   system: 'Synthesize multiple perspectives into a coherent whole.' },
] as const;

const PROVIDERS = ['agnes', 'groq', 'zhipu'] as const;
type ProviderName = typeof PROVIDERS[number];

export class EnhancedDeepThink {
  private agnesClient = new AgnesClient();
  private groqClient = new GroqClient();
  private zhipuClient = new ZhipuClient();

  cacheGet(query: string): ConsensusResult | null {
    return deepThinkCache.get(this.getCacheKey(query)) ?? null;
  }
  cacheSet(query: string, result: ConsensusResult): void {
    deepThinkCache.set(this.getCacheKey(query), result);
  }
  private getCacheKey(query: string): string { return `deepthink:${this.hashString(query)}`; }
  private hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash &= hash;
    }
    return Math.abs(hash).toString(36);
  }

  async reason(
    query: string,
    options: {
      num_paths?: number;
      consensus_threshold?: number;
      stream?: boolean;
      useWeb?: boolean;
      onTrace?: (step: unknown) => void;
    } = {}
  ): Promise<ConsensusResult> {
    const { num_paths = 7, consensus_threshold = 0.6, stream = false, useWeb = true, onTrace } = options;

    if (!stream) {
      const cached = this.cacheGet(query);
      if (cached) return cached;
    }

    let webContext = '';
    if (useWeb) {
      onTrace?.({ type: 'search', status: 'running', message: 'Searching web...' });
      try {
        const { results, summary } = await searchWithContext(query, { limit: 5, timeout: 8000 });
        if (results.length > 0) {
          webContext = `\n\n## Web Context\n${summary}`;
          onTrace?.({ type: 'search', status: 'completed', message: `Found ${results.length} sources` });
        } else {
          onTrace?.({ type: 'search', status: 'completed', message: 'No web results' });
        }
      } catch (error) {
        logger.warn('[DeepThink] Web search failed', error);
        onTrace?.({ type: 'search', status: 'failed', message: 'Web search failed' });
      }
    }

    onTrace?.({ type: 'reasoning', status: 'running', message: `Generating ${num_paths} paths...` });
    const paths = await this.generatePaths(query, num_paths, webContext, onTrace);
    if (paths.length === 0) return this.fallbackResponse();

    onTrace?.({ type: 'scoring', status: 'running', message: 'Scoring paths...' });
    const scored = await this.scorePaths(paths, query);

    onTrace?.({ type: 'consensus', status: 'running', message: 'Computing consensus...' });
    const consensus = this.computeConsensus(scored, consensus_threshold);

    let final: ConsensusResult;
    if (consensus.score < consensus_threshold && scored.length >= 2) {
      final = await this.refineReasoning(query, scored);
    } else {
      const best = scored.reduce((a, b) => (a.confidence > b.confidence ? a : b));
      final = {
        final_answer: best.answer,
        reasoning: best.reasoning,
        paths: scored,
        consensus_score: consensus.score,
        tokens: scored.reduce((s, p) => s + p.tokens, 0),
        provider: best.provider,
      };
    }

    if (!stream) this.cacheSet(query, final);
    return final;
  }

  private async generatePaths(
    query: string, numPaths: number, webContext: string,
    onTrace?: (step: unknown) => void
  ): Promise<ReasoningPath[]> {
    const tasks: Promise<ReasoningPath | null>[] = [];
    for (let i = 0; i < Math.min(numPaths, REASONING_VARIANTS.length); i++) {
      const variant = REASONING_VARIANTS[i]!;
      const provider = PROVIDERS[i % PROVIDERS.length]!;
      tasks.push(this.generateSinglePath(query, provider, variant, webContext, onTrace));
    }
    const results = await Promise.all(tasks);
    return results.filter((r): r is ReasoningPath => r !== null);
  }

  private async generateSinglePath(
    query: string, provider: ProviderName,
    variant: { name: string; system: string },
    webContext: string, onTrace?: (step: unknown) => void
  ): Promise<ReasoningPath | null> {
    const start = Date.now();
    const systemPrompt = `${variant.system}

You are Siddhi (${variant.name} mode). Format:
## Reasoning
[your reasoning]
## Answer
[your answer]
${webContext}`;

    try {
      const client = provider === 'agnes' ? this.agnesClient : provider === 'groq' ? this.groqClient : this.zhipuClient;

      const body: Record<string, unknown> = {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        model: provider === 'agnes' ? 'agnes-2.5-flash'
             : provider === 'groq'  ? GROQ_MODEL
             : 'glm-4.7-flash',
        temperature: variant.name === 'creative' ? 0.7 : 0.3,
        max_tokens: 3072,
      };
      if (provider === 'zhipu') body.thinking = { type: 'enabled' };

      // FIXED: cast body to never — union of 3 provider clients
      const response = await (client.chat as (b: unknown) => Promise<NormalizedChatResponse>)(body);

      const content = response?.choices?.[0]?.message?.content ?? '';
      const parsed = this.parseReasoning(content);

      onTrace?.({ id: `${provider}-${variant.name}`, type: 'reasoning', status: 'completed', message: `${provider}/${variant.name}: ${content.length} chars` });

      return {
        id: generateUUID(),
        provider: `${provider}-${variant.name}`,
        reasoning: parsed.reasoning || content,
        summary: (parsed.answer || content).slice(0, 200),
        answer: parsed.answer || content,
        confidence: 0,
        tokens: response?.usage?.total_tokens ?? 0,
        timeMs: Date.now() - start,
      };
    } catch (error) {
      onTrace?.({ id: `${provider}-${variant.name}`, type: 'reasoning', status: 'failed', message: `${provider}/${variant.name} failed` });
      logger.warn(`[DeepThink] ${provider}/${variant.name} failed`, error);
      return null;
    }
  }

  private parseReasoning(content: string): { reasoning: string; answer: string } {
    const r = content.match(/##\s*Reasoning\s*([\s\S]*?)(?=##\s*Answer|$)/i);
    const a = content.match(/##\s*Answer\s*([\s\S]*?)$/i);
    return { reasoning: r?.[1]?.trim() ?? '', answer: a?.[1]?.trim() ?? content.trim() };
  }

  private async scorePaths(paths: ReasoningPath[], query: string): Promise<ReasoningPath[]> {
    const judgePrompt = `Score each reasoning path for relevance, coherence, completeness (0-1 each).

Query: "${query}"

Paths:
${paths.map((p, i) => `Path ${i + 1} (${p.provider}):\n${p.reasoning.slice(0, 300)}...`).join('\n\n')}

Return JSON: { "0": {"relevance":0.8,"coherence":0.7,"completeness":0.9}, ... }`;

    try {
      const response = await this.groqClient.chat({
        messages: [{ role: 'user', content: judgePrompt }],
        model: GROQ_MODEL, temperature: 0.1, max_tokens: 500,
      });
      const cleaned = (response?.choices?.[0]?.message?.content ?? '{}')
        .replace(/```json/g, '').replace(/```/g, '').trim();
      const scores = JSON.parse(cleaned) as Record<string, { relevance: number; coherence: number; completeness: number }>;
      return paths.map((p, i) => {
        const s = scores[String(i)] ?? { relevance: 0.5, coherence: 0.5, completeness: 0.5 };
        p.confidence = (s.relevance + s.coherence + s.completeness) / 3;
        return p;
      });
    } catch (error) {
      logger.warn('[DeepThink] Score parsing failed, using heuristic', error);
      return paths.map((p) => {
        const providerWeight = p.provider.startsWith('agnes') ? 0.9 : p.provider.startsWith('groq') ? 0.85 : 0.8;
        const lengthWeight = Math.min(1, p.reasoning.length / 300);
        p.confidence = (providerWeight + lengthWeight) / 2;
        return p;
      });
    }
  }

  private computeConsensus(paths: ReasoningPath[], threshold: number): {
    score: number; best_answer: string; best_reasoning: string;
  } {
    const best = paths.reduce((a, b) => (a.confidence > b.confidence ? a : b));
    let total = 0, pairs = 0;
    for (let i = 0; i < paths.length; i++) {
      for (let j = i + 1; j < paths.length; j++) {
        total += this.semanticSimilarity(paths[i]!.answer, paths[j]!.answer);
        pairs++;
      }
    }
    const score = pairs > 0 ? total / pairs : 0;
    void threshold;
    return { score, best_answer: best.answer, best_reasoning: best.reasoning };
  }

  private semanticSimilarity(a: string, b: string): number {
    const words = (s: string) => s.toLowerCase().split(/\W+/).filter(Boolean);
    const bigrams = (s: string) => {
      const w = words(s);
      const bg = new Set<string>();
      for (let i = 0; i < w.length - 1; i++) bg.add(`${w[i]} ${w[i + 1]}`);
      return bg;
    };
    const wA = new Set(words(a)), wB = new Set(words(b));
    const jaccard = wA.size + wB.size === 0 ? 0
      : new Set([...wA].filter((x) => wB.has(x))).size / new Set([...wA, ...wB]).size;
    const bgA = bigrams(a), bgB = bigrams(b);
    const bgJaccard = bgA.size + bgB.size === 0 ? 0
      : new Set([...bgA].filter((x) => bgB.has(x))).size / new Set([...bgA, ...bgB]).size;
    return jaccard * 0.4 + bgJaccard * 0.6;
  }

  private async refineReasoning(query: string, paths: ReasoningPath[]): Promise<ConsensusResult> {
    const best = paths.reduce((a, b) => (a.confidence > b.confidence ? a : b));
    const refinePrompt = `Refine and improve this reasoning based on alternative perspectives.

Original (${best.provider}):
${best.reasoning}

Answer:
${best.answer}

Alternatives:
${paths.filter((p) => p.id !== best.id).map((p) => `- ${p.provider}: ${p.answer.slice(0, 200)}`).join('\n')}

Provide refined reasoning and answer using: ## Reasoning and ## Answer.`;

    try {
      const response = await this.groqClient.chat({
        messages: [{ role: 'user', content: refinePrompt }],
        model: GROQ_MODEL, temperature: 0.3, max_tokens: 2000,
      });
      const content = response?.choices?.[0]?.message?.content ?? '';
      const parsed = this.parseReasoning(content);
      void query;
      return {
        final_answer: parsed.answer || content,
        reasoning: parsed.reasoning || content,
        paths, consensus_score: 0.8,
        tokens: response?.usage?.total_tokens ?? 0,
        provider: 'refined',
      };
    } catch (error) {
      logger.warn('[DeepThink] Refinement failed', error);
      return {
        final_answer: best.answer, reasoning: best.reasoning,
        paths, consensus_score: 0.7, tokens: best.tokens, provider: best.provider,
      };
    }
  }

  private fallbackResponse(): ConsensusResult {
    return {
      final_answer: "I'm having trouble reasoning about this. Please rephrase your question.",
      reasoning: 'All reasoning paths failed.',
      paths: [], consensus_score: 0, tokens: 0, provider: 'fallback',
    };
  }
}
