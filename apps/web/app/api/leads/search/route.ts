import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { searchWeb } from '@/lib/leads/search'
import { scrapeWebsites, closeBrowser } from '@/lib/leads/scraper'
import { extractContactData } from '@/lib/leads/extractor'
import { validateLead } from '@/lib/leads/validator'
import { verifySession, isResponse, requireStaff, rateLimit } from '@/lib/security/api-guards'

export async function POST(req: NextRequest) {
  const user = await verifySession(req)
  if (isResponse(user)) return user
  const forbidden = requireStaff(user)
  if (forbidden) return forbidden

  const limit = rateLimit(`leads-search:${user.id}`, 3, 10 * 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfterSec) } }
    )
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const { sessionId, query } = body as { sessionId?: string; query?: string }
  const rawCount = Number(body.targetCount)
  const targetCount = Number.isFinite(rawCount) && rawCount > 0 ? Math.min(Math.floor(rawCount), 100) : 25
  if (!sessionId || !query) return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const supabase = await createClient() as any
  processSearch(sessionId, query, targetCount, supabase).catch(console.error)
  return NextResponse.json({ success: true })
}

async function processSearch(sessionId: string, query: string, targetCount: number, supabase: any) {
  let leadsFound = 0
  try {
    const searchResults = await searchWeb(query, Math.min(targetCount * 2, 100))
    const urls = searchResults.map(r => r.url).filter(Boolean)
    if (urls.length === 0) {
// @ts-ignore
// @ts-ignore
      await supabase.from('lead_search_sessions').update({  status: 'failed', leads_found: 0 }).eq('id', sessionId as any as any)
      return
    }
    const scrapedContent = await scrapeWebsites(urls.slice(0, 30), 5)
    for (const [url, html] of scrapedContent) {
      if (leadsFound >= targetCount) break
      if (!html || html.length < 100) continue
      const extracted = await extractContactData(html, url)
      for (const contact of extracted) {
        if (leadsFound >= targetCount) break
        const validation = await validateLead(contact)
        if (validation.valid) {
// @ts-ignore
// @ts-ignore
          await supabase.from('leads').insert({ 
            session_id: sessionId,
            name: validation.cleaned.name || contact.name,
            email: validation.cleaned.email || contact.email,
            phone: validation.cleaned.phone || contact.phone,
            website: url,
            company: validation.cleaned.company || contact.company,
            job_title: validation.cleaned.jobTitle || contact.jobTitle,
            linkedin_url: validation.cleaned.linkedinUrl || contact.linkedinUrl,
            twitter_url: validation.cleaned.twitterUrl || contact.twitterUrl,
            city: validation.cleaned.city || contact.city,
            country: validation.cleaned.country || contact.country,
            verified: validation.confidence > 0.7,
            score: validation.confidence,
            data_source: url,
            raw_data: contact,
          })
          leadsFound++
        }
      }
    }
// @ts-ignore
// @ts-ignore
    await supabase.from('lead_search_sessions').update({  status: 'completed', leads_found: leadsFound, completed_at: new Date().toISOString() }).eq('id', sessionId as any as any)
  } catch (error) {
    console.error('Search failed:', error)
// @ts-ignore
// @ts-ignore
    await supabase.from('lead_search_sessions').update({  status: 'failed', leads_found: leadsFound }).eq('id', sessionId as any as any)
  } finally {
    await closeBrowser()
  }
}
