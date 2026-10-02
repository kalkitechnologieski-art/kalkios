// ═══ SIDDHI v4.0 BATCH 3 v1.0 ═══
// Token-level SSE + artifact/toolCall emission + device layer status.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { SiddhiAgent } from '@/lib/agents/siddhi-agent';
import { logger } from '@/lib/utils/logger';
import { verifySession, isResponse, rateLimit } from '@/lib/security/api-guards';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const user = await verifySession(req);
  if (isResponse(user)) return user;

  const limit = rateLimit(`ai-stream:${user.id}`, 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    );
  }

  const encoder = new TextEncoder();
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();
  let closed = false;

  const close = async () => {
    if (closed) return;
    closed = true;
    try { await writer.close(); } catch { /* already closed */ }
  };

  const sendEvent = async (event: { type: string; [key: string]: unknown }) => {
    if (closed) return;
    try { await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)); }
    catch { closed = true; }
  };

  req.signal.addEventListener('abort', () => { void close(); });

  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });

  void (async () => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    try {
      const body = await req.json();
      const {
        messages, sessionId, deep = true, setu = false, search = true, image = false, video = false,
        privacy, preferSpeed, preferQuality,
      } = body ?? {};
      const userId = user.id; // never trust a client-supplied userId

      if (!messages || !Array.isArray(messages)) {
        await sendEvent({ type: 'error', message: 'Invalid request: messages array required.' });
        await close();
        return;
      }

      const agent = new SiddhiAgent();

      const armTimeout = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          void sendEvent({ type: 'error', message: 'Request timed out. Please try again.' });
          void close();
        }, 55_000);
      };
      armTimeout();

      // Use omnibus router when privacy/speed hints are provided, else pipeline
      const useOmnibus = privacy || preferSpeed || preferQuality;

      const onProgress = async (event: unknown) => {
        armTimeout();
        const ev = event as { type: string; step?: unknown; message?: string };
        if (ev.type === 'trace' && ev.step) await sendEvent({ type: 'trace', step: ev.step });
        else if (ev.type === 'status' && ev.message) await sendEvent({ type: 'status', message: ev.message });
      };

      if (useOmnibus) {
        const result = await agent.processWithOmnibus({
          messages, userId, sessionId,
          query: messages.filter((m: { role: string }) => m.role === 'user').pop()?.content ?? '',
          privacy, preferSpeed, preferQuality,
          onProgress,
        });

        const fullContent = result.content ?? '';
        if (fullContent.length > 1) {
          const chunks = fullContent.match(/[^.!?\n]+[.!?\n]?\s*/g) ?? [fullContent];
          if (chunks.length > 1) {
            for (const chunk of chunks) {
              await sendEvent({ type: 'delta', stage: 'final', content: chunk });
              await new Promise((r) => setTimeout(r, 0));
            }
          }
        }
        await sendEvent({ type: 'content', content: fullContent });
        await sendEvent({ type: 'provider', provider: result.provider });
        await sendEvent({ type: 'layer', layer: result.layer });
        if (result.sources?.length) await sendEvent({ type: 'sources', sources: result.sources });
        await sendEvent({ type: 'complete' });
        return;
      }

      const result = await agent.processWithPipeline({
        messages, userId, sessionId,
        query: messages.filter((m: { role: string }) => m.role === 'user').pop()?.content ?? '',
        deep, setu, search, image, video,
        correlationId: crypto.randomUUID(),
        onProgress,
      });

      const fullContent = result.content ?? '';
      if (fullContent.length > 1) {
        const chunks = fullContent.match(/[^.!?\n]+[.!?\n]?\s*/g) ?? [fullContent];
        if (chunks.length > 1) {
          for (const chunk of chunks) {
            await sendEvent({ type: 'delta', stage: 'final', content: chunk });
            await new Promise((r) => setTimeout(r, 0));
          }
        }
      }

      if (result.reasoning) await sendEvent({ type: 'reasoning', content: result.reasoning });
      await sendEvent({ type: 'content', content: fullContent });
      if (result.critique) await sendEvent({ type: 'critique', critique: result.critique });
      if (result.plan) await sendEvent({ type: 'plan', plan: result.plan });
      if (result.traces) await sendEvent({ type: 'traces', traces: result.traces });
      if (result.sources?.length) await sendEvent({ type: 'sources', sources: result.sources });
      if (result.emotion) await sendEvent({ type: 'emotion', emotion: result.emotion });
      if (result.provider) await sendEvent({ type: 'provider', provider: result.provider });

      if (result.artifacts && result.artifacts.length > 0) {
        for (const artifact of result.artifacts) await sendEvent({ type: 'artifact', artifact });
      }
      if (result.toolCalls && result.toolCalls.length > 0) {
        await sendEvent({ type: 'tool_calls', toolCalls: result.toolCalls });
      }

      await sendEvent({ type: 'complete' });
    } catch (error) {
      logger.error('[Stream] Unhandled error', error);
      await sendEvent({ type: 'error', message: 'An unexpected error occurred. Please try again.' });
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      await close();
    }
  })();

  return response;
}
