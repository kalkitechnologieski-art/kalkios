// Siddhi chat lead generation — runs the scraping pipeline server-side
// (browser-side fetches to third-party sites are CORS-blocked) and returns
// the full LeadGenerationResult synchronously.

import { NextRequest, NextResponse } from 'next/server'
import { verifySession, isResponse, rateLimit } from '@/lib/security/api-guards'
import { leadGenerator } from '@/lib/ai/lead-generator'

export const runtime = 'nodejs'
export const maxDuration = 120

export async function POST(req: NextRequest) {
  const user = await verifySession(req)
  if (isResponse(user)) return user

  const limit = rateLimit(`leads-generate:${user.id}`, 5, 10 * 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    )
  }

  let body: { query?: string; maxResults?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })
  const maxResults = Math.min(Math.max(Number(body.maxResults) || 20, 1), 50)

  try {
    const result = await leadGenerator.generateLeads({
      query,
      maxResults,
      maxPagesPerSite: 2,
    })
    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'lead generation failed'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
