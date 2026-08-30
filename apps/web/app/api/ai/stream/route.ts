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

      // Send a ping to indicate connection is alive
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "status", message: "Connecting..." })}\n\n`));

      const agent = new SiddhiAgent();
      const result = await agent.process({ messages, userId, stream: true });

      // CASE 1: Result is a ReadableStream (from provider)
      if (result instanceof ReadableStream) {
        const reader = result.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const parsed = JSON.parse(data);
                // Forward the parsed chunk as-is
                await writer.write(encoder.encode(`data: ${JSON.stringify(parsed)}\n\n`));
              } catch (_) {
                // If not JSON, forward as content
                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: data })}\n\n`));
              }
            } else if (line.trim()) {
              // Non-data lines (could be part of JSON) – forward as content
              await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: line })}\n\n`));
            }
          }
        }

        // If we didn't get any content, send a fallback
        if (buffer.trim() === "") {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: "I've processed your request. Please continue." })}\n\n`));
        }

        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`));
        await writer.close();
        return;
      }

      // CASE 2: Result is an AsyncGenerator
      if (result && typeof result[Symbol.asyncIterator] === "function") {
        let hasContent = false;
        for await (const chunk of result) {
          if (chunk.type === "content" && (!chunk.content || chunk.content === "")) continue;
          hasContent = true;
          await writer.write(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
        }
        if (!hasContent) {
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: "I couldn't generate a response. Please try again." })}\n\n`));
        }
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "complete" })}\n\n`));
        await writer.close();
        return;
      }

      // CASE 3: Result is a plain object with type and content
      if (result?.type === "questions") {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "questions", questions: result.questions })}\n\n`));
        await writer.close();
        return;
      }

      if (result?.type === "setu_pending") {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "setu_pending", message: result.message, questions: result.questions })}\n\n`));
        await writer.close();
        return;
      }

      if (result && typeof result === "object" && result.content) {
        await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: result.content })}\n\n`));
        await writer.close();
        return;
      }

      // CASE 4: Fallback for any other result
      await writer.write(encoder.encode(`data: ${JSON.stringify({ type: "content", content: result || "I'm here to help! Ask me anything." })}\n\n`));
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
