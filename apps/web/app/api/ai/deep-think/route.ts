import { NextRequest, NextResponse } from "next/server";
import { ChainOfThought } from "@/lib/reasoning/chain-of-thought";
import { notifyAdmin } from "@/lib/security/audit";
import { verifySession, isResponse, rateLimit } from "@/lib/security/api-guards";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const user = await verifySession(req);
  if (isResponse(user)) return user;

  const limit = rateLimit(`ai-deep-think:${user.id}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const query = (body as { query?: unknown })?.query;

  if (!query || typeof query !== "string") {
    return new Response(JSON.stringify({ error: "Query is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const cot = new ChainOfThought();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (_) {}
      };

      let timeoutId: NodeJS.Timeout | null = null;

      try {
        const arm = () => {
          if (timeoutId) clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            send({ type: "error", message: "DeepThink timed out. Please try again." });
            controller.close();
          }, 55000);
        };
        arm();

        const generator = await cot.generate(query, { stream: true, deep: true });
        for await (const chunk of generator) {
          send(chunk);
          arm();
        }
      } catch (error: any) {
        console.error("[ADMIN] DeepThink error:", error);
        notifyAdmin(error, { query });
        send({
          type: "error",
          message: "I encountered an issue while reasoning. Please try again.",
        });
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
        try {
          controller.close();
        } catch (_) {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
