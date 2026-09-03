import { ModelRegistry, ModelProvider } from './model-registry';
import { RateLimiter } from './rate-limiter';
import { CircuitBreaker } from './circuit-breaker';

export interface OrchestratorRequest {
  messages: any[];
  stream?: boolean;
  deep?: boolean;
  tools?: any[];
  image_url?: string;
  userId?: string;
  sessionId?: string;
  preferredProvider?: string;
  intent?: 'chat' | 'image' | 'video' | 'setu' | 'deep';
}

export class StreamingOrchestrator {
  private registry = new ModelRegistry();
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new CircuitBreaker();
  private sessionMap = new Map<string, string>();

  async route(request: OrchestratorRequest): Promise<any> {
    const { messages, stream = false, deep, tools, image_url, userId, sessionId, preferredProvider, intent } = request;

    console.log('[Orchestrator] Starting route with intent:', intent);

    // 1. Select candidate providers
    let candidates = this.registry.getAvailable();
    console.log('[Orchestrator] Available providers:', candidates.map(p => p.name).join(', '));

    if (intent === 'image') {
      candidates = candidates.filter(p => p.capabilities.supportsImages);
    } else if (intent === 'video') {
      candidates = candidates.filter(p => p.capabilities.supportsVideo);
    } else if (intent === 'deep' || deep) {
      candidates = candidates.filter(p => p.capabilities.supportsThinking);
    }

    console.log('[Orchestrator] Candidates after filtering:', candidates.map(p => p.name).join(', '));

    // 2. Sticky routing (for OpenRouter)
    if (sessionId && this.sessionMap.has(sessionId)) {
      const stickyName = this.sessionMap.get(sessionId)!;
      const stickyProvider = candidates.find(p => p.name === stickyName);
      if (stickyProvider) {
        candidates = [stickyProvider, ...candidates.filter(p => p.name !== stickyName)];
        console.log('[Orchestrator] Sticky routing to:', stickyName);
      }
    }

    // 3. Preferred provider
    if (preferredProvider) {
      const preferred = candidates.find(p => p.name === preferredProvider);
      if (preferred) {
        candidates = [preferred, ...candidates.filter(p => p.name !== preferredProvider)];
        console.log('[Orchestrator] Preferred provider:', preferredProvider);
      }
    }

    // 4. Try each provider
    for (const provider of candidates) {
      const isOpen = this.circuitBreaker.isOpen(provider.name);
      const isLimited = !(await this.rateLimiter.check(provider.name));
      console.log(`[Orchestrator] Checking ${provider.name}: circuitOpen=${isOpen}, rateLimited=${isLimited}`);

      if (isOpen) {
        console.warn(`[Orchestrator] Circuit breaker open for ${provider.name}`);
        continue;
      }
      if (isLimited) {
        console.warn(`[Orchestrator] Rate limit exceeded for ${provider.name}`);
        continue;
      }

      try {
        console.log(`[Orchestrator] Calling ${provider.name}...`);
        const result = await this.callProvider(provider, request);
        if (result instanceof ReadableStream) {
          console.log(`[Orchestrator] ${provider.name} returned a stream.`);
          if (sessionId && !this.sessionMap.has(sessionId)) {
            this.sessionMap.set(sessionId, provider.name);
          }
          return result;
        }
        if (result?.choices?.[0]?.message?.content) {
          const content = result.choices[0].message.content;
          const text = typeof content === 'string' ? content : String(content);
          console.log(`[Orchestrator] ${provider.name} returned plain text (${text.length} chars). Wrapping in stream.`);
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'content', content: text })}\n\n`));
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
              controller.close();
            },
          });
          if (sessionId && !this.sessionMap.has(sessionId)) {
            this.sessionMap.set(sessionId, provider.name);
          }
          return stream;
        }
        console.warn(`[Orchestrator] ${provider.name} returned unexpected result:`, result);
        // Continue to next provider
      } catch (error) {
        console.error(`[Orchestrator] ${provider.name} failed:`, error);
        this.circuitBreaker.recordFailure(provider.name);
        // Try next provider
      }
    }

    console.error('[Orchestrator] All providers failed. Returning fallback stream.');
    return this.fallbackStream(messages);
  }

  private async callProvider(provider: ModelProvider, request: OrchestratorRequest): Promise<any> {
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

    if (provider.name === 'agnes' && deep && provider.capabilities.supportsThinking) {
      body.thinking = { type: 'enabled' };
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
    if (provider.name === 'openrouter' && sessionId) {
      body.session_id = sessionId;
    }

    if (stream && provider.capabilities.supportsStreaming) {
      return provider.client.chatStream(body);
    }
    return provider.client.chat(body);
  }

  private fallbackStream(messages: any[]): ReadableStream {
    const fallbackText = "I'm having trouble connecting. Please try again later.";
    return new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'content', content: fallbackText })}\n\n`));
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`));
        controller.close();
      },
    });
  }

  clearSession(sessionId: string): void {
    this.sessionMap.delete(sessionId);
  }
}
