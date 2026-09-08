import { ReasoningPath, ConsensusResult, generateUUID } from '../ai/enhanced/types';
import { AgnesClient } from '@/lib/providers/agnes/client';
import { GroqClient } from '@/lib/providers/groq/client';
import { ZhipuClient } from '@/lib/providers/zhipu/client';
import { deepThinkCache } from '../ai/enhanced/cache';

export class EnhancedDeepThink {
  private agnes = new AgnesClient();
  private groq = new GroqClient();
  private zhipu = new ZhipuClient();

  private systemPrompt = `You are Siddhi, an expert reasoning AI. Provide a detailed, step‑by‑step chain‑of‑thought.

Follow this structure:
## Problem Restatement
## Assumptions
## Analysis
## Alternatives Considered
## Conclusion
Make your reasoning transparent. End with the final answer clearly marked.`;

  async reason(
    query: string,
    options: {
      num_paths?: number;
      consensus_threshold?: number;
      stream?: boolean;
      onReasoning?: (path: ReasoningPath) => void;
      useWeb?: boolean;
    } = {}
  ): Promise<ConsensusResult> {
    const { num_paths = 3, consensus_threshold = 0.6, stream = false, onReasoning, useWeb = true } = options;

    if (!stream) {
      const cached = deepThinkCache.get(this.getCacheKey(query));
      if (cached) return cached;
    }

    let webContext = '';
    if (useWeb) {
      try {
        const searchResults = await this.zhipu.webSearch({
          search_query: query,
          count: 5,
          search_engine: 'search_pro',
        });
        const snippets = (searchResults.search_result || [])
          .slice(0, 3)
          .map((r: any) => `- ${r.title}: ${r.content?.slice(0, 200)}...`)
          .join('\n');
        if (snippets) {
          webContext = `\n\n## Web Context\n${snippets}`;
        }
      } catch (e) {
        console.warn('[DeepThink] Web grounding failed:', e);
      }
    }

    const paths = await this.generatePaths(query, num_paths, webContext, onReasoning);
    if (paths.length === 0) {
      return this.fallbackResponse(query);
    }

    const scoredPaths = await this.scorePaths(paths, query);
    const consensus = this.computeConsensus(scoredPaths, consensus_threshold);

    let finalResult: ConsensusResult;
    if (consensus.score < consensus_threshold && scoredPaths.length >= 2) {
      finalResult = await this.refineReasoning(query, scoredPaths);
    } else {
      const best = scoredPaths.reduce((a, b) => a.confidence > b.confidence ? a : b);
      finalResult = {
        final_answer: best.answer,
        reasoning: best.reasoning,
        paths: scoredPaths,
        consensus_score: consensus.score,
        tokens: scoredPaths.reduce((sum, p) => sum + p.tokens, 0),
        provider: best.provider,
      };
    }

    if (!stream) {
      deepThinkCache.set(this.getCacheKey(query), finalResult);
    }

    return finalResult;
  }

