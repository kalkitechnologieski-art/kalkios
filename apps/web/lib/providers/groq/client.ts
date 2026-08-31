import { RateLimiter } from '../../orchestration/rate-limiter';
import { CircuitBreaker } from '../../orchestration/circuit-breaker';

const GROQ_BASE = 'https://api.groq.com/openai/v1';
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

export class GroqClient {
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new CircuitBreaker();
  private provider = 'groq';

  private async request(endpoint: string, body: any, timeout = 30000) {
    if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
    if (this.circuitBreaker.isOpen(this.provider)) {
      throw new Error(`Circuit breaker open for ${this.provider}`);
    }
    if (!(await this.rateLimiter.check(this.provider))) {
      throw new Error(`Rate limit exceeded for ${this.provider}`);
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(`${GROQ_BASE}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(id);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Groq error ${response.status}: ${text}`);
      }
      this.circuitBreaker.recordSuccess(this.provider);
      return response.json();
    } catch (error) {
      this.circuitBreaker.recordFailure(this.provider);
      throw error;
    }
  }

  async chat(body: any) {
    return this.request('chat/completions', { ...body, model: body.model || 'llama-3.3-70b-versatile' });
  }

  async chatStream(body: any) {
    if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY not set');
    if (this.circuitBreaker.isOpen(this.provider)) {
      throw new Error(`Circuit breaker open for ${this.provider}`);
    }
    if (!(await this.rateLimiter.check(this.provider))) {
      throw new Error(`Rate limit exceeded for ${this.provider}`);
    }

    const response = await fetch(`${GROQ_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, model: body.model || 'llama-3.3-70b-versatile', stream: true }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Groq stream error ${response.status}: ${text}`);
    }
    this.circuitBreaker.recordSuccess(this.provider);
    return response.body;
  }
}
