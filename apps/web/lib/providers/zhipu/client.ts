// == KALKI B6 HARDENING ==
// Z.AI (Zhipu) hardened client: single-flight serialization for Zhipu's
// concurrency=1 limit, plus retries, jitter, and header-driven rate learning.
// -----------------------------------------------------------------------------

import { globalBreaker } from '@/lib/orchestration/circuit-breaker';
import { globalRateLimiter } from '@/lib/orchestration/rate-limiter';
import { CONCURRENCY } from '@/lib/orchestration/concurrency';
import { withRetry } from '@/lib/orchestration/retry';
import { logger } from '@/lib/utils/logger';
import type { Provider, ProviderRequest, ProviderResult } from '../index';

const ZHIPU_BASE = 'https://api.z.ai/api/paas/v4';
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '';

export interface ZhipuChatBody {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  thinking?: { type: string; clear_thinking?: boolean };
  reasoning_effort?: string;
  stream?: boolean;
  [key: string]: unknown;
}

export interface ZhipuChatResponse {
  choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  model?: string;
}

export interface ZhipuSearchResponse {
  search_result?: Array<{ title?: string; link?: string; content?: string; media?: string; publish_date?: string }>;
}

export interface ZhipuReaderResponse {
  reader_result?: { content?: string };
}

export class ZhipuClient implements Provider {
  name = 'zhipu';

  async isHealthy(): Promise<boolean> {
    if (!ZHIPU_API_KEY) return false;
    return globalBreaker.canAttempt('zhipu');
  }

  private async rawRequest(
    endpoint: string,
    body: unknown,
    signal: AbortSignal,
    method = 'POST'
  ): Promise<{ data: unknown; headers: Headers; status: number }> {
    const response = await fetch(`${ZHIPU_BASE}/${endpoint}`, {
      method,
      headers: { 'Authorization': `Bearer ${ZHIPU_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    globalRateLimiter.learn('zhipu', response.headers);

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      const err = new Error(`Zhipu HTTP ${response.status}: ${text.slice(0, 200)}`);
      (err as Error & { status?: number }).status = response.status;
      throw err;
    }

    const data: unknown = await response.json();
    if (data && typeof data === 'object' && 'code' in data) {
      const code = (data as { code?: number }).code;
      if (code && code !== 0) {
        const err = new Error(`Zhipu error ${code}: ${(data as { message?: string }).message ?? ''}`);
        (err as Error & { code?: number }).code = code;
        throw err;
      }
    }
    return { data, headers: response.headers, status: response.status };
  }

  async chat(body: ZhipuChatBody): Promise<ZhipuChatResponse> {
    return CONCURRENCY.zhipu.run(async () => {
      const requestBody: ZhipuChatBody = { ...body, stream: false };
      if (requestBody.max_tokens) {
        requestBody.max_completion_tokens = requestBody.max_tokens;
        delete requestBody.max_tokens;
      }
      const result = await withRetry(
        async (signal) => this.rawRequest('chat/completions', requestBody, signal),
        {
          maxAttempts: 3,
          timeoutMs: 60_000,
          isRetryable: (e: unknown) => {
            const err = e as { status?: number; code?: number; name?: string };
            if (err.status === 429) return true;
            if (err.code === 1302 || err.code === 1305) return true;
            if (typeof err.status === 'number' && err.status >= 500) return true;
            if (err.name === 'AbortError' || err.name === 'TypeError') return true;
            return false;
          },
        }
      );
      globalBreaker.recordSuccess('zhipu');
      globalRateLimiter.record('zhipu');
      return result.data as ZhipuChatResponse;
    });
  }

  async chatStream(body: ZhipuChatBody): Promise<ReadableStream<Uint8Array>> {
    if (!ZHIPU_API_KEY) throw new Error('ZHIPU_API_KEY not set');
    return CONCURRENCY.zhipu.run(async () => {
      const requestBody: ZhipuChatBody = { ...body, stream: true };
      if (requestBody.max_tokens) {
        requestBody.max_completion_tokens = requestBody.max_tokens;
        delete requestBody.max_tokens;
      }
      const response = await fetch(`${ZHIPU_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${ZHIPU_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      globalRateLimiter.learn('zhipu', response.headers);
      if (!response.ok) {
        globalBreaker.recordFailure('zhipu');
        throw new Error(`Zhipu stream HTTP ${response.status}`);
      }
      globalBreaker.recordSuccess('zhipu');
      globalRateLimiter.record('zhipu');
      if (!response.body) throw new Error('No response body');
      return response.body;
    });
  }

  async webSearch(body: {
    search_query: string; count?: number; search_engine?: string;
    search_recency_filter?: string; content_size?: string;
  }): Promise<ZhipuSearchResponse> {
    return CONCURRENCY.zhipu.run(async () => {
      const result = await withRetry(
        async (signal) => this.rawRequest('web_search', body, signal),
        { maxAttempts: 2, timeoutMs: 25_000, isRetryable: () => true }
      );
      globalRateLimiter.record('zhipu');
      return result.data as ZhipuSearchResponse;
    });
  }

  async webReader(body: {
    url: string; return_format?: string; retain_images?: boolean;
  }): Promise<ZhipuReaderResponse> {
    return CONCURRENCY.zhipu.run(async () => {
      const result = await withRetry(
        async (signal) => this.rawRequest('reader', body, signal),
        { maxAttempts: 2, timeoutMs: 25_000, isRetryable: () => true }
      );
      globalRateLimiter.record('zhipu');
      return result.data as ZhipuReaderResponse;
    });
  }

  async invoke(req: ProviderRequest): Promise<ProviderResult> {
    const start = Date.now();
    const response = await this.chat({
      messages: req.messages,
      model: req.model ?? 'glm-4.7-flash',
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 4096,
    });
    return {
      content: response.choices?.[0]?.message?.content ?? '',
      reasoning: response.choices?.[0]?.message?.reasoning_content,
      tokens: {
        input: response.usage?.prompt_tokens ?? 0,
        output: response.usage?.completion_tokens ?? 0,
        total: response.usage?.total_tokens ?? 0,
      },
      model: response.model ?? req.model ?? 'glm-4.7-flash',
      provider: this.name,
      finishReason: 'stop',
      latencyMs: Date.now() - start,
      cached: false,
    };
  }

  async *invokeStream(req: ProviderRequest): AsyncGenerator<string> {
    const stream = await this.chatStream({
      messages: req.messages,
      model: req.model ?? 'glm-4.7-flash',
      temperature: req.temperature ?? 0.7,
      max_tokens: req.maxTokens ?? 4096,
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

export const zhipuClient = new ZhipuClient();
void logger;
