import { NextResponse } from "next/server";
import { AgnesClient } from "@/lib/providers/agnes/client";
import { GroqClient } from "@/lib/providers/groq/client";
import { OpenRouterClient } from "@/lib/providers/openrouter/client";
import { ZhipuClient } from "@/lib/providers/zhipu/client";
import { validateEnv, getProviderStatus, hasAnyProvider } from "@/lib/env/validation";

export const dynamic = 'force-dynamic';

export async function GET() {
  const envStatus = validateEnv();
  const providerStatus = getProviderStatus();
  const atLeastOneProvider = hasAnyProvider();

  const statuses: Record<string, string> = {};
  let healthyCount = 0;

  // Only ping providers that have keys
  if (providerStatus.agnes) {
    try {
      const client = new AgnesClient();
      await client.chat({
        messages: [{ role: "user", content: "ping" }],
        model: "agnes-2.0-flash",
        temperature: 0.5,
        max_tokens: 1,
        stream: false,
      });
      statuses["agnes"] = "healthy";
      healthyCount++;
    } catch (e: any) {
      statuses["agnes"] = `unhealthy: ${e.message}`;
    }
  } else {
    statuses["agnes"] = "not configured (no API key)";
  }

  if (providerStatus.groq) {
    try {
      const client = new GroqClient();
      await client.chat({
        messages: [{ role: "user", content: "ping" }],
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        max_tokens: 1,
        stream: false,
      });
      statuses["groq"] = "healthy";
      healthyCount++;
    } catch (e: any) {
      statuses["groq"] = `unhealthy: ${e.message}`;
    }
  } else {
    statuses["groq"] = "not configured (no API key)";
  }

  if (providerStatus.openrouter) {
    try {
      const client = new OpenRouterClient();
      await client.chat({
        messages: [{ role: "user", content: "ping" }],
        model: "meta-llama/llama-3.2-3b-instruct:free",
        temperature: 0.5,
        max_tokens: 1,
        stream: false,
      });
      statuses["openrouter"] = "healthy";
      healthyCount++;
    } catch (e: any) {
      statuses["openrouter"] = `unhealthy: ${e.message}`;
    }
  } else {
    statuses["openrouter"] = "not configured (no API key)";
  }

  if (providerStatus.zhipu) {
    try {
      const client = new ZhipuClient();
      await client.webSearch({ search_query: "ping", count: 1 });
      statuses["zhipu"] = "healthy";
      healthyCount++;
    } catch (e: any) {
      statuses["zhipu"] = `unhealthy: ${e.message}`;
    }
  } else {
    statuses["zhipu"] = "not configured (no API key)";
  }

  // Overall status: 200 if at least one provider is healthy, otherwise 503
  const overallOk = healthyCount > 0;

  return NextResponse.json(
    {
      status: overallOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      environment: {
        valid: envStatus.valid,
        missing: envStatus.missing,
        hasAnyProvider: atLeastOneProvider,
        providers: providerStatus,
      },
      providerStatus: statuses,
      healthyCount,
      uptime: process.uptime(),
    },
    { status: overallOk ? 200 : 503 }
  );
}
