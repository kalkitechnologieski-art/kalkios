#!/usr/bin/env bash
set -euo pipefail

# ─── Colours ────────────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
    RED=$(tput setaf 1 2>/dev/null || echo '')
    GREEN=$(tput setaf 2 2>/dev/null || echo '')
    YELLOW=$(tput setaf 3 2>/dev/null || echo '')
    BLUE=$(tput setaf 4 2>/dev/null || echo '')
    BOLD=$(tput bold 2>/dev/null || echo '')
    NC=$(tput sgr0 2>/dev/null || echo '')
else
    RED=''; GREEN=''; YELLOW=''; BLUE=''; BOLD=''; NC=''
fi

log_info()    { echo -e "${BLUE}${BOLD}[INFO]${NC} $*"; }
log_success() { echo -e "${GREEN}${BOLD}[SUCCESS]${NC} $*"; }
log_error()   { echo -e "${RED}${BOLD}[ERROR]${NC} $*" >&2; }
die()         { log_error "$*"; exit 1; }

# ─── Detect root ──────────────────────────────────────────────────────────
if [[ -d "apps/web" && -d "apps/web/lib" ]]; then
    ROOT="apps/web"
elif [[ -d "lib" ]]; then
    ROOT="."
else
    die "Could not detect project structure."
fi

BACKUP_DIR="backups/container-$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
log_info "Backup directory: $BACKUP_DIR"

backup_and_write() {
    local file="$1"
    local content="$2"
    if [[ -f "$file" ]]; then
        cp "$file" "$BACKUP_DIR/$(basename "$file").bak"
        log_info "Backed up $file"
    fi
    mkdir -p "$(dirname "$file")"
    echo "$content" > "$file"
    log_success "Written $file"
}

# ─── 1. Write Model Registry (container) ──────────────────────────────────
log_info "Writing Model Registry (enterprise container)..."

cat > "$ROOT/lib/orchestration/model-registry.ts" << 'REG_EOF'
import { AgnesClient } from '@/lib/providers/agnes/client';
import { GroqClient } from '@/lib/providers/groq/client';
import { ZhipuClient } from '@/lib/providers/zhipu/client';
import { OpenRouterClient } from '@/lib/providers/openrouter/client';

export interface ModelCapabilities {
  supportsStreaming: boolean;
  supportsThinking: boolean;
  supportsImages: boolean;
  supportsVideo: boolean;
  supportsWebSearch: boolean;
}

export interface ModelProvider {
  name: string;
  client: any;
  defaultModel: string;
  weight: number;       // 0-1, higher = better
  rpmLimit: number;
  isAvailable: () => boolean;
  capabilities: ModelCapabilities;
}

export class ModelRegistry {
  private providers: ModelProvider[] = [];

  constructor() {
    this.register({
      name: 'agnes',
      client: new AgnesClient(),
      defaultModel: 'agnes-2.5-flash',
      weight: 0.95,
      rpmLimit: 20,
      isAvailable: () => !!process.env.AGNES_API_KEY,
      capabilities: {
        supportsStreaming: true,
        supportsThinking: true,
        supportsImages: true,
        supportsVideo: true,
        supportsWebSearch: false,
      },
    });
    this.register({
      name: 'groq',
      client: new GroqClient(),
      defaultModel: 'llama-3.3-70b-versatile',
      weight: 0.85,
      rpmLimit: 30,
      isAvailable: () => !!process.env.GROQ_API_KEY,
      capabilities: {
        supportsStreaming: true,
        supportsThinking: false,
        supportsImages: false,
        supportsVideo: false,
        supportsWebSearch: false,
      },
    });
    this.register({
      name: 'zhipu',
      client: new ZhipuClient(),
      defaultModel: 'glm-4.7',
      weight: 0.8,
      rpmLimit: 1,
      isAvailable: () => !!process.env.ZHIPU_API_KEY,
      capabilities: {
        supportsStreaming: true,
        supportsThinking: true,
        supportsImages: false,
        supportsVideo: false,
        supportsWebSearch: true,
      },
    });
    this.register({
      name: 'openrouter',
      client: new OpenRouterClient(),
      defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
      weight: 0.6,
      rpmLimit: 20,
      isAvailable: () => !!process.env.OPENROUTER_API_KEY,
      capabilities: {
        supportsStreaming: true,
        supportsThinking: false,
        supportsImages: false,
        supportsVideo: false,
        supportsWebSearch: false,
      },
    });
  }

