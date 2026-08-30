import { NextResponse } from "next/server";
import { AgnesClient } from "@/lib/providers/agnes/client";
import { GroqClient } from "@/lib/providers/groq/client";
import { OpenRouterClient } from "@/lib/providers/openrouter/client";
import { ZhipuClient } from "@/lib/providers/zhipu/client";

export async function GET() {
  const statuses: Record<string, string> = {};
  let allOk = true;

  const providers = [
    {
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
    },
    {
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
    },
    {
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
    },
    {
      name: "zhipu",
      ping: async () => {
        const client = new ZhipuClient();
        await client.webSearch({ search_query: "ping", count: 1 });
      },
    },
  ];

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
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      providers: statuses,
      uptime: process.uptime(),
    },
    { status: allOk ? 200 : 503 }
  );
}
