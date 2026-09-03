import { RateLimiter } from '../../orchestration/rate-limiter';
import { CircuitBreaker } from '../../orchestration/circuit-breaker';

const ZHIPU_BASE = 'https://api.z.ai/api/paas/v4';
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '';

// ─── Zhipu error codes for rate limiting ──────────────────────────────
const ERROR_CODES = {
  RATE_LIMIT: 1302,
  MODEL_OVERLOADED: 1305,
  USAGE_LIMIT: 1308,
  FAIR_USE: 1313,
};

export class ZhipuClient {
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new CircuitBreaker();
  private provider = 'zhipu';
  private maxRetries = 4;
  private baseDelay = 500;
  private requestQueue: Promise<any> = Promise.resolve();

  private isRateLimitError(error: any): boolean {
    const code = error?.code || 0;
    return (
      code === ERROR_CODES.RATE_LIMIT ||
      code === ERROR_CODES.MODEL_OVERLOADED ||
      code === ERROR_CODES.USAGE_LIMIT ||
      code === ERROR_CODES.FAIR_USE ||
      error?.status === 429
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async _makeRequest(endpoint: string, body: any, timeout = 30000, method = 'POST') {
    const startTime = Date.now();
    console.log(`[Zhipu] 📤 Request to ${endpoint}`);

    if (!ZHIPU_API_KEY) throw new Error('ZHIPU_API_KEY not set');
    if (this.circuitBreaker.isOpen(this.provider)) {
      throw new Error(`Circuit breaker open for ${this.provider}`);
    }
    if (!(await this.rateLimiter.check(this.provider))) {
      throw new Error(`Rate limit exceeded for ${this.provider}`);
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
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
      const data = await response.json();

      // Check Zhipu error codes in response
      if (data?.code && data.code !== 0) {
        const error = new Error(`Zhipu error ${data.code}: ${data.message}`);
        (error as any).code = data.code;
        (error as any).status = response.status;
        (error as any).headers = response.headers;
        throw error;
      }

      if (!response.ok) {
        const text = await response.text();
        const error = new Error(`Zhipu HTTP ${response.status}: ${text}`);
        (error as any).status = response.status;
        (error as any).headers = response.headers;
        throw error;
      }

      this.circuitBreaker.recordSuccess(this.provider);
      console.log(`[Zhipu] ✅ Success (${latency}ms)`);
      return data;
    } catch (error) {
      console.error(`[Zhipu] ❌ Request failed:`, error);
      this.circuitBreaker.recordFailure(this.provider);
      throw error;
    } finally {
      clearTimeout(id);
    }
  }

  // ─── Queue requests to respect 1 concurrent limit ──────────────────
  async request(endpoint: string, body: any, timeout = 30000, method = 'POST') {
    return new Promise((resolve, reject) => {
      this.requestQueue = this.requestQueue
        .then(() => this._makeRequest(endpoint, body, timeout, method))
        .then(resolve)
        .catch(reject);
    });
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
    // Search is rate-limited; we'll queue it.
    return this.request('web_search', body);
  }

  async webReader(body: any) {
    return this.request('reader', body);
  }
}
