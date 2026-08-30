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
