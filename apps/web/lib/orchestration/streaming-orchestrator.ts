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
  // For specialised intents
  intent?: 'chat' | 'image' | 'video' | 'setu' | 'deep';
}

export class StreamingOrchestrator {
  private registry = new ModelRegistry();
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new CircuitBreaker();
  private sessionMap = new Map<string, string>();

  async route(request: OrchestratorRequest): Promise<any> {
    const { messages, stream = false, deep, tools, image_url, userId, sessionId, preferredProvider, intent } = request;

    // 1. Select candidate providers based on intent
    let candidates = this.registry.getAvailable();

    // If a specific capability is needed, filter further
    if (intent === 'image') {
      candidates = candidates.filter(p => p.capabilities.supportsImages);
    } else if (intent === 'video') {
      candidates = candidates.filter(p => p.capabilities.supportsVideo);
    } else if (intent === 'deep' || deep) {
      candidates = candidates.filter(p => p.capabilities.supportsThinking);
    }

    // 2. Apply sticky routing (for OpenRouter)
    if (sessionId && this.sessionMap.has(sessionId)) {
      const stickyName = this.sessionMap.get(sessionId)!;
      const stickyProvider = candidates.find(p => p.name === stickyName);
      if (stickyProvider) {
        candidates = [stickyProvider, ...candidates.filter(p => p.name !== stickyName)];
      }
    }

    // 3. Preferred provider
    if (preferredProvider) {
      const preferred = candidates.find(p => p.name === preferredProvider);
      if (preferred) {
        candidates = [preferred, ...candidates.filter(p => p.name !== preferredProvider)];
      }
    }

    // 4. Try each provider in order
    let lastError: Error | null = null;
    for (const provider of candidates) {
      if (this.circuitBreaker.isOpen(provider.name)) continue;
      if (!(await this.rateLimiter.check(provider.name))) continue;

      try {
        const result = await this.callProvider(provider, request);
        // If result is a ReadableStream, we're good
        if (result instanceof ReadableStream) {
          if (sessionId && !this.sessionMap.has(sessionId)) {
            this.sessionMap.set(sessionId, provider.name);
          }
          return result;
        }
        // If result is a plain object with content, wrap it in a stream
        if (result?.choices?.[0]?.message?.content) {
          const content = result.choices[0].message.content;
          const text = typeof content === 'string' ? content : String(content);
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
        lastError = error as Error;
        this.circuitBreaker.recordFailure(provider.name);
        console.warn(`[Orchestrator] ${provider.name} failed:`, error);
      }
    }

    // 5. All providers failed – return a fallback stream
    return this.fallbackStream(messages, lastError);
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

    // Provider‑specific adjustments
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

  private fallbackStream(messages: any[], error: Error | null): ReadableStream {
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
