import { NextRequest } from "next/server";
import { ChainOfThought } from "@/lib/reasoning/chain-of-thought";
import { notifyAdmin } from "@/lib/security/audit";

export async function POST(req: NextRequest) {
  const { query } = await req.json();

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

      try {
        const generator = await cot.generate(query, { stream: true, deep: true });
        for await (const chunk of generator) {
          send(chunk);
        }
      } catch (error: any) {
        console.error("[ADMIN] DeepThink error:", error);
        notifyAdmin(error, { query });
        send({
          type: "error",
          message: "I encountered an issue while reasoning. Please try again.",
        });
      } finally {
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
