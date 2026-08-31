import { RateLimiter } from '../../orchestration/rate-limiter';
import { CircuitBreaker } from '../../orchestration/circuit-breaker';

const AGNES_BASE = 'https://apihub.agnes-ai.com/v1';
const AGNES_API_KEY = process.env.AGNES_API_KEY || '';

export class AgnesClient {
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new CircuitBreaker();
  private provider = 'agnes';

  private async request(endpoint: string, body: any, timeout = 30000) {
    console.log(`[Agnes] Request to ${endpoint}`);
    if (!AGNES_API_KEY) {
      console.error('[Agnes] No API key');
      throw new Error('AGNES_API_KEY not set');
    }
    if (this.circuitBreaker.isOpen(this.provider)) {
      console.warn('[Agnes] Circuit breaker open');
      throw new Error(`Circuit breaker open for ${this.provider}`);
    }
    if (!(await this.rateLimiter.check(this.provider))) {
      console.warn('[Agnes] Rate limit exceeded');
      throw new Error(`Rate limit exceeded for ${this.provider}`);
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(`${AGNES_BASE}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AGNES_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(id);
      if (!response.ok) {
        const text = await response.text();
        console.error(`[Agnes] HTTP ${response.status}: ${text}`);
        throw new Error(`Agnes error ${response.status}: ${text}`);
      }
      this.circuitBreaker.recordSuccess(this.provider);
      return response.json();
    } catch (error) {
      console.error('[Agnes] Request failed:', error);
      this.circuitBreaker.recordFailure(this.provider);
      throw error;
    }
  }

  async chat(body: any) {
    return this.request('chat/completions', body);
  }

  async chatStream(body: any) {
    console.log('[Agnes] Chat stream requested');
    if (!AGNES_API_KEY) throw new Error('AGNES_API_KEY not set');
    if (this.circuitBreaker.isOpen(this.provider)) {
      throw new Error(`Circuit breaker open for ${this.provider}`);
    }
    if (!(await this.rateLimiter.check(this.provider))) {
      throw new Error(`Rate limit exceeded for ${this.provider}`);
    }

    const response = await fetch(`${AGNES_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AGNES_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...body, stream: true }),
    });
    if (!response.ok) {
      const text = await response.text();
      console.error(`[Agnes] Stream error ${response.status}: ${text}`);
      throw new Error(`Agnes stream error ${response.status}: ${text}`);
    }
    this.circuitBreaker.recordSuccess(this.provider);
    console.log('[Agnes] Stream obtained');
    return response.body;
  }

  async image(body: any) {
    return this.request('images/generations', body);
  }

  async video(body: any) {
    return this.request('videos', body);
  }

  async videoStatus(videoId: string, modelName: string) {
    const url = `${AGNES_BASE}/agnesapi?video_id=${videoId}&model_name=${modelName}`;
    if (!AGNES_API_KEY) throw new Error('AGNES_API_KEY not set');
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${AGNES_API_KEY}` },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Agnes video status error ${response.status}: ${text}`);
    }
    return response.json();
  }
}
