import { RateLimiter } from '../../orchestration/rate-limiter';
import { CircuitBreaker } from '../../orchestration/circuit-breaker';

const OR_BASE = 'https://openrouter.ai/api/v1';
const OR_API_KEY = process.env.OPENROUTER_API_KEY || '';

export class OpenRouterClient {
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new CircuitBreaker();
  private provider = 'openrouter';

  private async request(endpoint: string, body: any, timeout = 30000) {
    if (!OR_API_KEY) throw new Error('OPENROUTER_API_KEY not set');
    if (this.circuitBreaker.isOpen(this.provider)) {
      throw new Error(`Circuit breaker open for ${this.provider}`);
    }
    if (!(await this.rateLimiter.check(this.provider))) {
      throw new Error(`Rate limit exceeded for ${this.provider}`);
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(`${OR_BASE}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OR_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(id);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`OpenRouter error ${response.status}: ${text}`);
      }
      this.circuitBreaker.recordSuccess(this.provider);
      return response.json();
    } catch (error) {
      this.circuitBreaker.recordFailure(this.provider);
      throw error;
    }
  }

  async chat(body: any) {
    return this.request('chat/completions', body);
  }

  async chatStream(body: any) {
    if (!OR_API_KEY) throw new Error('OPENROUTER_API_KEY not set');
    if (this.circuitBreaker.isOpen(this.provider)) {
      throw new Error(`Circuit breaker open for ${this.provider}`);
    }
    if (!(await this.rateLimiter.check(this.provider))) {
      throw new Error(`Rate limit exceeded for ${this.provider}`);
    }

    const response = await fetch(`${OR_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OR_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com',
      },
      body: JSON.stringify({ ...body, stream: true }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`OpenRouter stream error ${response.status}: ${text}`);
    }
    this.circuitBreaker.recordSuccess(this.provider);
    return response.body;
  }
}
