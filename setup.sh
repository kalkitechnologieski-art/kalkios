#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# SIDDHI AI – PRODUCTION READY FIX (502/503 Error Fix)
# ============================================================================
# Fixes:
# 1. Missing environment variable validation
# 2. 502/503 errors from providers
# 3. Stream route error handling
# 4. Agnes client timeout and error handling
# ============================================================================

ROOT_DIR="$(pwd)"
APP_DIR="${ROOT_DIR}/apps/web"
BACKUP_SUFFIX=".bak"
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
LOG_FILE="${ROOT_DIR}/production_ready_fix_${TIMESTAMP}.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Starting Production Ready Fix..."

if [ ! -d "$APP_DIR" ]; then
  log "ERROR: $APP_DIR does not exist."
  exit 1
fi

cd "$APP_DIR"

# -----------------------------------------------------------------------------
# 1. Create the environment validation module
# -----------------------------------------------------------------------------
log "Creating environment validation module..."
mkdir -p "${APP_DIR}/lib/env"
cat > "${APP_DIR}/lib/env/validation.ts" << 'ENV_EOF'
/**
 * Environment variable validation
 * Ensures all required keys are present before making API calls
 */

export interface EnvStatus {
  valid: boolean;
  missing: string[];
  present: string[];
}

const REQUIRED_KEYS = [
  "AGNES_API_KEY",
  "ZHIPU_API_KEY",
  "GROQ_API_KEY",
  "OPENROUTER_API_KEY",
];

const OPTIONAL_KEYS = [
  "REDIS_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

export function validateEnv(): EnvStatus {
  const missing: string[] = [];
  const present: string[] = [];

  for (const key of REQUIRED_KEYS) {
    if (process.env[key]) {
      present.push(key);
    } else {
      missing.push(key);
    }
  }

  for (const key of OPTIONAL_KEYS) {
    if (process.env[key]) {
      present.push(key);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
  };
}

export function getEnvStatusMessage(): string {
  const status = validateEnv();
  if (status.valid) {
    return `✅ All required environment variables are set. (${status.present.length} keys present)`;
  }
  return `❌ Missing environment variables: ${status.missing.join(", ")}`;
}

export function getProviderStatus(): Record<string, boolean> {
  return {
    agnes: !!process.env.AGNES_API_KEY,
    zhipu: !!process.env.ZHIPU_API_KEY,
    groq: !!process.env.GROQ_API_KEY,
    openrouter: !!process.env.OPENROUTER_API_KEY,
  };
}
ENV_EOF
log "Created environment validation module"

# -----------------------------------------------------------------------------
# 2. Update the stream route with validation and better error handling
# -----------------------------------------------------------------------------
log "Updating stream route..."
cat > "${APP_DIR}/app/api/ai/stream/route.ts" << 'STREAM_EOF'
import { NextRequest } from "next/server";
import { SiddhiAgent } from "@/lib/agents/siddhi-agent";
import { notifyAdmin } from "@/lib/security/audit";
import { validateEnv, getEnvStatusMessage } from "@/lib/env/validation";

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
      // Validate environment variables first
      const envStatus = validateEnv();
      if (!envStatus.valid) {
        console.error("[ADMIN] Environment validation failed:", envStatus.missing);
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          type: "error",
          message: "Server configuration error. Please contact support.",
          details: `Missing: ${envStatus.missing.join(", ")}`,
        })}\n\n`));
        await writer.close();
        return;
      }
      console.log("[DIAGNOSTIC] Environment validation passed");

      const body = await req.json();
      const { messages, userId } = body;

      if (!messages || !Array.isArray(messages)) {
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

      // Check if result is an async generator
      if (result && typeof result[Symbol.asyncIterator] === "function") {
        console.log("[DIAGNOSTIC] Result is an async generator, iterating...");
        let hasContent = false;
        for await (const chunk of result) {
          if (chunk.type === "content" && (!chunk.content || chunk.content === "")) {
            continue;
          }
          hasContent = true;
          await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        if (!hasContent) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: "I'm having trouble generating a response. Please try again." })}\n\n`));
        }
      } else if (result?.type === "questions") {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "questions", questions: result.questions })}\n\n`));
      } else if (result?.type === "setu_pending") {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "setu_pending", message: result.message, questions: result.questions })}\n\n`));
      } else if (result) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: result })}\n\n`));
      } else {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: "I couldn't process your request. Please try again." })}\n\n`));
      }

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
log "Updated stream route with environment validation"

