import { RateLimiter } from '../../orchestration/rate-limiter';
import { CircuitBreaker } from '../../orchestration/circuit-breaker';

const ZHIPU_BASE = 'https://api.z.ai/api/paas/v4';
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '';

export class ZhipuClient {
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new CircuitBreaker();
  private provider = 'zhipu';
  private maxRetries = 3;
  private baseDelay = 1000;

  private async request(endpoint: string, body: any, timeout = 30000, method = 'POST') {
    const startTime = Date.now();
    console.log(`[Zhipu] 📤 Request to ${endpoint}`);

    if (!ZHIPU_API_KEY) {
      console.error('[Zhipu] ❌ No API key');
      throw new Error('ZHIPU_API_KEY not set');
    }

    if (this.circuitBreaker.isOpen(this.provider)) {
      console.warn('[Zhipu] ⚠️ Circuit breaker open');
      throw new Error(`Circuit breaker open for ${this.provider}`);
    }

    if (!(await this.rateLimiter.check(this.provider))) {
      console.warn('[Zhipu] ⚠️ Rate limit exceeded');
      throw new Error(`Rate limit exceeded for ${this.provider}`);
    }

    let attempt = 0;
    let delay = this.baseDelay;
    while (attempt < this.maxRetries) {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        const response = await fetch(`${ZHIPU_BASE}/${endpoint}`, {
          method,
          headers: {
            'Authorization': `Bearer ${ZHIPU_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(id);
        const latency = Date.now() - startTime;

        if (!response.ok) {
          const text = await response.text();
          console.error(`[Zhipu] ❌ HTTP ${response.status} (${latency}ms): ${text}`);
          if (response.status === 429 || response.status >= 500) {
            console.warn(`[Zhipu] Retryable error (${response.status}), attempt ${attempt+1}/${this.maxRetries}`);
            attempt++;
            await this.sleep(delay);
            delay *= 2;
            continue;
          }
          throw new Error(`Zhipu error ${response.status}: ${text}`);
        }

        this.circuitBreaker.recordSuccess(this.provider);
        console.log(`[Zhipu] ✅ Success (${latency}ms)`);
        return response.json();
      } catch (error) {
        if (attempt >= this.maxRetries) {
          this.circuitBreaker.recordFailure(this.provider);
          throw error;
        }
        console.warn(`[Zhipu] Request failed (attempt ${attempt+1}/${this.maxRetries}):`, error);
        attempt++;
        await this.sleep(delay);
        delay *= 2;
      }
    }
    throw new Error('All retries exhausted for Zhipu');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async chat(body: any) {
    const requestBody = { ...body };
    if (requestBody.max_tokens) {
      requestBody.max_completion_tokens = requestBody.max_tokens;
      delete requestBody.max_tokens;
    }
    requestBody.stream = false;
    return this.request('chat/completions', requestBody);
  }

  async chatStream(body: any) {
    // Streaming doesn't retry; we'll let the orchestrator handle fallback.
    console.log('[Zhipu] 📡 Streaming request');
    if (!ZHIPU_API_KEY) throw new Error('ZHIPU_API_KEY not set');
    if (this.circuitBreaker.isOpen(this.provider)) {
      throw new Error(`Circuit breaker open for ${this.provider}`);
    }
    if (!(await this.rateLimiter.check(this.provider))) {
      throw new Error(`Rate limit exceeded for ${this.provider}`);
    }

    const requestBody = { ...body };
    if (requestBody.max_tokens) {
      requestBody.max_completion_tokens = requestBody.max_tokens;
      delete requestBody.max_tokens;
    }
    requestBody.stream = true;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`${ZHIPU_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ZHIPU_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      clearTimeout(id);
      if (!response.ok) {
        const text = await response.text();
        console.error(`[Zhipu] ❌ Stream error ${response.status}: ${text}`);
        throw new Error(`Zhipu stream error ${response.status}: ${text}`);
      }
      this.circuitBreaker.recordSuccess(this.provider);
      console.log('[Zhipu] ✅ Stream obtained');
      return response.body;
    } catch (error) {
      clearTimeout(id);
      this.circuitBreaker.recordFailure(this.provider);
      throw error;
    }
  }

  async webSearch(body: any) {
    return this.request('web_search', body);
  }

  async webReader(body: any) {
    return this.request('reader', body);
  }
}