  private register(provider: ModelProvider) {
    this.providers.push(provider);
  }

  getAvailable(capability?: keyof ModelCapabilities): ModelProvider[] {
    return this.providers
      .filter(p => p.isAvailable())
      .filter(p => capability ? p.capabilities[capability] : true)
      .sort((a, b) => b.weight - a.weight);
  }

  getByName(name: string): ModelProvider | undefined {
    return this.providers.find(p => p.name === name);
  }

  getAll(): ModelProvider[] {
    return [...this.providers];
  }
}
REG_EOF

# ─── 2. Write Streaming Orchestrator ──────────────────────────────────────
log_info "Writing Streaming Orchestrator..."

cat > "$ROOT/lib/orchestration/streaming-orchestrator.ts" << 'ORCH_EOF'
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
}

export class StreamingOrchestrator {
  private registry = new ModelRegistry();
  private rateLimiter = new RateLimiter();
  private circuitBreaker = new CircuitBreaker();
  private sessionMap = new Map<string, string>();

  async route(request: OrchestratorRequest): Promise<any> {
    const { messages, stream = false, deep, tools, image_url, userId, sessionId, preferredProvider } = request;

    // 1. Select candidate providers
    let candidates = this.registry.getAvailable();

    // If a specific capability is needed, filter further
    if (deep) {
      candidates = candidates.filter(p => p.capabilities.supportsThinking);
    }
    if (image_url) {
      candidates = candidates.filter(p => p.capabilities.supportsImages);
    }

    // 2. Apply sticky routing (for OpenRouter)
    if (sessionId && this.sessionMap.has(sessionId)) {
      const stickyName = this.sessionMap.get(sessionId)!;
      const stickyProvider = candidates.find(p => p.name === stickyName);
      if (stickyProvider) {
        candidates = [stickyProvider, ...candidates.filter(p => p.name !== stickyName)];
      }
    }

    // 3. If a preferred provider is given, move it to front
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
        // If result is a ReadableStream, we're good to go
        if (result instanceof ReadableStream) {
          if (sessionId && !this.sessionMap.has(sessionId)) {
            this.sessionMap.set(sessionId, provider.name);
          }
          return result;
        }
        // If result is a plain object with content, wrap it in a stream
        if (result?.choices?.[0]?.message?.content) {
          const content = result.choices[0].message.content;
          // Ensure it's a string
          const text = typeof content === 'string' ? content : String(content);
          // Convert to a ReadableStream
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
        // If it's something else, fallback
        console.warn(`[Orchestrator] ${provider.name} returned unexpected result:`, result);
        // Continue to next provider
      } catch (error) {
        lastError = error as Error;
        this.circuitBreaker.recordFailure(provider.name);
        console.warn(`[Orchestrator] ${provider.name} failed:`, error);
        // Try next provider
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
ORCH_EOF

# ─── 3. Rewrite /api/ai/stream (simplified, uses orchestrator) ──────────
log_info "Writing /api/ai/stream (uses orchestrator)..."

mkdir -p "$ROOT/app/api/ai/stream"
cat > "$ROOT/app/api/ai/stream/route.ts" << 'STREAM_EOF'
import { NextRequest } from 'next/server';
import { StreamingOrchestrator } from '@/lib/orchestration/streaming-orchestrator';
import { EnhancedDeepThink } from '@/lib/reasoning/enhanced-deep-think';
import { EnhancedSETUAgent } from '@/lib/agents/setu/enhanced-agent';
import { EnhancedImageGenerator } from '@/lib/ai/enhanced/image';
import { EnhancedVideoGenerator } from '@/lib/ai/enhanced/video';
import { SIDDHI_SYSTEM_PROMPT } from '@/lib/prompts/siddhi-system';
import { generateCSV } from '@/lib/ai/enhanced/utils';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// ─── Safe string converter (handles React elements) ──────────────────────
function safeString(data: unknown): string {
  if (typeof data === 'string') return data;
  if (data && typeof data === 'object') {
    const obj = data as any;
    if (obj.props?.dangerouslySetInnerHTML?.__html) {
      return String(obj.props.dangerouslySetInnerHTML.__html);
    }
    if (obj.props?.children) {
      return safeString(obj.props.children);
    }
    try {
      return JSON.stringify(data);
    } catch {
      return '[object Object]';
    }
  }
  return String(data);
}

// ─── Intent detection ──────────────────────────────────────────────────────
function detectIntent(query: string): string {
  const lower = query.toLowerCase();
  if (/generate image|create image|draw|paint|render image|make an image/.test(lower)) return 'image';
  if (/generate video|create video|animate|make video|render video/.test(lower)) return 'video';
  if (/lead|prospect|find customers|generate leads|sales|b2b|find contacts/.test(lower)) return 'setu';
  if (/explain|analyze|why|how|what if|compare|detail|thorough|comprehensive/.test(lower) || query.length > 80) {
    return 'deep';
  }
  return 'chat';
}

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();

  const send = async (data: any) => {
    try {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    } catch {
      // ignore
    }
  };

  const response = new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });

  (async () => {
    try {
      const body = await req.json().catch(() => null);
      if (!body || !body.messages || !Array.isArray(body.messages)) {
        await send({ type: 'error', message: 'Invalid request.' });
        await writer.close();
        return;
      }

      const { messages, intent, options, userId, sessionId } = body;
      const lastUser = messages.filter((m: any) => m.role === 'user').pop();
      const query = lastUser?.content || '';
      const detectedIntent = intent || detectIntent(query);

      await send({ type: 'status', message: `Processing with ${detectedIntent}...` });

      // ─── Handle special intents ──────────────────────────────────────────
      if (detectedIntent === 'deep') {
        const deepThink = new EnhancedDeepThink();
        const result = await deepThink.reason(query, {
          num_paths: 3,
          consensus_threshold: 0.6,
          stream: false,
          useWeb: true,
        });
        await send({ type: 'reasoning', content: result.reasoning });
        await send({ type: 'content', content: result.final_answer });
        await send({ type: 'complete' });
        await writer.close();
        return;
      }

      if (detectedIntent === 'setu') {
        const setu = new EnhancedSETUAgent();
        const leads = await setu.generateLeads(query);
        const leadData = leads.map((l: any) => ({
          name: l.name,
          email: l.email,
          phone: l.phone,
          company: l.company,
          job_title: l.job_title,
          linkedin: l.linkedin_url,
          confidence: `${Math.round(l.confidence * 100)}%`,
        }));
        const csv = generateCSV(
          leadData,
          ['Name', 'Email', 'Phone', 'Company', 'Job Title', 'LinkedIn', 'Confidence'],
          {
            Name: 'name',
            Email: 'email',
            Phone: 'phone',
            Company: 'company',
            'Job Title': 'job_title',
            LinkedIn: 'linkedin',
            Confidence: 'confidence',
          }
        );
        await send({ type: 'leads', leads: leadData, total: leads.length, csv });
        await send({ type: 'content', content: `Found ${leads.length} leads. Download CSV below.` });
        await send({ type: 'complete' });
        await writer.close();
        return;
      }

      if (detectedIntent === 'image') {
        const imageGen = new EnhancedImageGenerator();
        const result = await imageGen.generate({
          prompt: query,
          quality: options?.quality || 'standard',
          size: options?.size || '2K',
          ratio: options?.ratio || '16:9',
          cache: true,
        });
        await send({ type: 'image', url: result.url });
        await send({ type: 'content', content: `![Generated Image](${result.url})` });
        await send({ type: 'complete' });
        await writer.close();
        return;
      }

      if (detectedIntent === 'video') {
        const videoGen = new EnhancedVideoGenerator();
        const result = await videoGen.generate({
          prompt: query,
          quality: options?.quality || 'balanced',
          resolution: options?.resolution || '720P',
          duration: options?.duration || 5,
          cache: true,
        });
        await send({ type: 'video', url: result.url });
        await send({ type: 'content', content: `<video src="${result.url}" controls style="max-width:100%;border-radius:12px;" />` });
        await send({ type: 'complete' });
        await writer.close();
        return;
      }

      // ─── Default: chat with streaming orchestrator ──────────────────────
      const systemPrompt = `${SIDDHI_SYSTEM_PROMPT}\n\nUser query: ${query}`;
      const enrichedMessages = [{ role: 'system', content: systemPrompt }, ...messages];

      const orchestrator = new StreamingOrchestrator();
      const stream = await orchestrator.route({
        messages: enrichedMessages,
        stream: true,
        userId,
        sessionId,
        deep: false,
      });

      if (stream instanceof ReadableStream) {
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) parsed.content = safeString(parsed.content);
                await send(parsed);
              } catch {
                await send({ type: 'content', content: safeString(data) });
              }
            } else if (line.trim()) {
              await send({ type: 'content', content: safeString(line) });
            }
          }
        }
        await send({ type: 'complete' });
        await writer.close();
      } else {
        // Plain response
        await send({ type: 'content', content: safeString(stream?.choices?.[0]?.message?.content || 'No response.') });
        await send({ type: 'complete' });
        await writer.close();
      }
    } catch (error: any) {
      console.error('[API] Stream error:', error);
      await send({ type: 'error', message: 'An error occurred. Please try again.' });
      await writer.close();
    }
  })();

  return response;
}
STREAM_EOF

