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

  (async () => {
    try {
      const body = await req.json();
      const { messages, userId } = body;

      if (!messages || !Array.isArray(messages)) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Invalid request: messages array required." })}\n\n`));
        await writer.close();
        return;
      }

      const agent = new SiddhiAgent();
      const result = await agent.process({ messages, userId, stream: true });

      if (result && typeof result[Symbol.asyncIterator] === "function") {
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
      console.error("[ADMIN] Stream error:", error);
      notifyAdmin(error, { url: req.url });
      try {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "I encountered an issue. Please try again." })}\n\n`));
        await writer.close();
      } catch (_) {}
    }
  })();

  return response;
}
