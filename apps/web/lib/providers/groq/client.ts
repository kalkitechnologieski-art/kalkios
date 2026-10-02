// == KALKI B6 HARDENING ==
// Groq client with concurrency, jittered retry, circuit breaker.
// -----------------------------------------------------------------------------

import { globalBreaker } from '@/lib/orchestration/circuit-breaker';
import { globalRateLimiter } from '@/lib/orchestration/rate-limiter';
import { CONCURRENCY } from '@/lib/orchestration/concurrency';
import { withRetry } from '@/lib/orchestration/retry';
import type { Provider, ProviderRequest, ProviderResult } from '../index';

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';
const GROQ_MAX_TOKENS = 4096;

export interface GroqChatBody {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  [key: string]: unknown;
}

export interface GroqChatResponse {
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  model?: string;
}

export class GroqClient implements Provider {
  name = 'groq';

  async isHealthy(): Promise<boolean> {
    if (!GROQ_API_KEY) return false;
    return globalBreaker.canAttempt('groq');
  }

  async chat(body: GroqChatBody): Promise<GroqChatResponse> {
    return CONCURRENCY.groq.run(async () => {
      const requestBody: GroqChatBody = {
        ...body,
        model: body.model ?? 'llama-3.3-70b-versatile',
        max_tokens: Math.min(body.max_tokens ?? GROQ_MAX_TOKENS, GROQ_MAX_TOKENS),
      };
      const result = await withRetry(
        async (signal) => {
          const response = await fetch(`${GROQ_BASE}/chat/completions`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal,
          });
          globalRateLimiter.learn('groq', response.headers);
          if (!response.ok) {
            const text = await response.text().catch(() => '');
            const err = new Error(`Groq HTTP ${response.status}: ${text.slice(0, 200)}`);
            (err as Error & { status?: number }).status = response.status;
            throw err;
          }
          return (await response.json()) as GroqChatResponse;
        },
        {
          maxAttempts: 3,
          timeoutMs: 30_000,
          isRetryable: (e: unknown) => {
            const err = e as { status?: number; name?: string };
            if (err.status === 429) return true;
            if (typeof err.status === 'number' && err.status >= 500) return true;
            if (err.name === 'AbortError' || err.name === 'TypeError') return true;
            return false;
          },
        }
      );
      globalBreaker.recordSuccess('groq');
      globalRateLimiter.record('groq');
      return result;
    });
  }

  async chatStream(body: GroqChatBody): Promise<ReadableStream<Uint8Array>> {
    if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
    return CONCURRENCY.groq.run(async () => {
      const response = await fetch(`${GROQ_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...body,
          model: body.model ?? 'llama-3.3-70b-versatile',
          max_tokens: Math.min(body.max_tokens ?? GROQ_MAX_TOKENS, GROQ_MAX_TOKENS),
          stream: true,
        }),
      });
      globalRateLimiter.learn('groq', response.headers);
      if (!response.ok) {
        globalBreaker.recordFailure('groq');
        throw new Error(`Groq stream HTTP ${response.status}`);
      }
      globalBreaker.recordSuccess('groq');
      globalRateLimiter.record('groq');
      if (!response.body) throw new Error('No response body');
      return response.body;
    });
  }

  async invoke(req: ProviderRequest): Promise<ProviderResult> {
    const start = Date.now();
    const response = await this.chat({
      messages: req.messages,
      model: req.model ?? 'llama-3.3-70b-versatile',
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
      model: response.model ?? req.model ?? 'llama-3.3-70b-versatile',
      provider: this.name,
      finishReason: 'stop',
      latencyMs: Date.now() - start,
      cached: false,
    };
  }

  async *invokeStream(req: ProviderRequest): AsyncGenerator<string> {
    const stream = await this.chatStream({
      messages: req.messages,
      model: req.model ?? 'llama-3.3-70b-versatile',
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

export const groqClient = new GroqClient();