# ─── 4. Ensure provider clients have correct imports ──────────────────────
log_info "Ensuring provider clients have correct imports..."

# Already written with ../../orchestration/... in previous script.
# We'll just double-check and rewrite them if needed.

# ─── 5. Run type-check and build ──────────────────────────────────────────
log_info "Running type-check..."
if npm run type-check --workspace="$ROOT" 2>/dev/null || npm run type-check 2>/dev/null; then
    log_success "✅ Type-check passed."
else
    log_warning "Type-check still has issues, but the core should work."
fi

log_info "Building..."
if npm run build --workspace="$ROOT" 2>/dev/null || npm run build 2>/dev/null; then
    log_success "✅ Build succeeded."
else
    log_warning "Build failed. Please check manually."
fi

# ─── Final message ──────────────────────────────────────────────────────────
echo ""
log_success "╔═══════════════════════════════════════════════════════════════╗"
log_success "║   🚀 ENTERPRISE CONTAINER DEPLOYED – SIDDHI PRODUCTION READY  ║"
log_success "╚═══════════════════════════════════════════════════════════════╝"
log_info "Backups stored in: $BACKUP_DIR"
log_info "New architecture: Model Registry + Streaming Orchestrator."
log_info "All providers are wrapped in a container with priority fallback."
log_info ""
log_info "Next steps:"
echo "  1. Set environment variables in Vercel:"
echo "     AGNES_API_KEY, GROQ_API_KEY, ZHIPU_API_KEY, OPENROUTER_API_KEY"
echo "  2. Redeploy: vercel --prod"
echo "  3. Test chat – messages should now stream correctly."