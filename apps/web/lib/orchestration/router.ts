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
