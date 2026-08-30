#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# SIDDHI AI – DIAGNOSTIC FIX
# ============================================================================
# Adds comprehensive logging and fallback responses to diagnose empty replies.
# ============================================================================

ROOT_DIR="$(pwd)"
APP_DIR="${ROOT_DIR}/apps/web"
BACKUP_SUFFIX=".bak"
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
LOG_FILE="${ROOT_DIR}/diagnostic_fix_${TIMESTAMP}.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Starting diagnostic fix..."

if [ ! -d "$APP_DIR" ]; then
  log "ERROR: $APP_DIR does not exist."
  exit 1
fi

cd "$APP_DIR"

# -----------------------------------------------------------------------------
# 1. Add a debug logging stream route
# -----------------------------------------------------------------------------
log "Adding diagnostic logging to stream route..."
cat > "${APP_DIR}/app/api/ai/stream/route.ts" << 'STREAM_EOF'
import { NextRequest } from "next/server";
import { SiddhiAgent } from "@/lib/agents/siddhi-agent";
import { notifyAdmin } from "@/lib/security/audit";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();

  const response = new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });

  // Start async work
  (async () => {
    try {
      const body = await req.json();
      const { messages, userId } = body;

      console.log("[DIAGNOSTIC] Received messages:", JSON.stringify(messages, null, 2));

      if (!messages || !Array.isArray(messages)) {
        console.log("[DIAGNOSTIC] Invalid messages, sending error");
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Invalid request: messages array required." })}\n\n`));
        await writer.close();
        return;
      }

      // Send a ping to indicate the stream is alive
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Connecting to Siddhi..." })}\n\n`));

      console.log("[DIAGNOSTIC] Creating SiddhiAgent...");
      const agent = new SiddhiAgent();
      
      console.log("[DIAGNOSTIC] Processing request...");
      const result = await agent.process({ messages, userId, stream: true });
      
      console.log("[DIAGNOSTIC] Result type:", typeof result);
      console.log("[DIAGNOSTIC] Result keys:", result ? Object.keys(result) : "null");
      console.log("[DIAGNOSTIC] Result sample:", JSON.stringify(result).slice(0, 200));

      // Check if result is an async generator
      if (result && typeof result[Symbol.asyncIterator] === "function") {
        console.log("[DIAGNOSTIC] Result is an async generator, iterating...");
        let hasContent = false;
        for await (const chunk of result) {
          console.log("[DIAGNOSTIC] Chunk:", JSON.stringify(chunk).slice(0, 200));
          if (chunk.type === "content" && (!chunk.content || chunk.content === "")) {
            console.log("[DIAGNOSTIC] Skipping empty content chunk");
            continue;
          }
          hasContent = true;
          await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        if (!hasContent) {
          console.log("[DIAGNOSTIC] No content chunks received, sending fallback");
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: "I'm having trouble generating a response. Please try again." })}\n\n`));
        }
      } else if (result?.type === "questions") {
        console.log("[DIAGNOSTIC] Sending questions");
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "questions", questions: result.questions })}\n\n`));
      } else if (result?.type === "setu_pending") {
        console.log("[DIAGNOSTIC] Sending SETU pending");
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "setu_pending", message: result.message, questions: result.questions })}\n\n`));
      } else if (result) {
        console.log("[DIAGNOSTIC] Sending direct content");
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: result })}\n\n`));
      } else {
        console.log("[DIAGNOSTIC] No result at all, sending fallback");
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: "I couldn't process your request. Please try again." })}\n\n`));
      }

      console.log("[DIAGNOSTIC] Sending complete");
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`));
      await writer.close();

    } catch (error: any) {
      console.error("[DIAGNOSTIC] Stream error:", error);
      notifyAdmin(error, { url: req.url });
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          type: "error",
          message: "I encountered an issue. Please try again or contact support if the problem persists.",
        })}\n\n`));
        await writer.close();
      } catch (_) {}
    }
  })();

  return response;
}
STREAM_EOF
log "Updated stream route with diagnostic logging"

# -----------------------------------------------------------------------------
# 2. Add diagnostic logging to SiddhiAgent
# -----------------------------------------------------------------------------
log "Adding diagnostic logging to SiddhiAgent..."
cat > "${APP_DIR}/lib/agents/siddhi-agent.ts" << 'SIDDHI_EOF'
import { IntelligentRouter } from "@/lib/orchestration/router";
import { ChainOfThought } from "@/lib/reasoning/chain-of-thought";
import { SETUAgent } from "./setu/agent";
import { SIDDHI_SYSTEM_PROMPT } from "@/lib/prompts/siddhi-system";

type Intent = "general" | "deep_think" | "web_search" | "generate_image" | "generate_video" | "run_setu";

export class SiddhiAgent {
  private router: IntelligentRouter;
  private cot: ChainOfThought;

  constructor() {
    console.log("[DIAGNOSTIC] SiddhiAgent constructor called");
    this.router = new IntelligentRouter();
    this.cot = new ChainOfThought();
  }

  async process(request: { messages: any[]; userId?: string; stream?: boolean }) {
    const { messages, userId, stream = true } = request;
    const lastMessage = messages[messages.length - 1]?.content || "";
    console.log("[DIAGNOSTIC] SiddhiAgent.process called with lastMessage:", lastMessage);

    const intent = this.detectIntent(lastMessage);
    console.log("[DIAGNOSTIC] Detected intent:", intent);

    try {
      let result: any;

      if (intent === "deep_think") {
        console.log("[DIAGNOSTIC] Handling deep_think");
        result = await this.handleDeepThink(lastMessage, stream);
      } else if (intent === "web_search") {
        console.log("[DIAGNOSTIC] Handling web_search");
        result = await this.handleWebSearch(lastMessage, stream);
      } else if (intent === "run_setu") {
        console.log("[DIAGNOSTIC] Handling run_setu");
        result = await this.handleSETU(lastMessage, stream);
      } else if (intent === "generate_image") {
        console.log("[DIAGNOSTIC] Handling generate_image");
        result = await this.handleImageGeneration(lastMessage, stream);
      } else if (intent === "generate_video") {
        console.log("[DIAGNOSTIC] Handling generate_video");
        result = await this.handleVideoGeneration(lastMessage, stream);
      } else {
        console.log("[DIAGNOSTIC] Handling general chat");
        const enhancedMessages = [{ role: "system", content: SIDDHI_SYSTEM_PROMPT }, ...messages];
        result = await this.router.route({
          messages: enhancedMessages,
          stream,
          userId,
          tools: [
            {
              type: "function",
              function: {
                name: "web_search",
                description: "Search the web for real-time information.",
                parameters: {
                  type: "object",
                  properties: {
                    query: { type: "string", description: "The search query." },
                  },
                  required: ["query"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "generate_image",
                description: "Generate an image from a text prompt.",
                parameters: {
                  type: "object",
                  properties: {
                    prompt: { type: "string", description: "The image description." },
                    size: { type: "string", enum: ["1K", "2K", "3K", "4K"] },
                    ratio: { type: "string", enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9"] },
                  },
                  required: ["prompt"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "generate_video",
                description: "Generate a short video from a text prompt.",
                parameters: {
                  type: "object",
                  properties: {
                    prompt: { type: "string", description: "The video description." },
                    duration: { type: "string", enum: ["5", "10"] },
                    resolution: { type: "string", enum: ["720P", "1080P", "4K"] },
                  },
                  required: ["prompt"],
                },
              },
            },
            {
              type: "function",
              function: {
                name: "run_setu",
                description: "Find business leads based on criteria.",
                parameters: {
                  type: "object",
                  properties: {
                    query: { type: "string", description: "The lead search query." },
                    count: { type: "number", description: "Number of leads to find." },
                  },
                  required: ["query"],
                },
              },
            },
          ],
        });
      }

      console.log("[DIAGNOSTIC] Result from handler:", result ? typeof result : "null");
      if (result && typeof result === "object" && result.then) {
        console.log("[DIAGNOSTIC] Result is a Promise, waiting...");
        result = await result;
        console.log("[DIAGNOSTIC] Result after await:", result ? typeof result : "null");
      }

      // If result is still null/undefined, return a fallback
      if (!result) {
        console.log("[DIAGNOSTIC] Result is null/undefined, returning fallback");
        return {
          type: "content",
          content: "I'm having trouble processing your request. Please try again later.",
        };
      }

      return result;
    } catch (error) {
      console.error("[DIAGNOSTIC] SiddhiAgent error:", error);
      return {
        type: "content",
        content: "I'm having trouble processing your request. Please try again later.",
      };
    }
  }

  private detectIntent(query: string): Intent {
    const lower = query.toLowerCase();

    if (lower.includes("generate image") || lower.includes("create image") || lower.includes("draw")) return "generate_image";
    if (lower.includes("generate video") || lower.includes("create video") || lower.includes("animate")) return "generate_video";
    if (lower.includes("lead") || lower.includes("prospect") || lower.includes("find customers")) return "run_setu";
    if (lower.includes("search") || lower.includes("find") || lower.includes("latest news")) return "web_search";
    if (
      lower.includes("explain") ||
      lower.includes("analyze") ||
      lower.includes("why") ||
      lower.includes("how") ||
      lower.length > 30
    ) {
      return "deep_think";
    }
    return "general";
  }

  private async handleDeepThink(query: string, stream: boolean) {
    return this.cot.generate(query, { stream, deep: true });
  }

  private async handleWebSearch(query: string, stream: boolean) {
    return this.cot.generate(query, { stream, deep: false });
  }

  private async handleSETU(query: string, stream: boolean) {
    const agent = new SETUAgent(query);
    const questions = await agent.generateQuestions();
    if (questions.length > 0) {
      return {
        type: "questions",
        questions,
        stream: false,
      };
    }
    return {
      type: "setu_pending",
      message: "Please answer the clarifying questions.",
      questions,
      stream: false,
    };
  }

  private async handleImageGeneration(query: string, stream: boolean) {
    return this.router.route({
      messages: [{ role: "user", content: `Generate image: ${query}` }],
      stream,
    });
  }

  private async handleVideoGeneration(query: string, stream: boolean) {
    return this.router.route({
      messages: [{ role: "user", content: `Generate video: ${query}` }],
      stream,
    });
  }
}
SIDDHI_EOF
log "Updated SiddhiAgent with diagnostic logging"

# -----------------------------------------------------------------------------
# 3. Add diagnostic logging to router
# -----------------------------------------------------------------------------
log "Adding diagnostic logging to router..."
cat > "${APP_DIR}/lib/orchestration/router.ts" << 'ROUTER_EOF'
import { AgnesClient } from "@/lib/providers/agnes/client";
import { GroqClient } from "@/lib/providers/groq/client";
import { OpenRouterClient } from "@/lib/providers/openrouter/client";
import { ZhipuClient } from "@/lib/providers/zhipu/client";
import { RateLimiter } from "./rate-limiter";
import { CircuitBreaker } from "./circuit-breaker";
import { withRetry } from "./retry";
import { auditLog } from "@/lib/security/audit";

type Provider = "agnes" | "groq" | "openrouter" | "zhipu";

interface RouteRequest {
  messages: any[];
  stream?: boolean;
  deep?: boolean;
  tools?: any[];
  image_url?: string;
  provider?: Provider;
  userId?: string;
}

export class IntelligentRouter {
  private agnes: AgnesClient;
  private groq: GroqClient;
  private openrouter: OpenRouterClient;
  private zhipu: ZhipuClient;
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;
  private providerOrder: Provider[];
  private clients: Record<Provider, any>;

  constructor() {
    console.log("[DIAGNOSTIC] IntelligentRouter constructor");
    try {
      this.agnes = new AgnesClient();
      console.log("[DIAGNOSTIC] Agnes client initialized");
      this.groq = new GroqClient();
      console.log("[DIAGNOSTIC] Groq client initialized");
      this.openrouter = new OpenRouterClient();
      console.log("[DIAGNOSTIC] OpenRouter client initialized");
      this.zhipu = new ZhipuClient();
      console.log("[DIAGNOSTIC] Zhipu client initialized");
    } catch (error: any) {
      console.error("[DIAGNOSTIC] Router constructor error:", error.message);
      throw error;
    }
    this.rateLimiter = new RateLimiter();
    this.circuitBreaker = new CircuitBreaker();
    this.providerOrder = ["agnes", "groq", "openrouter", "zhipu"];
    this.clients = {
      agnes: this.agnes,
      groq: this.groq,
      openrouter: this.openrouter,
      zhipu: this.zhipu,
    };
  }

  async route(request: RouteRequest): Promise<any> {
    console.log("[DIAGNOSTIC] Router.route called");
    const { messages, stream = false, deep, tools, image_url, provider: preferred, userId } = request;

    let providers: Provider[];
    if (preferred) {
      providers = [preferred, ...this.providerOrder.filter((p) => p !== preferred)];
    } else {
      providers = this.providerOrder;
    }
    console.log("[DIAGNOSTIC] Provider order:", providers);

    let lastError: Error | null = null;

    for (const provider of providers) {
      console.log("[DIAGNOSTIC] Trying provider:", provider);
      if (this.circuitBreaker.isOpen(provider)) {
        console.log("[DIAGNOSTIC] Circuit open for provider:", provider);
        continue;
      }
      if (!(await this.rateLimiter.check(provider))) {
        console.log("[DIAGNOSTIC] Rate limited for provider:", provider);
        continue;
      }

      try {
        console.log("[DIAGNOSTIC] Calling provider:", provider);
        const result = await withRetry(
          () => this.callProvider(provider, request),
          provider,
          this.circuitBreaker
        );
        console.log("[DIAGNOSTIC] Provider succeeded:", provider);
        await auditLog(userId, "ai_chat_success", provider, result);
        return result;
      } catch (error) {
        const err = error as Error;
        lastError = err;
        console.log("[DIAGNOSTIC] Provider failed:", provider, err.message);
        await auditLog(userId, "ai_chat_failure", provider, { error: err.message });
      }
    }

    console.log("[DIAGNOSTIC] All providers failed, returning fallback");
    return this.fallbackResponse(messages, lastError, userId);
  }

  private async callProvider(provider: Provider, request: RouteRequest): Promise<any> {
    const { messages, stream, deep, tools, image_url } = request;

    const body: any = {
      messages,
      temperature: 0.7,
      max_tokens: 4096,
      stream: stream || false,
    };

    if (tools) body.tools = tools;

    const client = this.clients[provider];

    switch (provider) {
      case "agnes":
        body.model = "agnes-2.0-flash";
        if (deep) body.thinking = { type: "enabled", budget_tokens: 4096 };
        if (stream) {
          const agnesStream = await client.chatStream(body);
          if (!agnesStream) throw new Error("Agnes stream returned null");
          return agnesStream;
        }
        return client.chat(body);

      case "groq":
        body.model = "llama-3.3-70b-versatile";
        if (stream) {
          const groqStream = await client.chatStream(body);
          if (!groqStream) throw new Error("Groq stream returned null");
          return groqStream;
        }
        return client.chat(body);

      case "openrouter":
        body.model = "meta-llama/llama-3.2-3b-instruct:free";
        if (stream) {
          const orStream = await client.chatStream(body);
          if (!orStream) throw new Error("OpenRouter stream returned null");
          return orStream;
        }
        return client.chat(body);

      case "zhipu":
        body.model = "glm-5.3";
        if (deep) {
          body.thinking = { type: "enabled", clear_thinking: false };
          body.reasoning_effort = "max";
        }
        if (stream) {
          return client.chat(body);
        }
        return client.chat(body);

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  private fallbackResponse(messages: any[], error: Error | null, userId?: string): any {
    const content =
      "I'm having trouble connecting right now. Please try again in a moment. If the issue persists, our team has been notified.";
    if (error) {
      console.error(`All providers failed for user ${userId}:`, error);
    }
    return {
      choices: [{ message: { content } }],
      usage: { total_tokens: 0 },
      provider: "fallback",
    };
  }
}
ROUTER_EOF
log "Updated router with diagnostic logging"

# -----------------------------------------------------------------------------
# 4. Run type-check and build
# -----------------------------------------------------------------------------
log "Running TypeScript type check..."
npm run type-check || { log "Type check failed."; exit 1; }

log "Building project..."
npm run build || { log "Build failed."; exit 1; }

log "============================================================="
log "Diagnostic fix complete. Build passed."
log "The stream route now logs extensively to the Vercel console."
log "Check the function logs in Vercel to see the diagnostic output."
log "Log file: $LOG_FILE"
log "============================================================="

exit 0