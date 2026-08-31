// lib/ai/reasoning/enhanced-deep-think.ts
import { ReasoningPath, ConsensusResult, generateUUID } from '../enhanced/types';
import { agnesClient, groqClient, zhipuClient } from '@/lib/providers';
import { deepThinkCache } from '../enhanced/cache';

export class EnhancedDeepThink {
  async reason(
    query: string,
    options: {
      num_paths?: number;
      consensus_threshold?: number;
      stream?: boolean;
      onReasoning?: (path: ReasoningPath) => void;
    } = {}
  ): Promise<ConsensusResult> {
    const { num_paths = 3, consensus_threshold = 0.6, stream = false, onReasoning } = options;

    if (!stream) {
      const cacheKey = this.getCacheKey(query);
      const cached = deepThinkCache.get(cacheKey);
      if (cached) return cached;
    }

    const paths = await this.generatePaths(query, num_paths, onReasoning);

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
    onReasoning?: (path: ReasoningPath) => void
  ): Promise<ReasoningPath[]> {
    const providers = [
      { client: agnesClient, model: 'agnes-2.0-flash', temp: 0.3, name: 'agnes' },
      { client: groqClient, model: 'llama-3.3-70b-versatile', temp: 0.5, name: 'groq' },
      { client: zhipuClient, model: 'glm-4.7-flash', temp: 0.7, name: 'zhipu' },
    ].slice(0, numPaths);

    const systemPrompt = `You are Siddhi in DeepThink mode. Provide step-by-step reasoning for the user's query.
Break down the problem, explore alternatives, and conclude with a final answer.
Format:
## Reasoning
[Your step-by-step thinking]
## Answer
[Your final answer]`;

    const tasks = providers.map(async (p) => {
      const start = Date.now();
      try {
        const body: Record<string, unknown> = {
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query },
          ],
          model: p.model,
          temperature: p.temp,
          max_tokens: 4096,
        };

        if (p.name === 'zhipu') {
          body.thinking = { type: 'enabled' };
        }

        const response = await p.client.chat(body);
        const content = response.choices?.[0]?.message?.content || '';
        const reasoning = response.choices?.[0]?.message?.reasoning_content || '';

        const parsed = this.parseReasoning(content);

        const path: ReasoningPath = {
          id: generateUUID(),
          provider: p.name,
          reasoning: parsed.reasoning || reasoning || content,
          answer: parsed.answer || content,
          confidence: 0,
          tokens: response.usage?.total_tokens || 0,
          timeMs: Date.now() - start,
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

  private parseReasoning(content: string): { reasoning: string; answer: string } {
    const reasoningMatch = content.match(/## Reasoning\s*([\s\S]*?)(?=## Answer|$)/i);
    const answerMatch = content.match(/## Answer\s*([\s\S]*?)$/i);
    return {
      reasoning: reasoningMatch?.[1]?.trim() || '',
      answer: answerMatch?.[1]?.trim() || content,
    };
  }

  private async scorePaths(paths: ReasoningPath[], query: string): Promise<ReasoningPath[]> {
    const judgePrompt = `You are a judge. Score each reasoning path for:
1. Relevance to the query (0-1)
2. Logical coherence (0-1)  
3. Completeness (0-1)

Query: "${query}"

Paths:
${paths.map((p, i) => `Path ${i+1} (${p.provider}):\n${p.reasoning.slice(0, 300)}...`).join('\n\n')}

Return JSON with scores: { "0": { "relevance": 0.8, "coherence": 0.7, "completeness": 0.9 }, ... }`;

    try {
      const response = await groqClient.chat({
        messages: [{ role: 'user', content: judgePrompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.1,
        max_tokens: 500,
      });

      const content = response.choices?.[0]?.message?.content || '{}';
      const cleanContent = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const scores = JSON.parse(cleanContent);

      return paths.map((p, i) => {
        const score = scores[String(i)] || { relevance: 0.5, coherence: 0.5, completeness: 0.5 };
        p.confidence = (score.relevance + score.coherence + score.completeness) / 3;
        return p;
      });
    } catch (error) {
      console.warn('[DeepThink] Score parsing failed, using heuristic:', error);
      return paths.map(p => {
        const providerWeight = { agnes: 0.9, groq: 0.85, zhipu: 0.8 }[p.provider] || 0.7;
        const lengthWeight = Math.min(1, p.reasoning.length / 300);
        p.confidence = (providerWeight + lengthWeight) / 2;
        return p;
      });
    }
  }

  private computeConsensus(paths: ReasoningPath[], threshold: number): {
    score: number;
    best_answer: string;
    best_reasoning: string;
  } {
    const best = paths.reduce((a, b) => a.confidence > b.confidence ? a : b);

    let agreement = 0;
    const total = paths.length;
    for (let i = 0; i < total; i++) {
      for (let j = i + 1; j < total; j++) {
        const similarity = this.wordOverlap(paths[i].answer, paths[j].answer);
        if (similarity > 0.5) agreement++;
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
    const best = paths.reduce((a, b) => a.confidence > b.confidence ? a : b);

    const refinePrompt = `Refine and improve this reasoning and answer based on the alternative perspectives.

Original reasoning:
${best.reasoning}

Original answer:
${best.answer}

Alternative perspectives:
${paths.filter(p => p.id !== best.id).map(p => `- ${p.provider}: ${p.answer.slice(0, 200)}...`).join('\n')}

Provide a refined reasoning and final answer. Use the same format: ## Reasoning and ## Answer.`;

    try {
      const response = await groqClient.chat({
        messages: [{ role: 'user', content: refinePrompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.3,
        max_tokens: 2000,
      });

      const content = response.choices?.[0]?.message?.content || '';
      const parsed = this.parseReasoning(content);

      return {
        final_answer: parsed.answer || content,
        reasoning: parsed.reasoning || content,
        paths,
        consensus_score: 0.8,
        tokens: response.usage?.total_tokens || 0,
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
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}
