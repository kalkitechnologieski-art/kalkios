// ═══ LEADGEN v3 API ═══
// Streaming server-side lead generation with multi-engine parallel search,
// worker-pool scraping, JSON-LD/mailto/tel extraction, structured error codes.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server'
import { verifySession, isResponse, rateLimit } from '@/lib/security/api-guards'
import { generateLeads, LeadProgressEvent } from '@/lib/leads/aggregator'
import { LeadPipelineError } from '@/lib/leads/errors'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 180

export async function POST(req: NextRequest) {
  const user = await verifySession(req)
  if (isResponse(user)) return user

  const limit = rateLimit(`leads-generate:${user.id}`, 5, 10 * 60_000)
  if (!limit.ok) {
    return jsonError(429, 'LEADS_RATE_LIMITED', 'Too many lead requests — wait for the window to reset.', { retryAfter: limit.retryAfterSec })
  }

  let body: { query?: string; maxResults?: number; location?: string; engines?: string[]; directories?: string[]; expandQueries?: boolean; stream?: boolean }
  try {
    body = await req.json()
  } catch {
    return jsonError(400, 'LEADS_INVALID_QUERY', 'Body must be valid JSON.')
  }

  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query) return jsonError(400, 'LEADS_INVALID_QUERY', 'query is required.')
  if (query.length < 2) return jsonError(400, 'LEADS_QUERY_TOO_SHORT', 'query must be at least 2 characters.')

  const maxResults = Math.min(Math.max(Number(body.maxResults) || 20, 1), 100)
  const location = typeof body.location === 'string' ? body.location : undefined
  const engines = Array.isArray(body.engines) ? body.engines : undefined
  const directories = Array.isArray(body.directories) ? body.directories : undefined
  const expandQueries = body.expandQueries !== false

  if (body.stream === false) {
    // Non-streaming JSON response
    try {
      const result = await generateLeads({
        query,
        location,
        maxResults,
        engines,
        directories,
        expandQueries,
      })
      return Response.json({ ...result, errors: result.errors.map((e) => ({ ...e, severity: 'info', description: 'partial result' })) })
    } catch (err) {
      return errorResponse(err)
    }
  }

  // Streaming SSE response
  const encoder = new TextEncoder()
  const stream = new TransformStream<Uint8Array, Uint8Array>()
  const writer = stream.writable.getWriter()
  let closed = false

  const sendEvent = async (event: { type: string; [k: string]: unknown }) => {
    if (closed) return
    try { await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`)) }
    catch { closed = true }
  }
  const close = async () => {
    if (closed) return
    closed = true
    try { await writer.close() } catch { /* already closed */ }
  }
  req.signal.addEventListener('abort', () => { void close() })

  const response = new Response(stream.readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })

  void (async () => {
    try {
      await generateLeads({
        query,
        location,
        maxResults,
        engines,
        directories,
        expandQueries,
        signal: req.signal,
        onProgress: (event: LeadProgressEvent) => { void sendEvent(event as unknown as { type: string; [k: string]: unknown }) },
      })
    } catch (err) {
      const code = err instanceof LeadPipelineError ? err.code : 'LEADS_INTERNAL_ERROR'
      const message = err instanceof Error ? err.message : 'lead generation failed'
      await sendEvent({ type: 'error', code, message, retryable: err instanceof LeadPipelineError ? err.retryable : false })
    } finally {
      await close()
    }
  })()

  return response
}

function jsonError(status: number, code: string, message: string, extra: Record<string, unknown> = {}) {
  return Response.json({ error: message, code, ...extra }, { status, headers: code === 'LEADS_RATE_LIMITED' ? { 'Retry-After': String(extra.retryAfter ?? 60) } : undefined })
}

function errorResponse(err: unknown): Response {
  if (err instanceof LeadPipelineError) {
    const status = err.code === 'LEADS_RATE_LIMITED' ? 429 : err.code === 'LEADS_NO_RESULTS' ? 200 : 502
    return Response.json({ error: err.message, code: err.code, retryable: err.retryable, engine: err.engine }, { status })
  }
  return Response.json({ error: err instanceof Error ? err.message : 'lead generation failed', code: 'LEADS_INTERNAL_ERROR' }, { status: 500 })
}