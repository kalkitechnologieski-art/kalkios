// app/api/ai/stream/route.ts
import { NextRequest } from 'next/server';
import { SiddhiAgent } from '@/lib/agents/siddhi-agent';
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
    } catch (_) {}
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
      const { messages, userId, deep = true, setu = false, search = false, image } = body;

      const agent = new SiddhiAgent();

      timeoutId = setTimeout(() => {
        sendEvent({ type: 'error', message: 'Request timed out. Please try again.' });
        writer.close();
      }, 55000);

      const result = await agent.process({ messages, userId, stream: true, deep, setu, search, image });

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

      if (result.leads && result.leads.length > 0) {
        await sendEvent({ type: 'leads', leads: result.leads, csv: result.csv });
      }

      if (result.imageUrl) {
        await sendEvent({ type: 'image', url: result.imageUrl });
      }

      if (result.videoUrl) {
        await sendEvent({ type: 'video', url: result.videoUrl });
      }

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
      try { await writer.close(); } catch (_) {}
    }
  })();

  return response;
}
