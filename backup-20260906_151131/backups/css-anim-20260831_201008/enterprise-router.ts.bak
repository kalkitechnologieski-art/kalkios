import { ModelRegistry } from './model-registry';
import { RateLimiter } from './rate-limiter';
import { CircuitBreaker } from './circuit-breaker';

export interface EnterpriseRouterRequest {
  messages: any[];
  stream?: boolean;
  deep?: boolean;
  tools?: any[];
  image_url?: string;
  userId?: string;
  sessionId?: string;
  intent?: 'chat' | 'image' | 'video' | 'setu' | 'deep';
}

export class EnterpriseRouter {
  private registry = new ModelRegistry();
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new CircuitBreaker();
  private sessionMap = new Map<string, string>();

  // Priority: Zhipu (ZAI) → Agnes → Groq → OpenRouter
  private readonly PROVIDER_PRIORITY = ['zhipu', 'agnes', 'groq', 'openrouter'];

  async route(request: EnterpriseRouterRequest): Promise<any> {
    const { messages, stream = false, deep, tools, image_url, userId, sessionId, intent } = request;

    console.log(`[EnterpriseRouter] Starting route with intent: ${intent || 'chat'}`);

    let candidates = this.registry.getAvailable();
    console.log(`[EnterpriseRouter] Available: ${candidates.map(p => p.name).join(', ')}`);

    if (intent === 'image') {
      candidates = candidates.filter(p => p.capabilities.supportsImages);
    } else if (intent === 'video') {
      candidates = candidates.filter(p => p.capabilities.supportsVideo);
    } else if (intent === 'deep' || deep) {
      candidates = candidates.filter(p => p.capabilities.supportsThinking);
    }

    // Sort by priority (Zhipu first)
    candidates.sort((a, b) => {
      const idxA = this.PROVIDER_PRIORITY.indexOf(a.name);
      const idxB = this.PROVIDER_PRIORITY.indexOf(b.name);
      return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
    });

    console.log(`[EnterpriseRouter] Priority order: ${candidates.map(p => p.name).join(' → ')}`);

    // Sticky routing for OpenRouter
    if (sessionId && this.sessionMap.has(sessionId)) {
      const stickyName = this.sessionMap.get(sessionId)!;
      const stickyProvider = candidates.find(p => p.name === stickyName);
      if (stickyProvider) {
        candidates = [stickyProvider, ...candidates.filter(p => p.name !== stickyName)];
        console.log(`[EnterpriseRouter] Sticky routing to: ${stickyName}`);
      }
    }

    let lastError: Error | null = null;
    let attemptedProviders: string[] = [];

    for (const provider of candidates) {
      attemptedProviders.push(provider.name);

      if (this.circuitBreaker.isOpen(provider.name)) {
        console.warn(`[EnterpriseRouter] ⚠️ Circuit breaker open for ${provider.name}, skipping`);
        continue;
      }
      if (!(await this.rateLimiter.check(provider.name))) {
        console.warn(`[EnterpriseRouter] ⚠️ Rate limit exceeded for ${provider.name}, skipping`);
        continue;
      }

      try {
        console.log(`[EnterpriseRouter] 🚀 Attempting ${provider.name}...`);
        const startTime = Date.now();

        const result = await this.callProviderWithRetry(provider, request);

        const latency = Date.now() - startTime;
        console.log(`[EnterpriseRouter] ✅ ${provider.name} succeeded (${latency}ms)`);

        this.circuitBreaker.recordSuccess(provider.name);
        if (sessionId && !this.sessionMap.has(sessionId)) {
          this.sessionMap.set(sessionId, provider.name);
        }

        if (result instanceof ReadableStream) {
          return result;
        }

        if (result?.choices?.[0]?.message?.content) {
          const content = result.choices[0].message.content;
          const text = typeof content === 'string' ? content : String(content);
          return this.wrapInStream(text, provider.name);
        }

        console.warn(`[EnterpriseRouter] ${provider.name} returned unexpected result:`, result);
        continue;

      } catch (error: any) {
        lastError = error;
        console.error(`[EnterpriseRouter] ❌ ${provider.name} failed:`, error.message || error);
        this.circuitBreaker.recordFailure(provider.name);
        // Continue to next provider
      }
    }

    console.error(`[EnterpriseRouter] 🚨 All providers failed. Attempted: ${attemptedProviders.join(', ')}`);
    return this.emergencyFallback(messages, lastError, attemptedProviders);
  }

  private async callProviderWithRetry(
    provider: any,
    request: EnterpriseRouterRequest,
    maxRetries = 2
  ): Promise<any> {
    let lastError: Error | null = null;
    let delay = 500;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`[EnterpriseRouter] Retry ${attempt}/${maxRetries} for ${provider.name}`);
          await this.sleep(delay);
          delay *= 2;
        }
        return await this.callProvider(provider, request);
      } catch (error: any) {
        lastError = error;
        if (error.status === 401 || error.status === 400) throw error;
        if (!this.isRetryableError(error)) throw error;
      }
    }
    throw lastError || new Error(`All retries failed for ${provider.name}`);
  }

  private async callProvider(provider: any, request: EnterpriseRouterRequest): Promise<any> {
    const { messages, stream, deep, tools, image_url, sessionId } = request;

    const body: any = {
      messages,
      model: provider.defaultModel,
      temperature: 0.7,
      max_tokens: 2048,
      stream: stream && provider.capabilities.supportsStreaming,
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

    if (provider.name === 'zhipu') {
      if (body.max_tokens) {
        body.max_completion_tokens = body.max_tokens;
        delete body.max_tokens;
      }
      if (deep && provider.capabilities.supportsThinking) {
        body.thinking = { type: 'enabled' };
      }
    }
    if (provider.name === 'agnes' && deep && provider.capabilities.supportsThinking) {
      body.thinking = { type: 'enabled' };
    }
    if (provider.name === 'openrouter' && sessionId) {
      body.session_id = sessionId;
    }

    if (stream && provider.capabilities.supportsStreaming) {
      return provider.client.chatStream(body);
    }
    return provider.client.chat(body);
  }

  private isRetryableError(error: any): boolean {
    if (error.status === 429) return true;
    if (error.status >= 500 && error.status < 600) return true;
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
    if (error.name === 'TimeoutError' || error.message?.includes('timeout')) return true;
    if (error.message?.includes('rate limit') || error.message?.includes('Rate limit')) return true;
    if (error.message?.includes('overloaded') || error.message?.includes('Overloaded')) return true;
    if (error.message?.includes('unavailable') || error.message?.includes('Unavailable')) return true;
    return false;
  }

  private wrapInStream(content: string, provider: string): ReadableStream {
    console.log(`[EnterpriseRouter] Wrapping ${provider} response in stream (${content.length} chars)`);
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'content', content })}\n\n`));
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
        controller.close();
      },
    });
  }

  private emergencyFallback(messages: any[], error: Error | null, attempted: string[]): ReadableStream {
    const fallbackText = `I'm having trouble connecting. Attempted: ${attempted.join(', ')}. Please try again later.`;
    console.error(`[EnterpriseRouter] 🚨 EMERGENCY FALLBACK: ${fallbackText}`);
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'error', message: fallbackText })}\n\n`));
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
        controller.close();
      },
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  clearSession(sessionId: string): void {
    this.sessionMap.delete(sessionId);
  }
}
