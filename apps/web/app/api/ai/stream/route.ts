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

  // Start async work
  (async () => {
    try {
      const body = await req.json();
      const { messages, userId } = body;

      console.log("[DIAGNOSTIC] Received messages:", JSON.stringify(messages, null, 2));

      if (!messages || !Array.isArray(messages)) {
        console.log("[DIAGNOSTIC] Invalid messages, sending error");
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
      console.log("[DIAGNOSTIC] Result keys:", result ? Object.keys(result) : "null");
      console.log("[DIAGNOSTIC] Result sample:", JSON.stringify(result).slice(0, 200));

      // Check if result is an async generator
      if (result && typeof result[Symbol.asyncIterator] === "function") {
        console.log("[DIAGNOSTIC] Result is an async generator, iterating...");
        let hasContent = false;
        for await (const chunk of result) {
          console.log("[DIAGNOSTIC] Chunk:", JSON.stringify(chunk).slice(0, 200));
          if (chunk.type === "content" && (!chunk.content || chunk.content === "")) {
            console.log("[DIAGNOSTIC] Skipping empty content chunk");
            continue;
          }
          hasContent = true;
          await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        if (!hasContent) {
          console.log("[DIAGNOSTIC] No content chunks received, sending fallback");
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: "I'm having trouble generating a response. Please try again." })}\n\n`));
        }
      } else if (result?.type === "questions") {
        console.log("[DIAGNOSTIC] Sending questions");
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "questions", questions: result.questions })}\n\n`));
      } else if (result?.type === "setu_pending") {
        console.log("[DIAGNOSTIC] Sending SETU pending");
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "setu_pending", message: result.message, questions: result.questions })}\n\n`));
      } else if (result) {
        console.log("[DIAGNOSTIC] Sending direct content");
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: result })}\n\n`));
      } else {
        console.log("[DIAGNOSTIC] No result at all, sending fallback");
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: "I couldn't process your request. Please try again." })}\n\n`));
      }

      console.log("[DIAGNOSTIC] Sending complete");
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
