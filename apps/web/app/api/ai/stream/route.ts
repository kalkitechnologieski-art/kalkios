// ═══ SIDDHI v4.0 BATCH 3 v1.0 ═══
// Token-level SSE + artifact/toolCall emission + device layer status.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { SiddhiAgent } from '@/lib/agents/siddhi-agent';
import { logger } from '@/lib/utils/logger';
import { verifySession, isResponse, rateLimit } from '@/lib/security/api-guards';
import { TokenLevelStreamer, splitIntoTokens } from '@/lib/streaming/sse-token-streamer';
import { classifyError, retryWithBackoff } from '@/lib/error-handling/error-classifier';
import { tryAcquireUserStream, MAX_USER_STREAMS } from '@/lib/ai/user-concurrency';

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

  // Cap how many streams a single user can run in parallel so a runaway tab
  // can't exhaust the free-tier provider quotas.
  const slot = tryAcquireUserStream(user.id);
  if ('busy' in slot) {
    return NextResponse.json(
      {
        error: `You already have ${slot.active} Siddhi requests running (max ${slot.max}). Wait for one to finish before sending another.`,
        code: 'concurrent_limit',
        active: slot.active,
        max: slot.max,
      },
      { status: 429, headers: { 'Retry-After': '10' } }
    );
  }

  // Always release the slot exactly once, no matter how the stream ends.
  let slotReleased = false;
  const releaseSlot = () => {
    if (slotReleased) return;
    slotReleased = true;
    slot.release();
  };

  const encoder = new TextEncoder();
  const stream = new TransformStream<Uint8Array, Uint8Array>();
  const writer = stream.writable.getWriter();
  let closed = false;

  const close = async () => {
    if (closed) return;
    closed = true;
    try { await writer.close(); } catch { /* already closed */ }
  };

  // Create token-level streamer for fine-grained SSE
  const streamer = new TokenLevelStreamer(writer);

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
          void sendEvent({ type: 'error', message: 'Siddhi took too long to respond. Please try again.' });
          void close();
        }, 90_000);
      };
      armTimeout();

      const anyProviderConfigured = ['GROQ_API_KEY', 'AGNES_API_KEY', 'ZHIPU_API_KEY', 'OPENROUTER_API_KEY']
        .some((k) => !!process.env[k]);
      if (!anyProviderConfigured) {
        await sendEvent({ type: 'error', message: 'Siddhi is offline: no AI provider is configured yet. Please try again later.' });
        await close();
        return;
      }

      // Use omnibus router when privacy/speed hints are provided, else pipeline
      const useOmnibus = privacy || preferSpeed || preferQuality;

      // True streaming: the pipeline emits live `delta` frames, so we only
      // fall back to post-hoc token bursting when nothing actually streamed
      // (e.g. image/video replies that return a single ready result).
      let streamedDeltas = false;

      const onProgress = async (event: unknown) => {
        armTimeout();
        const ev = event as { type: string; step?: unknown; message?: string; content?: unknown };
        if (ev.type === 'trace' && ev.step) await sendEvent({ type: 'trace', step: ev.step });
        else if (ev.type === 'status' && ev.message) await sendEvent({ type: 'status', message: ev.message });
        else if (ev.type === 'queue_status') await sendEvent(event as { type: string; [k: string]: unknown });
        else if (ev.type === 'delta' && typeof ev.content === 'string') {
          streamedDeltas = true;
          await streamer.sendToken(ev.content);
        }
      };

      if (useOmnibus) {
        const result = await retryWithBackoff(
          () => agent.processWithOmnibus({
            messages, userId, sessionId,
            query: messages.filter((m: { role: string }) => m.role === 'user').pop()?.content ?? '',
            privacy, preferSpeed, preferQuality,
            onProgress,
          }),
          2, // max retries
          2000 // base delay
        );

        // Token-level streaming of response
        const fullContent = result.content ?? '';
        if (fullContent.length > 1) {
          const tokens = splitIntoTokens(fullContent);
          for (const token of tokens) {
            if (!streamer.isOpen()) break;
            await streamer.sendToken(token);
          }
        }

        await sendEvent({ type: 'provider', provider: result.provider });
        await sendEvent({ type: 'layer', layer: result.layer });
        if (result.sources?.length) await sendEvent({ type: 'sources', sources: result.sources });
        // Final full-content frame: guarantees rendering even if token frames are lost
        await sendEvent({ type: 'content', content: fullContent });

        const metrics = await streamer.close();
        logger.info(`[Stream] Omnibus complete: ${metrics.totalTokens} tokens in ${metrics.totalLatencyMs}ms`);
        return;
      }

      // No outer retry: the pipeline streams live and already cascades through
      // every configured provider internally (streamPrimaryDraft). Retrying here
      // would replay the SSE stream and duplicate text on the client.
      const result = await agent.processWithPipeline({
        messages, userId, sessionId,
        query: messages.filter((m: { role: string }) => m.role === 'user').pop()?.content ?? '',
        deep, setu, search, image, video,
        correlationId: crypto.randomUUID(),
        onProgress,
      });

      // Token-level streaming of response. The pipeline already streamed live
      // `delta` frames for chat; only burst the finished text when nothing
      // streamed (image/video and other single-result replies).
      const fullContent = result.content ?? '';
      if (!streamedDeltas && fullContent.length > 1) {
        const tokens = splitIntoTokens(fullContent);
        for (const token of tokens) {
          if (!streamer.isOpen()) break;
          await streamer.sendToken(token);
        }
      }

      if (result.reasoning) await sendEvent({ type: 'reasoning', content: result.reasoning });
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
      // Final full-content frame: guarantees rendering even if token frames are lost
      if (fullContent) await sendEvent({ type: 'content', content: fullContent });

      const metrics = await streamer.close();
      logger.info(`[Stream] Pipeline complete: ${metrics.totalTokens} tokens in ${metrics.totalLatencyMs}ms`);
    } catch (error) {
      logger.error('[Stream] Unhandled error', error);
      
      // Classify error and provide actionable message
      const classified = classifyError(error);
      await streamer.sendError(
        classified.userMessage,
        classified.classification,
        classified.retryAfterMs ? classified.retryAfterMs / 1000 : undefined
      );
      
      await streamer.close();
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      if (!closed) await close();
      releaseSlot();
    }
  })();

  return response;
}
