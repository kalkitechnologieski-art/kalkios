import { RateLimiter } from '../../orchestration/rate-limiter';
import { CircuitBreaker } from '../../orchestration/circuit-breaker';

const ZHIPU_BASE = 'https://api.z.ai/api/paas/v4';
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY || '';

export class ZhipuClient {
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new CircuitBreaker();
  private provider = 'zhipu';

  private async request(endpoint: string, body: any, timeout = 30000, method = 'POST') {
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
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Zhipu error ${response.status}: ${text}`);
      }
      this.circuitBreaker.recordSuccess(this.provider);
      return response.json();
    } catch (error) {
      this.circuitBreaker.recordFailure(this.provider);
      throw error;
    }
  }

  async chat(body: any) {
    const requestBody = { ...body };
    if (requestBody.max_tokens) {
      requestBody.max_completion_tokens = requestBody.max_tokens;
      delete requestBody.max_tokens;
    }
    return this.request('chat/completions', requestBody);
  }

  async webSearch(body: any) {
    return this.request('web_search', body);
  }

  async webReader(body: any) {
    return this.request('reader', body);
  }
}