  private async generatePaths(
    query: string,
    numPaths: number,
    webContext: string,
    onReasoning?: (path: ReasoningPath) => void
  ): Promise<ReasoningPath[]> {
    const providers = [
      { client: this.agnes, model: 'agnes-2.0-flash', temp: 0.3, name: 'agnes', supportsThinking: true },
      { client: this.groq, model: 'llama-3.3-70b-versatile', temp: 0.5, name: 'groq', supportsThinking: false },
      { client: this.zhipu, model: 'glm-4.7', temp: 0.7, name: 'zhipu', supportsThinking: true },
    ].slice(0, numPaths);

    const fullSystem = this.systemPrompt + webContext;

    const tasks = providers.map(async (p) => {
      const start = Date.now();
      try {
        const baseRequest: any = {
          messages: [
            { role: 'system', content: fullSystem },
            { role: 'user', content: query },
          ],
          model: p.model,
          temperature: p.temp,
          max_tokens: 4096,
          stream: false,
        };
        if (p.supportsThinking) {
          baseRequest.thinking = { type: 'enabled' };
        }
        const response = await p.client.chat(baseRequest);
        const content = response.choices?.[0]?.message?.content || '';
        const reasoning = response.choices?.[0]?.message?.reasoning_content || '';

        const parsed = this.parseReasoning(content);
        const steps = this.extractSteps(parsed.reasoning || reasoning || content);

        const path: ReasoningPath = {
          id: generateUUID(),
          provider: p.name,
          reasoning: parsed.reasoning || reasoning || content,
          summary: parsed.summary || content.slice(0, 200) + '...',
          answer: parsed.answer || content,
          confidence: 0,
          tokens: response.usage?.total_tokens || 0,
          timeMs: Date.now() - start,
          steps,
          sources: [],
        };

        if (onReasoning) onReasoning(path);
        return path;
      } catch (error) {
        console.error(`[DeepThink] ${p.name} failed:`, error);
        return null;
      }
    });

    const results = await Promise.all(tasks);
    return results.filter((p): p is ReasoningPath => p !== null);
  }

