import { NextRequest } from "next/server";
import { SiddhiAgent } from "@/lib/agents/siddhi-agent";
import { notifyAdmin } from "@/lib/security/audit";

// CRITICAL: These exports prevent Next.js from buffering or caching the stream
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();

  // 1. Create the TransformStream to write chunks
  const responseStream = new TransformStream();
  const writer = responseStream.writable.getWriter();

  // 2. Return the Response IMMEDIATELY – this is the key fix[reference:9]
  // The Response is returned now, and the async work runs in the background
  const response = new Response(responseStream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Important for nginx/proxy[reference:10]
    },
  });

  // 3. Start async work AFTER returning the Response
  // This runs in the background and writes chunks incrementally
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
        // Streaming response from agent
        for await (const chunk of result) {
          // Skip empty content from providers[reference:11][reference:12]
          if (chunk.type === "content" && (!chunk.content || chunk.content === "")) {
            continue;
          }
          await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
      } else if (result?.type === "questions") {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "questions", questions: result.questions })}\n\n`));
      } else if (result?.type === "setu_pending") {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "setu_pending", message: result.message, questions: result.questions })}\n\n`));
      } else if (result) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: result })}\n\n`));
      }

      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`));
      await writer.close();

    } catch (error: any) {
      console.error("[ADMIN] Stream error:", error);
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

  // 4. Return the Response immediately (already created above)
  return response;
}
