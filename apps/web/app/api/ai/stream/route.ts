// app/api/ai/stream/route.ts
// Stream route that forwards SiddhiResult events to the client via SSE.

import { NextRequest } from 'next/server';
import { SiddhiAgent, type SiddhiResult } from '@/lib/agents/siddhi-agent';
import { logger } from '@/lib/utils/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendEvent = async (event: { type: string; [key: string]: any }) => {
    try {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      await writer.write(encoder.encode(data));
    } catch (_) {
      // writer may be closed
    }
  };

  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });

  (async () => {
    let timeoutId: NodeJS.Timeout | null = null;
    try {
      const body = await req.json();
      const {
        messages,
        userId,
        deep = true,
        setu = false,
        search = true,
        image = false,
        video = false,
      } = body;

      if (!messages || !Array.isArray(messages)) {
        await sendEvent({ type: 'error', message: 'Invalid request: messages array required.' });
        return;
      }

      const agent = new SiddhiAgent();

      timeoutId = setTimeout(() => {
        sendEvent({ type: 'error', message: 'Request timed out. Please try again.' });
        writer.close();
      }, 55000);

      const result: SiddhiResult = await agent.process({
        messages,
        userId,
        stream: true,
        deep,
        setu,
        search,
        image,
        video,
      });

      // ─── Emit structured events ────────────────────────────────────
      if (result.reasoning) {
        await sendEvent({ type: 'reasoning', content: result.reasoning });
      }
      if (result.content) {
        await sendEvent({ type: 'content', content: result.content });
      }
      if (result.imageUrl) {
        await sendEvent({ type: 'image', url: result.imageUrl });
      }
      if (result.videoUrl) {
        await sendEvent({ type: 'video', url: result.videoUrl });
      }
      if (result.leads && result.leads.length > 0) {
        await sendEvent({ type: 'leads', leads: result.leads, csv: result.csv ?? '' });
      }
      if (result.questions && result.questions.length > 0) {
        await sendEvent({ type: 'questions', questions: result.questions });
      }
      if (result.sources && result.sources.length > 0) {
        await sendEvent({ type: 'sources', sources: result.sources });
      }
      if (result.emotion) {
        await sendEvent({ type: 'emotion', emotion: result.emotion });
      }
      if (result.provider) {
        await sendEvent({ type: 'provider', provider: result.provider });
      }

      await sendEvent({ type: 'complete' });
    } catch (error: any) {
      logger.error('[Stream] Unhandled error:', error);
      await sendEvent({
        type: 'error',
        message: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      try {
        await writer.close();
      } catch (_) {
        // ignore
      }
    }
  })();

  return response;
}
