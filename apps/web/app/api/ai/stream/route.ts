import { NextRequest } from "next/server";
import { SiddhiAgent } from "@/lib/agents/siddhi-agent";
import { notifyAdmin } from "@/lib/security/audit";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { messages, userId } = body;

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Invalid messages" }), { status: 400 });
  }

  const agent = new SiddhiAgent();
  const result = await agent.process({ messages, userId, stream: true });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (_) {}
      };

      try {
        if (result && typeof result[Symbol.asyncIterator] === "function") {
          for await (const chunk of result) {
            send(chunk);
          }
        } else if (result?.type === "questions") {
          send({ type: "questions", questions: result.questions });
        } else if (result?.type === "setu_pending") {
          send({ type: "setu_pending", message: result.message, questions: result.questions });
        } else {
          send({ type: "content", content: result });
        }
        send({ type: "complete" });
      } catch (error: any) {
        console.error("[ADMIN] SiddhiAgent error:", error);
        notifyAdmin(error, { userId, messages });
        send({ type: "error", message: "I encountered an issue. Please try again." });
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
