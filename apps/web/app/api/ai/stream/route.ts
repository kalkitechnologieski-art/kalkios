// app/api/ai/stream/route.ts
// ──────────────────────────────────────────────────────────────────
// EXPERT IMPLEMENTATION – SSE streaming with robust error handling,
// timeouts, and support for all media types.
// ──────────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { SiddhiAgent } from '@/lib/agents/siddhi-agent';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (event: { type: string; [key: string]: any }) => {
    try {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      await writer.write(encoder.encode(data));
    } catch (error) {
      logger.warn('[Stream] Failed to send event:', error);
    }
  };

  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });

  // Process the request in the background
  (async () => {
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      const body = await req.json();
      const { messages, userId } = body;

      if (!messages || !Array.isArray(messages)) {
        await sendEvent({ type: 'error', message: 'Invalid request: messages array required.' });
        return;
      }

      const agent = new SiddhiAgent();

      // Global timeout: 55 seconds
      timeoutId = setTimeout(() => {
        sendEvent({ type: 'error', message: 'Request timed out. Please try again.' });
        writer.close();
      }, 55000);

      const result = await agent.process({ messages, userId, stream: true });

      // Emit events based on result structure
      if (result.reasoning) {
        await sendEvent({ type: 'reasoning', content: result.reasoning });
      }
      if (result.final_answer) {
        await sendEvent({ type: 'content', content: result.final_answer });
      }
      if (result.content) {
        await sendEvent({ type: 'content', content: result.content });
      }

      // Leads
      if (result.leads && result.leads.length > 0) {
        await sendEvent({ type: 'leads', leads: result.leads, csv: result.csv });
      }

      // Image
      if (result.imageUrl) {
        await sendEvent({ type: 'image', url: result.imageUrl });
      }

      // Video
      if (result.videoUrl) {
        await sendEvent({ type: 'video', url: result.videoUrl });
      }

      // DeepThink traces
      if (result.paths) {
        for (const path of result.paths) {
          await sendEvent({
            type: 'trace',
            step: {
              id: path.id,
              provider: path.provider,
              confidence: path.confidence,
              reasoning: path.reasoning.slice(0, 200) + '...',
              status: 'completed',
            },
          });
        }
      }

      // Optional progress events from SETU
      if (result.progress) {
        for (const ev of result.progress) {
          await sendEvent(ev);
        }
      }

      await sendEvent({ type: 'complete' });
    } catch (error: any) {
      logger.error('[Stream] Unhandled error:', error);
      await sendEvent({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      try { await writer.close(); } catch (_) { /* ignore */ }
    }
  })();

  return response;
}
