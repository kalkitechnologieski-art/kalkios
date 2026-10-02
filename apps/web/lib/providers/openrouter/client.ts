// == KALKI B6 HARDENING ==
// OpenRouter client with concurrency, jitter, circuit breaker.
// -----------------------------------------------------------------------------

import { globalBreaker } from '@/lib/orchestration/circuit-breaker';
import { globalRateLimiter } from '@/lib/orchestration/rate-limiter';
import { CONCURRENCY } from '@/lib/orchestration/concurrency';
import { withRetry } from '@/lib/orchestration/retry';
import { logger } from '@/lib/utils/logger';
import type { Provider, ProviderRequest, ProviderResult } from '../index';

const OR_BASE = 'https://openrouter.ai/api/v1';
const OR_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OR_DEFAULT_MODEL = 'openrouter/free';

export interface OpenRouterChatBody {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  [key: string]: unknown;
}

export interface OpenRouterChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  model?: string;
}

export class OpenRouterClient implements Provider {
  name = 'openrouter';

  async isHealthy(): Promise<boolean> {
    if (!OR_API_KEY) return false;
    return globalBreaker.canAttempt('openrouter');
  }

  async chat(body: OpenRouterChatBody): Promise<OpenRouterChatResponse> {
    return CONCURRENCY.openrouter.run(async () => {
      const requestBody: OpenRouterChatBody = {
        ...body,
        model: body.model ?? OR_DEFAULT_MODEL,
        max_tokens: body.max_tokens ?? 4096,
      };
      const result = await withRetry(
        async (signal) => {
          const response = await fetch(`${OR_BASE}/chat/completions`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OR_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com',
              'X-Title': 'KALKI OS — Siddhi',
            },
            body: JSON.stringify(requestBody),
            signal,
          });
          globalRateLimiter.learn('openrouter', response.headers);
          if (!response.ok) {
            const text = await response.text().catch(() => '');
            const err = new Error(`OpenRouter HTTP ${response.status}: ${text.slice(0, 200)}`);
            (err as Error & { status?: number }).status = response.status;
            throw err;
          }
          return (await response.json()) as OpenRouterChatResponse;
        },
        { maxAttempts: 2, timeoutMs: 60_000, isRetryable: () => true }
      );
      globalBreaker.recordSuccess('openrouter');
      globalRateLimiter.record('openrouter');
      logger.info('[OpenRouter] Response', { requestedModel: requestBody.model, actualModel: result.model });
      return result;
    });
  }

  async chatStream(body: OpenRouterChatBody): Promise<ReadableStream<Uint8Array>> {
    if (!OR_API_KEY) throw new Error('OPENROUTER_API_KEY not set');
    return CONCURRENCY.openrouter.run(async () => {
      const response = await fetch(`${OR_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OR_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com',
        },
        body: JSON.stringify({ ...body, model: body.model ?? OR_DEFAULT_MODEL, stream: true }),
      });
      globalRateLimiter.learn('openrouter', response.headers);
      if (!response.ok) {
        globalBreaker.recordFailure('openrouter');
        throw new Error(`OpenRouter stream HTTP ${response.status}`);
      }
      globalBreaker.recordSuccess('openrouter');
      globalRateLimiter.record('openrouter');
      if (!response.body) throw new Error('No response body');
      return response.body;
    });
  }

  async invoke(req: ProviderRequest): Promise<ProviderResult> {
    const start = Date.now();
    const response = await this.chat({
      messages: req.messages,
      model: req.model,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens,
    });
    return {
      content: response.choices?.[0]?.message?.content ?? '',
      tokens: {
        input: response.usage?.prompt_tokens ?? 0,
        output: response.usage?.completion_tokens ?? 0,
        total: response.usage?.total_tokens ?? 0,
      },
      model: response.model ?? req.model ?? OR_DEFAULT_MODEL,
      provider: this.name,
      finishReason: 'stop',
      latencyMs: Date.now() - start,
      cached: false,
    };
  }

  async *invokeStream(req: ProviderRequest): AsyncGenerator<string> {
    const stream = await this.chatStream({
      messages: req.messages,
      model: req.model,
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens,
    });
    yield* this.parseSSE(stream);
  }

  private async *parseSSE(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') return;
          try {
            const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> };
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) yield delta;
          } catch { /* ignore */ }
        }
      }
    } finally {
      try { await reader.cancel(); } catch { /* ignore */ }
    }
  }
}

export const openRouterClient = new OpenRouterClient();