# -----------------------------------------------------------------------------
# 3. Fix Agnes client with better error handling for 502/503
# -----------------------------------------------------------------------------
log "Fixing Agnes client with better error handling..."
cat > "${APP_DIR}/lib/providers/agnes/client.ts" << 'AGNES_EOF'
import { z } from "zod";

const AGNES_BASE = "https://apihub.agnes-ai.com/v1";

export const AgnesChatRequestSchema = z.object({
  model: z.enum(["agnes-2.0-flash", "agnes-2.5-flash", "agnes-2.5-pro"]).default("agnes-2.0-flash"),
  messages: z.array(
    z.object({
      role: z.enum(["system", "user", "assistant", "tool"]),
      content: z.string(),
    })
  ),
  temperature: z.number().min(0).max(2).default(0.7),
  max_tokens: z.number().positive().default(4096),
  stream: z.boolean().default(false),
  tools: z.array(z.any()).optional(),
  thinking: z.object({
    type: z.enum(["enabled", "disabled"]),
    budget_tokens: z.number().optional(),
  }).optional(),
});

export type AgnesChatRequest = z.infer<typeof AgnesChatRequestSchema>;

export class AgnesClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    const key = process.env.AGNES_API_KEY;
    if (!key) {
      console.warn("[DIAGNOSTIC] AGNES_API_KEY not set");
      // We'll allow the client to be created but will fail gracefully on calls
    }
    this.apiKey = key || "";
    this.baseUrl = AGNES_BASE;
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout = 30000
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  async chat(request: AgnesChatRequest): Promise<any> {
    if (!this.apiKey) {
      throw new Error("AGNES_API_KEY is not set");
    }
    const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      const text = await response.text();
      if (response.status === 502 || response.status === 503) {
        throw new Error(`Agnes service unavailable (${response.status}): please try again later`);
      }
      throw new Error(`Agnes chat error ${response.status}: ${text}`);
    }
    const data = await response.json();
    if (!data.choices?.[0]?.message?.content && !data.choices?.[0]?.message?.reasoning_content) {
      throw new Error("Agnes returned empty response");
    }
    return data;
  }

  async chatStream(request: AgnesChatRequest): Promise<ReadableStream | null> {
    if (!this.apiKey) {
      throw new Error("AGNES_API_KEY is not set");
    }
    const response = await this.fetchWithTimeout(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...request, stream: true }),
    });
    if (!response.ok) {
      const text = await response.text();
      if (response.status === 502 || response.status === 503) {
        throw new Error(`Agnes service unavailable (${response.status}): please try again later`);
      }
      throw new Error(`Agnes stream error ${response.status}: ${text}`);
    }
    return response.body;
  }

  async image(body: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error("AGNES_API_KEY is not set");
    }
    const response = await this.fetchWithTimeout(`${this.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      if (response.status === 502 || response.status === 503) {
        throw new Error(`Agnes image service unavailable (${response.status})`);
      }
      throw new Error(`Agnes image error ${response.status}: ${text}`);
    }
    return response.json();
  }

  async video(body: any): Promise<any> {
    if (!this.apiKey) {
      throw new Error("AGNES_API_KEY is not set");
    }
    const response = await this.fetchWithTimeout(`${this.baseUrl}/videos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const text = await response.text();
      if (response.status === 502 || response.status === 503) {
        throw new Error(`Agnes video service unavailable (${response.status})`);
      }
      throw new Error(`Agnes video error ${response.status}: ${text}`);
    }
    return response.json();
  }

  async videoStatus(videoId: string, modelName: string = "agnes-video-2.5-flash"): Promise<any> {
    if (!this.apiKey) {
      throw new Error("AGNES_API_KEY is not set");
    }
    const response = await this.fetchWithTimeout(
      `${this.baseUrl}/agnesapi?video_id=${videoId}&model_name=${modelName}`,
      {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      }
    );
    if (!response.ok) {
      const text = await response.text();
      if (response.status === 502 || response.status === 503) {
        throw new Error(`Agnes video status service unavailable (${response.status})`);
      }
      throw new Error(`Agnes video status error ${response.status}: ${text}`);
    }
    return response.json();
  }
}
AGNES_EOF
log "Fixed Agnes client"

