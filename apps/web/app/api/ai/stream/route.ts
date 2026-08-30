import { NextRequest } from "next/server";
import { SiddhiAgent } from "@/lib/agents/siddhi-agent";
import { notifyAdmin } from "@/lib/security/audit";
import { hasAnyProvider } from "@/lib/env/validation";

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
      // Check if any provider is available
      if (!hasAnyProvider()) {
        console.error("[DIAGNOSTIC] No AI provider API keys found");
        await writer.write(encoder.encode(`data: ${JSON.stringify({
          type: "error",
          message: "No AI service configured. Please contact support.",
        })}\n\n`));
        await writer.close();
        return;
      }

      const body = await req.json();
      const { messages, userId } = body;

      if (!messages || !Array.isArray(messages)) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "error", message: "Invalid request: messages array required." })}\n\n`));
        await writer.close();
        return;
      }

      console.log("[DIAGNOSTIC] Received messages:", JSON.stringify(messages).slice(0, 200));

      // Send a ping to indicate the stream is alive
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Connecting to Siddhi..." })}\n\n`));

      const agent = new SiddhiAgent();
      const result = await agent.process({ messages, userId, stream: true });

      console.log("[DIAGNOSTIC] Result type:", typeof result);
      console.log("[DIAGNOSTIC] Result is async generator:", !!(result && typeof result[Symbol.asyncIterator] === "function"));

      // CASE 1: Result is an async generator (streaming response)
      if (result && typeof result[Symbol.asyncIterator] === "function") {
        console.log("[DIAGNOSTIC] Processing async generator...");
        let hasContent = false;
        for await (const chunk of result) {
          console.log("[DIAGNOSTIC] Chunk received:", JSON.stringify(chunk).slice(0, 200));
          // Skip empty content chunks
          if (chunk.type === "content" && (!chunk.content || chunk.content === "")) {
            console.log("[DIAGNOSTIC] Skipping empty content chunk");
            continue;
          }
          hasContent = true;
          await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        if (!hasContent) {
          console.log("[DIAGNOSTIC] No content from generator, sending fallback");
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: "I'm having trouble generating a response. Please try again." })}\n\n`));
        }
      }
      // CASE 2: Result is a standard chat completion (has choices)
      else if (result && result.choices && Array.isArray(result.choices) && result.choices.length > 0) {
        console.log("[DIAGNOSTIC] Result is a chat completion");
        const content = result.choices[0]?.message?.content || "";
        if (content) {
          console.log("[DIAGNOSTIC] Extracted content length:", content.length);
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content })}\n\n`));
        } else {
          console.log("[DIAGNOSTIC] No content in choices, trying alternative");
          // Sometimes content is in reasoning_content
          const reasoning = result.choices[0]?.message?.reasoning_content || "";
          if (reasoning) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "reasoning", content: reasoning })}\n\n`));
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: "I've processed your request." })}\n\n`));
          } else {
            console.log("[DIAGNOSTIC] No content or reasoning, sending fallback");
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: "I couldn't generate a response. Please try again." })}\n\n`));
          }
        }
      }
      // CASE 3: Result is a questions object (SETU)
      else if (result?.type === "questions") {
        console.log("[DIAGNOSTIC] Sending questions");
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "questions", questions: result.questions })}\n\n`));
      }
      // CASE 4: Result is a SETU pending
      else if (result?.type === "setu_pending") {
        console.log("[DIAGNOSTIC] Sending SETU pending");
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "setu_pending", message: result.message, questions: result.questions })}\n\n`));
      }
      // CASE 5: Result is a direct string or object
      else if (result) {
        console.log("[DIAGNOSTIC] Result is a direct object/string");
        if (typeof result === "string") {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: result })}\n\n`));
        } else {
          // Try to stringify
          try {
            const content = JSON.stringify(result);
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content })}\n\n`));
          } catch (_) {
            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: "I processed your request but couldn't format the response." })}\n\n`));
          }
        }
      }
      // CASE 6: No result at all
      else {
        console.log("[DIAGNOSTIC] No result from agent");
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: "I'm having trouble processing your request. Please try again." })}\n\n`));
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
