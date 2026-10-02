// == KALKI B6 HARDENING ==
// Agnes client with concurrency semaphore, jittered retry, circuit breaker.
// -----------------------------------------------------------------------------

import { globalBreaker } from '@/lib/orchestration/circuit-breaker';
import { globalRateLimiter } from '@/lib/orchestration/rate-limiter';
import { CONCURRENCY } from '@/lib/orchestration/concurrency';
import { withRetry } from '@/lib/orchestration/retry';
import type { Provider, ProviderRequest, ProviderResult } from '../index';

const AGNES_BASE = 'https://apihub.agnes-ai.com/v1';
const AGNES_API_KEY = process.env.AGNES_API_KEY || '';

export interface AgnesChatBody {
  messages: Array<{ role: string; content: string }>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  [key: string]: unknown;
}

export interface AgnesChatResponse {
  choices?: Array<{ message?: { content?: string; reasoning_content?: string } }>;
  usage?: { total_tokens?: number; prompt_tokens?: number; completion_tokens?: number };
  model?: string;
}

export interface AgnesImageBody {
  model?: string;
  prompt: string;
  size?: string;
  ratio?: string;
  n?: number;
  extra_body?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AgnesImageResponse {
  data: Array<{ url: string; revised_prompt?: string }>;
  created?: number;
  model?: string;
}

export interface AgnesVideoBody {
  model?: string;
  prompt: string;
  mode?: string;
  seconds?: string;
  size?: string;
  aspect_ratio?: string;
  seed?: number;
  images?: string[];
  audios?: string[];
  videos?: Array<{ url: string; start_seconds?: number; require_audio?: boolean }>;
  first_frame?: string;
  last_frame?: string;
  [key: string]: unknown;
}

export interface AgnesVideoResponse {
  video_id?: string;
  id?: string;
  task_id?: string;
  status?: string;
  progress?: number;
  url?: string;
  metadata?: { url?: string };
}

export interface AgnesVideoStatus {
  status?: string;
  progress?: number;
  video_id?: string;
  metadata?: { url?: string };
  url?: string;
  error?: { message?: string };
}

export class AgnesClient implements Provider {
  name = 'agnes';

  async isHealthy(): Promise<boolean> {
    if (!AGNES_API_KEY) return false;
    return globalBreaker.canAttempt('agnes');
  }

  private async request<T>(endpoint: string, body: unknown, timeoutMs = 60_000): Promise<T> {
    if (!AGNES_API_KEY) throw new Error('AGNES_API_KEY not set');

    return CONCURRENCY.agnes.run(async () => {
      if (!globalBreaker.canAttempt('agnes')) throw new Error('Agnes circuit open');
      const limiter = await globalRateLimiter.check('agnes');
      if (!limiter.allowed) throw new Error(`Agnes rate limited (${limiter.waitMs}ms)`);

      const result = await withRetry(
        async (signal) => {
          const response = await fetch(`${AGNES_BASE}/${endpoint}`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${AGNES_API_KEY}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
            signal,
          });
          globalRateLimiter.learn('agnes', response.headers);
          if (!response.ok) {
            const text = await response.text().catch(() => '');
            const err = new Error(`Agnes HTTP ${response.status}: ${text.slice(0, 200)}`);
            (err as Error & { status?: number }).status = response.status;
            throw err;
          }
          return (await response.json()) as T;
        },
        {
          maxAttempts: 3,
          timeoutMs,
          isRetryable: (e: unknown) => {
            const err = e as { status?: number; name?: string };
            if (err.status === 429) return true;
            if (typeof err.status === 'number' && err.status >= 500) return true;
            if (err.name === 'AbortError' || err.name === 'TypeError') return true;
            return false;
          },
        }
      );

      globalBreaker.recordSuccess('agnes');
      globalRateLimiter.record('agnes');
      return result;
    });
  }

  async chat(body: AgnesChatBody): Promise<AgnesChatResponse> {
    return this.request('chat/completions', { ...body, model: body.model ?? 'agnes-2.5-flash' });
  }

  async chatStream(body: AgnesChatBody): Promise<ReadableStream<Uint8Array>> {
    if (!AGNES_API_KEY) throw new Error('AGNES_API_KEY not set');
    return CONCURRENCY.agnes.run(async () => {
      const response = await fetch(`${AGNES_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${AGNES_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, model: body.model ?? 'agnes-2.5-flash', stream: true }),
      });
      globalRateLimiter.learn('agnes', response.headers);
      if (!response.ok) {
        globalBreaker.recordFailure('agnes');
        throw new Error(`Agnes stream HTTP ${response.status}`);
      }
      globalBreaker.recordSuccess('agnes');
      globalRateLimiter.record('agnes');
      if (!response.body) throw new Error('No response body');
      return response.body;
    });
  }

  async image(body: AgnesImageBody): Promise<AgnesImageResponse> {
    return this.request('images/generations', {
      model: 'agnes-image-2.1-flash',
      ...body,
      extra_body: { response_format: 'url', ...(body.extra_body ?? {}) },
    }, 90_000);
  }

  async video(body: AgnesVideoBody): Promise<AgnesVideoResponse> {
    return this.request('videos', {
      model: body.model ?? 'agnes-video-2.5-flash',
      ...body,
      seconds: body.seconds ? String(body.seconds) : '5',
    }, 90_000);
  }

  async videoStatus(videoId: string, modelName: string): Promise<AgnesVideoStatus> {
    if (!AGNES_API_KEY) throw new Error('AGNES_API_KEY not set');
    const response = await fetch(
      `${AGNES_BASE}/agnesapi?video_id=${encodeURIComponent(videoId)}&model_name=${encodeURIComponent(modelName)}`,
      { headers: { 'Authorization': `Bearer ${AGNES_API_KEY}` } }
    );
    if (!response.ok) throw new Error(`Agnes video status HTTP ${response.status}`);
    return response.json() as Promise<AgnesVideoStatus>;
  }

  async invoke(req: ProviderRequest): Promise<ProviderResult> {
    const start = Date.now();
    const response = await this.chat({
      messages: req.messages,
      model: req.model ?? 'agnes-2.5-flash',
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
      model: response.model ?? req.model ?? 'agnes-2.5-flash',
      provider: this.name,
      finishReason: 'stop',
      latencyMs: Date.now() - start,
      cached: false,
    };
  }

  async *invokeStream(req: ProviderRequest): AsyncGenerator<string> {
    const stream = await this.chatStream({
      messages: req.messages,
      model: req.model ?? 'agnes-2.5-flash',
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

export const agnesClient = new AgnesClient();