# -----------------------------------------------------------------------------
# 4. Fix the health route to include environment validation
# -----------------------------------------------------------------------------
log "Updating health route..."
cat > "${APP_DIR}/app/api/health/route.ts" << 'HEALTH_EOF'
import { NextResponse } from "next/server";
import { AgnesClient } from "@/lib/providers/agnes/client";
import { GroqClient } from "@/lib/providers/groq/client";
import { OpenRouterClient } from "@/lib/providers/openrouter/client";
import { ZhipuClient } from "@/lib/providers/zhipu/client";
import { validateEnv, getEnvStatusMessage, getProviderStatus } from "@/lib/env/validation";

export const dynamic = 'force-dynamic';

export async function GET() {
  const envStatus = validateEnv();
  const providerStatus = getProviderStatus();

  const statuses: Record<string, string> = {};
  let allOk = true;

  // Only ping providers that have keys
  const providers = [];

  if (providerStatus.agnes) {
    providers.push({
      name: "agnes",
      ping: async () => {
        const client = new AgnesClient();
        await client.chat({
          messages: [{ role: "user", content: "ping" }],
          model: "agnes-2.0-flash",
          temperature: 0.5,
          max_tokens: 1,
          stream: false,
        });
      },
    });
  } else {
    statuses["agnes"] = "not configured (no API key)";
  }

  if (providerStatus.groq) {
    providers.push({
      name: "groq",
      ping: async () => {
        const client = new GroqClient();
        await client.chat({
          messages: [{ role: "user", content: "ping" }],
          model: "llama-3.3-70b-versatile",
          temperature: 0.5,
          max_tokens: 1,
          stream: false,
        });
      },
    });
  } else {
    statuses["groq"] = "not configured (no API key)";
  }

  if (providerStatus.openrouter) {
    providers.push({
      name: "openrouter",
      ping: async () => {
        const client = new OpenRouterClient();
        await client.chat({
          messages: [{ role: "user", content: "ping" }],
          model: "meta-llama/llama-3.2-3b-instruct:free",
          temperature: 0.5,
          max_tokens: 1,
          stream: false,
        });
      },
    });
  } else {
    statuses["openrouter"] = "not configured (no API key)";
  }

  if (providerStatus.zhipu) {
    providers.push({
      name: "zhipu",
      ping: async () => {
        const client = new ZhipuClient();
        await client.webSearch({ search_query: "ping", count: 1 });
      },
    });
  } else {
    statuses["zhipu"] = "not configured (no API key)";
  }

  for (const p of providers) {
    try {
      await p.ping();
      statuses[p.name] = "healthy";
    } catch (e: any) {
      statuses[p.name] = `unhealthy: ${e.message}`;
      allOk = false;
    }
  }

  return NextResponse.json(
    {
      status: allOk && envStatus.valid ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      environment: {
        valid: envStatus.valid,
        message: getEnvStatusMessage(),
        providers: providerStatus,
      },
      providers: statuses,
      uptime: process.uptime(),
    },
    { status: allOk && envStatus.valid ? 200 : 503 }
  );
}
HEALTH_EOF
log "Updated health route"

# -----------------------------------------------------------------------------
# 5. Run type-check and build
# -----------------------------------------------------------------------------
log "Running TypeScript type check..."
if npm run type-check; then
  log "Type check passed."
else
  log "Type check failed. Please review errors."
  exit 1
fi

log "Building project..."
npm run build || { log "Build failed."; exit 1; }

log "============================================================="
log "Production Ready Fix complete!"
log "Key changes:"
echo "  1. Created environment validation module (lib/env/validation.ts)"
echo "  2. Stream route now validates env vars before processing"
echo "  3. Agnes client handles 502/503 errors gracefully"
echo "  4. Health route shows provider status"
log "Log file: $LOG_FILE"
log "============================================================="

exit 0