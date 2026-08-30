import { NextRequest } from "next/server";
import { SiddhiAgent } from "@/lib/agents/siddhi-agent";
import { notifyAdmin } from "@/lib/security/audit";

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (_) {}
      };

      try {
        const body = await req.json();
        const { messages, userId } = body;

        if (!messages || !Array.isArray(messages)) {
          send({ type: "error", message: "Invalid request: messages array required." });
          controller.close();
          return;
        }

        const agent = new SiddhiAgent();
        const result = await agent.process({ messages, userId, stream: true });

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
        console.error("[ADMIN] Stream error:", error);
        notifyAdmin(error, { url: req.url });
        send({
          type: "error",
          message: "I encountered an issue. Please try again or contact support if the problem persists.",
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