  private parseReasoning(content: string): { reasoning: string; summary: string; answer: string } {
    const reasoningMatch = content.match(/## Reasoning\s*([\s\S]*?)(?=## Summary|## Conclusion|$)/i);
    const summaryMatch = content.match(/## Summary\s*([\s\S]*?)(?=## Conclusion|$)/i);
    const answerMatch = content.match(/## Answer|Conclusion\s*([\s\S]*?)$/i);
    return {
      reasoning: reasoningMatch?.[1]?.trim() || content,
      summary: summaryMatch?.[1]?.trim() || content.slice(0, 300),
      answer: answerMatch?.[1]?.trim() || content,
    };
  }

  private extractSteps(reasoning: string): string[] {
    const lines = reasoning.split('\n');
    const steps: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.match(/^(\d+\.|\*|-)\s/)) {
        steps.push(trimmed);
      }
    }
    if (steps.length === 0 && reasoning.length > 100) {
      return reasoning.split(/[.!?]+\s/).filter(s => s.length > 20);
    }
    return steps;
  }

  private async scorePaths(paths: ReasoningPath[], query: string): Promise<ReasoningPath[]> {
    const judgePrompt = `You are a judge. Score each reasoning path for:
1. Relevance to the query (0-1)
2. Logical coherence (0-1)  
3. Completeness (0-1)

Query: "${query}"

Paths:
${paths.map((p, i) => `Path ${i+1} (${p.provider}):\n${p.reasoning.slice(0, 400)}...`).join('\n\n')}

Return JSON with scores: { "0": { "relevance": 0.8, "coherence": 0.7, "completeness": 0.9 }, ... }`;

    try {
      const response = await this.groq.chat({
        messages: [{ role: 'user', content: judgePrompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 500,
        stream: false,
      });

      const content = response?.choices?.[0]?.message?.content || '{}';
      const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      let scores: Record<string, { relevance: number; coherence: number; completeness: number }> = {};
      try {
        const parsed = JSON.parse(cleanContent);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          scores = parsed;
        }
      } catch (_) {}

      return paths.map((p, i) => {
        const key = String(i);
        const s = scores[key];
        if (s && typeof s.relevance === 'number' && typeof s.coherence === 'number' && typeof s.completeness === 'number') {
          p.confidence = (s.relevance + s.coherence + s.completeness) / 3;
        } else {
          const providerWeight: Record<string, number> = { agnes: 0.9, groq: 0.85, zhipu: 0.8 };
          const weight = providerWeight[p.provider] || 0.7;
          const lengthWeight = Math.min(1, p.reasoning.length / 400);
          p.confidence = (weight + lengthWeight) / 2;
        }
        return p;
      });
    } catch (error) {
      console.warn('[DeepThink] Score parsing failed, using heuristic:', error);
      return paths.map((p) => {
        const providerWeight: Record<string, number> = { agnes: 0.9, groq: 0.85, zhipu: 0.8 };
        const weight = providerWeight[p.provider] || 0.7;
        const lengthWeight = Math.min(1, p.reasoning.length / 400);
        p.confidence = (weight + lengthWeight) / 2;
        return p;
      });
    }
  }

  private computeConsensus(paths: ReasoningPath[], threshold: number): {
    score: number;
    best_answer: string;
    best_reasoning: string;
  } {
    if (paths.length === 0) return { score: 0, best_answer: '', best_reasoning: '' };

    const validPaths = paths.filter((p): p is ReasoningPath => p !== null && p !== undefined);
    if (validPaths.length === 0) return { score: 0, best_answer: '', best_reasoning: '' };

    const best = validPaths.reduce((a, b) => a.confidence > b.confidence ? a : b);

    let agreement = 0;
    const total = validPaths.length;
    for (let i = 0; i < total; i++) {
      const pi = validPaths[i];
      if (!pi) continue;
      for (let j = i + 1; j < total; j++) {
        const pj = validPaths[j];
        if (!pj) continue;
        const sim = this.wordOverlap(pi.answer, pj.answer);
        if (sim > 0.5) agreement++;
      }
    }
    const maxAgreement = (total * (total - 1)) / 2;
    const score = maxAgreement > 0 ? agreement / maxAgreement : 0;

    return {
      score,
      best_answer: best.answer,
      best_reasoning: best.reasoning,
    };
  }

  private wordOverlap(a: string, b: string): number {
    const wordsA = new Set(a.toLowerCase().split(' '));
    const wordsB = new Set(b.toLowerCase().split(' '));
    const intersection = new Set([...wordsA].filter(x => wordsB.has(x)));
    const union = new Set([...wordsA, ...wordsB]);
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private async refineReasoning(query: string, paths: ReasoningPath[]): Promise<ConsensusResult> {
    const sorted = [...paths].sort((a, b) => b.confidence - a.confidence);
    const best = sorted[0];
    const second = sorted.length > 1 ? sorted[1] : null;

    if (!best) {
      return this.fallbackResponse(query);
    }

    const secondReasoning = second?.reasoning?.slice(0, 400) || 'No alternative perspective available.';
    const secondProvider = second?.provider || 'none';

    const refinePrompt = `Refine and improve this reasoning and answer by incorporating the best elements from the alternative perspective.

Original reasoning (${best.provider}):
${best.reasoning}

Original answer:
${best.answer}

Alternative perspective (${secondProvider}):
${secondReasoning}

Produce a refined reasoning and final answer. Use the same structured format.`;

    try {
      const response = await this.groq.chat({
        messages: [{ role: 'user', content: refinePrompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2000,
        stream: false,
      });
      const content = response?.choices?.[0]?.message?.content || '';
      const parsed = this.parseReasoning(content);

      return {
        final_answer: parsed.answer || content,
        reasoning: parsed.reasoning || content,
        paths,
        consensus_score: 0.8,
        tokens: response?.usage?.total_tokens || 0,
        provider: 'refined',
      };
    } catch {
      return {
        final_answer: best.answer,
        reasoning: best.reasoning,
        paths,
        consensus_score: 0.7,
        tokens: best.tokens,
        provider: best.provider,
      };
    }
  }

  private fallbackResponse(query: string): ConsensusResult {
    return {
      final_answer: "I'm having trouble reasoning about this. Please try rephrasing your question.",
      reasoning: "All reasoning paths failed.",
      paths: [],
      consensus_score: 0,
      tokens: 0,
      provider: 'fallback',
    };
  }

  private getCacheKey(query: string): string {
    const hash = this.hashString(query);
    return `deepthink:${hash}`;
  }

  private hashString(input: string): string {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      hash = ((hash << 5) - hash) + input.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
