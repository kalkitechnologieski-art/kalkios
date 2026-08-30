import { agnesClient, groqClient, openRouterClient, zhipuClient } from '@/lib/providers';
import { redisClient } from '@/lib/cache/redis';
import { ResponseCache } from '@/lib/cache/response-cache';
import { RateLimiter } from './rate-limiter';
import { CircuitBreaker } from './circuit-breaker';
import { withRetry } from './retry';
import { auditLog } from '@/lib/security/audit';
type Provider = 'agnes' | 'groq' | 'openrouter' | 'zhipu';
const providerOrder: Provider[] = ['agnes', 'groq', 'openrouter', 'zhipu'];
const clients = { agnes: agnesClient, groq: groqClient, openrouter: openRouterClient, zhipu: zhipuClient };
export class IntelligentRouter {
  private cache = new ResponseCache();
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new CircuitBreaker();
  async route(request: {
    messages: any[];
    stream?: boolean;
    deep?: boolean;
    tools?: any[];
    image_url?: string;
    provider?: Provider;
    userId?: string;
  }): Promise<any> {
    const { messages, stream = false, deep, tools, image_url, provider: preferred, userId } = request;
    if (!stream && !deep && !tools) {
      const cached = await this.cache.get(messages);
      if (cached) return cached;
    }
    let providers: Provider[] = [];
    if (preferred) {
      providers = [preferred, ...providerOrder.filter(p => p !== preferred)];
    } else {
      providers = providerOrder;
    }
    let lastError: Error | null = null;
    for (const provider of providers) {
      if (this.circuitBreaker.isOpen(provider)) continue;
      if (!await this.rateLimiter.check(provider)) continue;
      try {
        const result = await withRetry(
          () => this.callProvider(provider, request),
          provider,
          this.circuitBreaker
        );
        if (!stream && !deep && !tools) {
          await this.cache.set(messages, result);
        }
        await auditLog(userId, 'ai_chat_success', provider, result);
        return result;
      } catch (error) {
        lastError = error as Error;
        await auditLog(userId, 'ai_chat_failure', provider, { error: error.message });
        console.warn(`Provider ${provider} failed:`, error);
      }
    }
    return this.fallbackResponse(messages, lastError, userId);
  }
  private async callProvider(provider: Provider, request: any) {
    const { messages, stream, deep, tools, image_url } = request;
    const body: any = { messages, temperature: 0.7, max_tokens: 4096 };
    if (tools) body.tools = tools;
    if (image_url) {
      const last = messages[messages.length - 1];
      if (last?.role === 'user') {
        last.content = [
          { type: 'text', text: last.content },
          { type: 'image_url', image_url: { url: image_url } },
        ];
      }
    }
    if (provider === 'agnes') {
      body.model = 'agnes-2.0-flash';
      if (deep) body.chat_template_kwargs = { enable_thinking: true };
      if (stream) {
        const response = await clients.agnes.chatStream(body);
        return this.processStream(response);
      }
      return clients.agnes.chat(body);
    }
    if (provider === 'groq') {
      body.model = 'llama-3.3-70b-versatile';
      if (stream) {
        const response = await clients.groq.chatStream(body);
        return this.processStream(response);
      }
      return clients.groq.chat(body);
    }
    if (provider === 'openrouter') {
      body.model = 'meta-llama/llama-3.2-3b-instruct:free';
      if (stream) {
        const response = await clients.openRouter.chatStream(body);
        return this.processStream(response);
      }
      return clients.openRouter.chat(body);
    }
    if (provider === 'zhipu') {
      body.model = 'glm-5.3';
      if (deep) {
        body.thinking = { type: 'enabled', clear_thinking: false };
        body.reasoning_effort = 'max';
      }
      if (stream) {
        return clients.zhipu.chat(body);
      }
      return clients.zhipu.chat(body);
    }
  }
  private async processStream(streamBody: ReadableStream) { return streamBody; }
  private fallbackResponse(messages: any[], error: Error | null, userId?: string): any {
    const content = "I'm having trouble connecting right now. Please try again in a moment. If the issue persists, our team has been notified.";
    if (error) console.error('All providers failed for user', userId, error);
    return { choices: [{ message: { content } }], usage: { total_tokens: 0 }, provider: 'fallback' };
  }
}
