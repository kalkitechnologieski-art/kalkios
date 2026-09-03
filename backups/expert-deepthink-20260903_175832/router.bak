import { AgnesClient } from '@/lib/providers/agnes/client';
import { GroqClient } from '@/lib/providers/groq/client';
import { ZhipuClient } from '@/lib/providers/zhipu/client';
import { OpenRouterClient } from '@/lib/providers/openrouter/client';
import { RateLimiter } from './rate-limiter';
import { CircuitBreaker } from './circuit-breaker';

interface ProviderConfig {
  name: string;
  client: any;
  model: string;
  weight: number;
  rpmLimit: number;
  supportsStreaming: boolean;
  supportsThinking: boolean;
  isAvailable: () => boolean;
}

const PROVIDERS: ProviderConfig[] = [
  {
    name: 'agnes',
    client: new AgnesClient(),
    model: 'agnes-2.5-flash',
    weight: 0.9,
    rpmLimit: 20,
    supportsStreaming: true,
    supportsThinking: true,
    isAvailable: () => !!process.env.AGNES_API_KEY,
  },
  {
    name: 'groq',
    client: new GroqClient(),
    model: 'llama-3.3-70b-versatile',
    weight: 0.85,
    rpmLimit: 30,
    supportsStreaming: true,
    supportsThinking: false,
    isAvailable: () => !!process.env.GROQ_API_KEY,
  },
  {
    name: 'zhipu',
    client: new ZhipuClient(),
    model: 'glm-4.7',
    weight: 0.8,
    rpmLimit: 1,
    supportsStreaming: true,
    supportsThinking: true,
    isAvailable: () => !!process.env.ZHIPU_API_KEY,
  },
  {
    name: 'openrouter',
    client: new OpenRouterClient(),
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    weight: 0.6,
    rpmLimit: 20,
    supportsStreaming: true,
    supportsThinking: false,
    isAvailable: () => !!process.env.OPENROUTER_API_KEY,
  },
];

export class IntelligentRouter {
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new CircuitBreaker();
  private sessionMap = new Map<string, string>();

  async route(request: any): Promise<any> {
    const { messages, stream = false, deep, tools, image_url, userId, sessionId } = request;

    let available = PROVIDERS.filter(p => p.isAvailable());
    if (request.provider) {
      const preferred = available.find(p => p.name === request.provider);
      if (preferred) {
        available = [preferred, ...available.filter(p => p.name !== request.provider)];
      }
    }

    // Sticky routing for OpenRouter
    if (sessionId && this.sessionMap.has(sessionId)) {
      const stickyProvider = this.sessionMap.get(sessionId)!;
      const provider = available.find(p => p.name === stickyProvider);
      if (provider) {
        try {
          return await this.callProvider(provider, request, sessionId);
        } catch {
          this.sessionMap.delete(sessionId);
        }
      }
    }

    for (const provider of available) {
      if (this.circuitBreaker.isOpen(provider.name)) continue;
      if (!(await this.rateLimiter.check(provider.name))) continue;

      try {
        const result = await this.callProvider(provider, request, sessionId);
        if (sessionId && !this.sessionMap.has(sessionId)) {
          this.sessionMap.set(sessionId, provider.name);
        }
        return result;
      } catch (error) {
        this.circuitBreaker.recordFailure(provider.name);
        console.warn(`[Router] ${provider.name} failed:`, error);
      }
    }

    return this.fallbackResponse(messages);
  }

  private async callProvider(provider: ProviderConfig, request: any, sessionId?: string): Promise<any> {
    const { messages, stream, deep, tools, image_url } = request;
    const body: any = {
      messages,
      model: provider.model,
      temperature: 0.7,
      max_tokens: 2048,
      stream: stream && provider.supportsStreaming,
    };
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

    if (provider.name === 'agnes' && deep && provider.supportsThinking) {
      body.thinking = { type: 'enabled' };
    }
    if (provider.name === 'zhipu') {
      if (body.max_tokens) {
        body.max_completion_tokens = body.max_tokens;
        delete body.max_tokens;
      }
      if (deep && provider.supportsThinking) {
        body.thinking = { type: 'enabled' };
      }
    }
    if (provider.name === 'openrouter' && sessionId) {
      body.session_id = sessionId;
    }

    if (stream && provider.supportsStreaming) {
      return provider.client.chatStream(body);
    }
    return provider.client.chat(body);
  }

  private fallbackResponse(messages: any[]): any {
    return {
      choices: [{
        message: {
          content: "I'm having trouble connecting to my AI services. Please try again.",
        },
      }],
      usage: { total_tokens: 0 },
      provider: 'fallback',
    };
  }

  clearSession(sessionId: string): void {
    this.sessionMap.delete(sessionId);
  }
}
