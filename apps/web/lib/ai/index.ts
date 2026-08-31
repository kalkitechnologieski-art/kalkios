import { IntelligentRouter } from '@/lib/orchestration/router';
import { ChatMessage, ChatOptions, ChatResponse } from './types';
import { ensureString } from '@/lib/utils/string';

let routerInstance: IntelligentRouter | null = null;

function getRouter(): IntelligentRouter {
  if (!routerInstance) {
    routerInstance = new IntelligentRouter();
  }
  return routerInstance;
}

export async function chat(
  messages: ChatMessage[],
  options: ChatOptions & { sessionId?: string } = {}
): Promise<ChatResponse> {
  const router = getRouter();
  const result = await router.route({
    messages,
    stream: options.stream || false,
    deep: options.deep || false,
    userId: options.sessionId,
    sessionId: options.sessionId,
  });

  if (result instanceof ReadableStream) {
    return {
      content: 'Streaming response (use /api/ai/stream for SSE)',
      tokens: 0,
      provider: 'stream',
    };
  }

  return {
    content: ensureString(result?.choices?.[0]?.message?.content || 'No response.'),
    reasoning: result?.choices?.[0]?.message?.reasoning_content,
    tokens: result?.usage?.total_tokens || 0,
    provider: result?.provider || 'unknown',
  };
}

// ─── Re-export from individual modules ──────────────────────────────────
export { generateImage, generateVideo } from './agnes';
export { webSearch, generateLeads } from './zhipu';

// ─── Re-export types ──────────────────────────────────────────────────────
export * from './types';
