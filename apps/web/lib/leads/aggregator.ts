// ═══ LEADGEN v3 AGGREGATOR ═══
// Unified, parallel, SSE-streaming lead-generation orchestrator.
// Two-path fanout:
//   1. Business directories (OSM, Wikidata SPARQL, GitHub, Justdial, Sulekha,
//      IndiaMART, ProductHunt) return already-structured leads — no scrape.
//   2. Web-search engines (11 engines) return URLs — those pages are scraped
//      and contact data extracted.
// Both paths merge + dedupe by email/phone/company+website anchors. If the
// first pass under-fills maxResults, we expand the query (synonyms, location,
// category) and run a second pass automatically.
// ─────────────────────────────────────────────────────────────────────────────

import { logger } from '@/lib/utils/logger'
import { parallelSearch, LeadSearchResult } from './engines'
import { parallelDirectories, StructuredLead, directoryHealth } from './directories'
import { extractContactData } from './extractor'
import { LeadPipelineError, LEAD_ERROR_CATALOG, LeadErrorCode } from './errors'

// ── Types ────────────────────────────────────────────────────────────────

export interface LeadAggregatorOptions {
  query: string
  location?: string
  maxResults?: number
  maxPagesPerSite?: number
  engines?: string[]
  directories?: string[]
  scrape?: boolean
  fetchTimeoutMs?: number
  expandQueries?: boolean
  userId?: string
  signal?: AbortSignal
  onProgress?: (event: LeadProgressEvent) => void
}

export type LeadProgressEvent =
  | { type: 'started'; query: string; engines: string[]; directories: string[] }
  | { type: 'searching'; query: string; engines: string[]; pass: number }
  | { type: 'engine_ok'; engine: string; count: number; durationMs: number }
  | { type: 'engine_failed'; engine: string; code: LeadErrorCode; durationMs: number; cause?: string }
  | { type: 'directory_ok'; directory: string; count: number; durationMs: number }
  | { type: 'directory_failed'; directory: string; code: LeadErrorCode; durationMs: number; cause?: string }
  | { type: 'structured_ready'; count: number; durationMs: number }
  | { type: 'search_done'; urls: number; engines: { name: string; ok: number; failed: number; durationMs: number }[]; durationMs: number }
  | { type: 'scraping'; total: number; completed: number; currentUrl: string }
  | { type: 'scrape_ok'; url: string; leads: number; durationMs: number }
  | { type: 'scrape_failed'; url: string; code: LeadErrorCode; durationMs: number; cause?: string }
  | { type: 'extract'; url: string; leads: number }
  | { type: 'expansion'; queries: string[]; reason: 'underfilled' }
  | { type: 'progress'; step: 'search' | 'scrape' | 'extract' | 'done'; percent: number; message: string }
  | { type: 'lead'; lead: LeadOutput }
  | { type: 'partial'; reason: 'partial_engines' | 'partial_scrapes' }
  | { type: 'aborted'; reason: string }
  | { type: 'complete'; leads: LeadOutput[]; totalSearched: number; totalScraped: number; durationMs: number; enginesUsed: string[]; directoriesUsed: string[]; passesRun: number; errors: { code: LeadErrorCode; engine?: string; message: string }[] }

export interface LeadOutput {
  name: string | null
  email: string | null
  phone: string | null
  company: string | null
  jobTitle: string | null
  linkedinUrl: string | null
  twitterUrl: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  city: string | null
  country: string | null
  address: string | null
  website: string | null
  metaDescription: string | null
  source: string | null
  sourceUrl: string
  confidence: number
  category: string | null
  lat: number | null
  lng: number | null
  extractedAt: string
}

export interface LeadAggregatorResult {
  leads: LeadOutput[]
  totalSearched: number
  totalScraped: number
  totalStructured: number
  csvContent: string
  enginesUsed: string[]
  directoriesUsed: string[]
  passesRun: number
  errors: { code: LeadErrorCode; engine?: string; message: string }[]
  durationMs: number
  metadata: {
    query: string
    location: string | undefined
    expandedQueries: string[]
    engines: { name: string; ok: boolean; count: number; durationMs: number; code?: LeadErrorCode }[]
    directories: { name: string; ok: boolean; count: number; durationMs: number; code?: LeadErrorCode }[]
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────

const BROWSER_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

async function fetchHtml(url: string, signal: AbortSignal, timeoutMs: number): Promise<string | null> {
  const ctrl = new AbortController()
  const tid = setTimeout(() => ctrl.abort(), timeoutMs)
  const onAbort = () => ctrl.abort(signal?.reason)
  if (signal) {
    if (signal.aborted) onAbort()
    else signal.addEventListener('abort', onAbort, { once: true })
  }
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': BROWSER_USER_AGENT,
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
      signal: ctrl.signal,
    })
    if (!response.ok) {
      const code: LeadErrorCode = response.status === 429 ? 'LEADS_SCRAPE_FAILED' : response.status === 403 || response.status === 451 ? 'LEADS_SCRAPE_BLOCKED' : 'LEADS_SCRAPE_FAILED'
      throw new LeadPipelineError({ code, message: `scrape ${response.status}`, retryable: response.status >= 500, cause: url })
    }
    const ct = response.headers.get('content-type') ?? ''
    if (!/text\/html|application\/xhtml/.test(ct)) return null
    const text = await response.text()
    return text.length > 1_500_000 ? text.slice(0, 1_500_000) : text
  } catch (err) {
    if (err instanceof LeadPipelineError) throw err
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new LeadPipelineError({ code: 'LEADS_SCRAPE_TIMEOUT', message: 'page fetch timeout', retryable: true, cause: url })
    }
    throw new LeadPipelineError({ code: 'LEADS_FETCH_FAILED', message: String(err), retryable: true, cause: url })
  } finally {
    clearTimeout(tid)
    signal?.removeEventListener('abort', onAbort)
  }
}

async function workerPool<T, R>(items: T[], limit: number, fn: (item: T, idx: number) => Promise<R>, signal?: AbortSignal): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      if (signal?.aborted) return
      const idx = cursor++
      if (idx >= items.length) break
      out[idx] = await fn(items[idx]!, idx)
    }
  })
  await Promise.all(workers)
  return out
}

function structuredToOutput(l: StructuredLead): LeadOutput {
  return {
    name: l.name ?? null,
    email: l.email ?? null,
    phone: l.phone ?? null,
    company: l.company ?? null,
    jobTitle: l.jobTitle ?? null,
    linkedinUrl: l.linkedinUrl ?? null,
    twitterUrl: l.twitterUrl ?? null,
    facebookUrl: l.facebookUrl ?? null,
    instagramUrl: l.instagramUrl ?? null,
    city: l.city ?? null,
    country: l.country ?? null,
    address: l.address ?? null,
    website: l.website ?? null,
    metaDescription: l.metaDescription ?? null,
    source: l.source,
    sourceUrl: l.sourceUrl,
    confidence: l.confidence,
    category: l.category ?? null,
    lat: l.lat ?? null,
    lng: l.lng ?? null,
    extractedAt: l.extractedAt,
  }
}

function dedupeLeads(leads: LeadOutput[]): LeadOutput[] {
  const byKey = new Map<string, LeadOutput>()
  for (const lead of leads) {
    const anchor =
      lead.email?.toLowerCase() ||
      lead.phone ||
      (lead.website || lead.sourceUrl)
    const key = anchor.trim().toLowerCase()
    if (!key) continue
    if (byKey.has(key)) {
      byKey.set(key, mergeLead(byKey.get(key)!, lead))
    } else {
      byKey.set(key, lead)
    }
  }
  return [...byKey.values()].sort((a, b) => b.confidence - a.confidence)
}

function mergeLead(a: LeadOutput, b: LeadOutput): LeadOutput {
  return {
    name: a.name || b.name,
    email: a.email || b.email,
    phone: a.phone || b.phone,
    company: a.company || b.company,
    jobTitle: a.jobTitle || b.jobTitle,
    linkedinUrl: a.linkedinUrl || b.linkedinUrl,
    twitterUrl: a.twitterUrl || b.twitterUrl,
    facebookUrl: a.facebookUrl || b.facebookUrl,
    instagramUrl: a.instagramUrl || b.instagramUrl,
    city: a.city || b.city,
    country: a.country || b.country,
    address: a.address || b.address,
    website: a.website || b.website,
    metaDescription: a.metaDescription || b.metaDescription,
    source: a.source || b.source,
    sourceUrl: a.sourceUrl || b.sourceUrl,
    confidence: Math.max(a.confidence, b.confidence),
    category: a.category || b.category,
    lat: a.lat ?? b.lat,
    lng: a.lng ?? b.lng,
    extractedAt: a.extractedAt > b.extractedAt ? a.extractedAt : b.extractedAt,
  }
}

function toOutput(contact: any, sourceUrl: string): LeadOutput {
  return {
    name: contact.name ?? null,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    company: contact.company ?? null,
    jobTitle: contact.jobTitle ?? null,
    linkedinUrl: contact.linkedinUrl ?? null,
    twitterUrl: contact.twitterUrl ?? null,
    facebookUrl: contact.facebookUrl ?? null,
    instagramUrl: contact.instagramUrl ?? null,
    city: contact.city ?? null,
    country: contact.country ?? null,
    address: contact.address ?? null,
    website: contact.website ?? null,
    metaDescription: contact.metaDescription ?? null,
    source: contact.source ?? null,
    sourceUrl,
    confidence: typeof contact.confidence === 'number' ? contact.confidence : 0,
    category: contact.category ?? null,
    lat: null,
    lng: null,
    extractedAt: new Date().toISOString(),
  }
}

function escapeCSV(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

function generateCSV(leads: LeadOutput[]): string {
  const headers = ['Name', 'Email', 'Phone', 'Company', 'Job Title', 'LinkedIn', 'Twitter', 'Facebook', 'Instagram', 'City', 'Country', 'Address', 'Website', 'Category', 'Latitude', 'Longitude', 'Source URL', 'Confidence', 'Source', 'Meta Description', 'Extracted At']
  const rows = leads.map((l) => [
    escapeCSV(l.name ?? ''),
    escapeCSV(l.email ?? ''),
    escapeCSV(l.phone ?? ''),
    escapeCSV(l.company ?? ''),
    escapeCSV(l.jobTitle ?? ''),
    escapeCSV(l.linkedinUrl ?? ''),
    escapeCSV(l.twitterUrl ?? ''),
    escapeCSV(l.facebookUrl ?? ''),
    escapeCSV(l.instagramUrl ?? ''),
    escapeCSV(l.city ?? ''),
    escapeCSV(l.country ?? ''),
    escapeCSV(l.address ?? ''),
    escapeCSV(l.website ?? ''),
    escapeCSV(l.category ?? ''),
    l.lat?.toString() ?? '',
    l.lng?.toString() ?? '',
    escapeCSV(l.sourceUrl ?? ''),
    l.confidence.toFixed(2),
    escapeCSV(l.source ?? ''),
    escapeCSV(l.metaDescription ?? ''),
    escapeCSV(l.extractedAt),
  ])
  return ['\ufeff' + headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

// ── Query expansion ──────────────────────────────────────────────────────

const SYNONYMS: Record<string, string[]> = {
  agency: ['firm', 'company', 'studio', 'consultants'],
  companies: ['firms', 'businesses', 'providers', 'vendors'],
  company: ['firm', 'business', 'provider'],
  services: ['solutions', 'solutions providers', 'consulting'],
  software: ['saas', 'platform', 'tool', 'app'],
  marketing: ['digital marketing', 'advertising', 'branding'],
  development: ['dev shop', 'web development', 'software development'],
  clinic: ['hospital', 'healthcare centre', 'medical center'],
  restaurant: ['cafe', 'diner', 'eatery', 'food'],
  hotel: ['resort', 'inn', 'lodging', 'boutique stay'],
  school: ['academy', 'institute', 'college'],
  manufacturer: ['factory', 'producer', 'supplier'],
  supplier: ['vendor', 'distributor', 'wholesaler'],
  startup: ['scaleup', 'new company', 'venture'],
  freelancer: ['independent', 'consultant', 'contractor'],
  'interior design': ['interiors', 'decorators', 'architects'],
  'web design': ['web development', 'web studio'],
}

const CATEGORY_HINTS = ['contact us', 'about', 'team']

export function expandQueries(query: string, location?: string): string[] {
  const out: string[] = []
  const qLower = query.toLowerCase()

  for (const [key, alts] of Object.entries(SYNONYMS)) {
    if (qLower.includes(key)) {
      for (const alt of alts.slice(0, 2)) {
        const variant = query.replace(new RegExp(key, 'i'), alt)
        if (!out.includes(variant)) out.push(variant)
      }
      break
    }
  }

  if (location) {
    const parts = location.split(/[,]/).map((s) => s.trim()).filter(Boolean)
    if (parts.length >= 2) {
      out.push(`${query} ${parts[0]}`)
      out.push(`${query} ${parts.slice(1).join(' ')}`)
    }
    out.push(`${query} near ${location}`)
    out.push(`${query} ${location} list`)
  } else {
    out.push(`${query} list`)
    out.push(`${query} top 10`)
  }

  out.push(`${query} ${CATEGORY_HINTS[0]}`)
  out.push(`${query} ${CATEGORY_HINTS[1]}`)

  return [...new Set(out.map((s) => s.trim()))].slice(0, 4)
}

// ── Pipeline ─────────────────────────────────────────────────────────────

export async function generateLeads(opts: LeadAggregatorOptions): Promise<LeadAggregatorResult> {
  const start = Date.now()
  const maxResults = clamp(opts.maxResults ?? 30, 1, 200)
  const maxPagesPerSite = clamp(opts.maxPagesPerSite ?? 2, 1, 5)
  const fetchTimeoutMs = clamp(opts.fetchTimeoutMs ?? 10_000, 2_000, 30_000)
  const doExpand = opts.expandQueries !== false

  const emit = (e: LeadProgressEvent) => {
    try {
      opts.onProgress?.(e)
    } catch {}
  }

  const engineRegistry = (await import('./engines')).leadEngineRegistry
  const dirRegistry = (await import('./directories')).directoryRegistry
  const enabledEngines = (opts.engines?.length ? engineRegistry.filter((e) => opts.engines!.includes(e.name)) : engineRegistry).filter((e) => e.enabled())
  const enabledDirs = (opts.directories?.length ? dirRegistry.filter((d) => opts.directories!.includes(d.name)) : dirRegistry).filter((d) => d.enabled())

  emit({
    type: 'started',
    query: opts.query,
    engines: enabledEngines.map((e) => e.name),
    directories: enabledDirs.map((d) => d.name),
  })

  const allLeads: LeadOutput[] = []
  const allUrls: string[] = []
  const engineOutcomes: { engine: string; results: LeadSearchResult[]; durationMs: number; error?: LeadPipelineError }[] = []
  const directoryOutcomes: { directory: string; leads: StructuredLead[]; durationMs: number; error?: LeadPipelineError }[] = []
  const expandedQueriesUsed: string[] = []
  let passesRun = 0

  // 1) First pass — parallel search + parallel directories
  emit({ type: 'searching', query: opts.query, engines: enabledEngines.map((e) => e.name), pass: 1 })

  const [searchOutcome, directoryOutcome] = await Promise.all([
    parallelSearch(opts.query, {
      limit: Math.min(maxResults * 2, 80),
      location: opts.location,
      signal: opts.signal,
      engines: opts.engines,
    }),
    parallelDirectories(opts.query, {
      limit: Math.min(maxResults * 3, 120),
      location: opts.location,
      signal: opts.signal,
      directories: opts.directories,
    }),
  ])

  passesRun++

  engineOutcomes.push(...searchOutcome.perEngine)
  directoryOutcomes.push(...directoryOutcome.perDirectory)

  for (const o of searchOutcome.perEngine) {
    if (o.error) emit({ type: 'engine_failed', engine: o.engine, code: o.error.code, durationMs: o.durationMs, cause: o.error.causeDetail })
    else emit({ type: 'engine_ok', engine: o.engine, count: o.results.length, durationMs: o.durationMs })
  }
  for (const o of directoryOutcome.perDirectory) {
    if (o.error) emit({ type: 'directory_failed', directory: o.directory, code: o.error.code, durationMs: o.durationMs, cause: o.error.causeDetail })
    else emit({ type: 'directory_ok', directory: o.directory, count: o.leads.length, durationMs: o.durationMs })
  }

  const structuredLeads = directoryOutcome.leads.map(structuredToOutput)
  allLeads.push(...structuredLeads)
  emit({ type: 'structured_ready', count: structuredLeads.length, durationMs: directoryOutcome.durationMs })
  for (const l of structuredLeads) emit({ type: 'lead', lead: l })
  emit({ type: 'progress', step: 'search', percent: 15, message: `${structuredLeads.length} structured leads from ${directoryOutcome.ok} directories` })

  const urls = searchOutcome.results.map((r) => r.url).filter((u) => u.startsWith('http'))
  allUrls.push(...urls)

  emit({
    type: 'search_done',
    urls: urls.length,
    engines: searchOutcome.perEngine.map((o) => ({ name: o.engine, ok: o.results.length, failed: o.error ? 1 : 0, durationMs: o.durationMs })),
    durationMs: searchOutcome.durationMs,
  })

  // 2) Scrape pass
  let totalScraped = 0
  if (opts.scrape !== false && urls.length > 0 && !opts.signal?.aborted) {
    totalScraped = await runScrapePass(urls, allLeads, maxPagesPerSite, fetchTimeoutMs, opts.signal, emit, maxResults)
  }

  // 3) Query expansion pass
  let finalUnique = dedupeLeads(allLeads)
  if (doExpand && opts.scrape !== false && finalUnique.length < maxResults * 0.6 && !opts.signal?.aborted) {
    const variants = expandQueries(opts.query, opts.location).slice(0, 2)
    if (variants.length > 0) {
      expandedQueriesUsed.push(...variants)
      emit({ type: 'expansion', queries: variants, reason: 'underfilled' })
      emit({ type: 'progress', step: 'search', percent: 60, message: `Expansion: trying ${variants.length} variant queries` })

      const pass2 = await Promise.all(
        variants.map(async (v) => {
          const [s, d] = await Promise.all([
            parallelSearch(v, {
              limit: Math.min(maxResults, 40),
              location: opts.location,
              signal: opts.signal,
              engines: opts.engines,
            }),
            parallelDirectories(v, {
              limit: Math.min(maxResults, 40),
              location: opts.location,
              signal: opts.signal,
              directories: opts.directories,
            }),
          ])
          return { v, s, d }
        })
      )

      passesRun += variants.length

      for (const { s, d } of pass2) {
        engineOutcomes.push(...s.perEngine)
        directoryOutcomes.push(...d.perDirectory)
        for (const o of s.perEngine) {
          if (o.error) emit({ type: 'engine_failed', engine: o.engine, code: o.error.code, durationMs: o.durationMs, cause: o.error.causeDetail })
          else emit({ type: 'engine_ok', engine: o.engine, count: o.results.length, durationMs: o.durationMs })
        }
        for (const o of d.perDirectory) {
          if (o.error) emit({ type: 'directory_failed', directory: o.directory, code: o.error.code, durationMs: o.durationMs, cause: o.error.causeDetail })
          else emit({ type: 'directory_ok', directory: o.directory, count: o.leads.length, durationMs: o.durationMs })
        }
        const more = d.leads.map(structuredToOutput)
        allLeads.push(...more)
        for (const l of more) emit({ type: 'lead', lead: l })
        const moreUrls = s.results.map((r) => r.url).filter((u) => u.startsWith('http') && !allUrls.includes(u))
        allUrls.push(...moreUrls)
        if (moreUrls.length > 0 && !opts.signal?.aborted) {
          totalScraped += await runScrapePass(moreUrls, allLeads, 1, fetchTimeoutMs, opts.signal, emit, maxResults)
        }
      }
    }
  }

  if (opts.signal?.aborted) {
    emit({ type: 'aborted', reason: opts.signal.reason instanceof Error ? opts.signal.reason.message : 'user stop' })
  }

  finalUnique = dedupeLeads(allLeads).slice(0, maxResults)
  const csvContent = generateCSV(finalUnique)

  const failedEngines = engineOutcomes.filter((o) => o.error)
  const failedDirs = directoryOutcomes.filter((o) => o.error)

  const enginesUsed = [...new Set(engineOutcomes.filter((o) => !o.error).map((o) => o.engine))]
  const dirsUsed = [...new Set(directoryOutcomes.filter((o) => !o.error).map((o) => o.directory))]

  const result: LeadAggregatorResult = {
    leads: finalUnique,
    totalSearched: allUrls.length,
    totalScraped,
    totalStructured: directoryOutcomes.reduce((n, o) => n + o.leads.length, 0),
    csvContent,
    enginesUsed,
    directoriesUsed: dirsUsed,
    passesRun,
    errors: [...failedEngines, ...failedDirs].map((o) => {
      const err = (o as { error?: LeadPipelineError }).error!
      return { code: err.code, engine: 'engine' in o ? (o as { engine: string }).engine : (o as { directory: string }).directory, message: err.message }
    }),
    durationMs: Date.now() - start,
    metadata: {
      query: opts.query,
      location: opts.location,
      expandedQueries: expandedQueriesUsed,
      engines: uniqueBy(engineOutcomes, (o) => o.engine).map((o) => ({
        name: o.engine,
        ok: !o.error,
        count: o.results.length,
        durationMs: o.durationMs,
        code: o.error?.code,
      })),
      directories: uniqueBy(directoryOutcomes, (o) => o.directory).map((o) => ({
        name: o.directory,
        ok: !o.error,
        count: o.leads.length,
        durationMs: o.durationMs,
        code: o.error?.code,
      })),
    },
  }

  emit({ type: 'progress', step: 'done', percent: 100, message: `Done: ${finalUnique.length} leads (${result.totalStructured} structured + ${totalScraped} scraped pages)` })
  if (failedEngines.length + failedDirs.length > 0) emit({ type: 'partial', reason: 'partial_engines' })
  emit({
    type: 'complete',
    leads: finalUnique,
    totalSearched: result.totalSearched,
    totalScraped: result.totalScraped,
    durationMs: result.durationMs,
    enginesUsed: result.enginesUsed,
    directoriesUsed: result.directoriesUsed,
    passesRun: result.passesRun,
    errors: result.errors,
  })

  logger.info(
    `[LeadAggregator] query="${opts.query}" passes=${passesRun} engines=${enginesUsed.length} dirs=${dirsUsed.length} leads=${finalUnique.length} structured=${result.totalStructured} scraped=${totalScraped} durationMs=${result.durationMs}`
  )
  return result
}

async function runScrapePass(
  urls: string[],
  allLeads: LeadOutput[],
  maxPagesPerSite: number,
  fetchTimeoutMs: number,
  signal: AbortSignal | undefined,
  emit: (e: LeadProgressEvent) => void,
  maxResults: number
): Promise<number> {
  const perHost = new Map<string, string[]>()
  for (const url of urls) {
    try {
      const host = new URL(url).hostname
      const list = perHost.get(host) ?? []
      list.push(url)
      perHost.set(host, list)
    } catch {}
  }
  const limited: string[] = []
  for (const list of perHost.values()) limited.push(...list.slice(0, maxPagesPerSite))
  const urlsToScrape = limited.slice(0, Math.max(maxResults * 2, 30))

  emit({ type: 'scraping', total: urlsToScrape.length, completed: 0, currentUrl: '' })

  let completed = 0
  const total = urlsToScrape.length

  await workerPool(
    urlsToScrape,
    6,
    async (url) => {
      if (signal?.aborted) return
      const taskStart = Date.now()
      try {
        const html = await fetchHtml(url, signal ?? new AbortController().signal, fetchTimeoutMs)
        if (!html) {
          completed++
          emit({ type: 'scrape_failed', url, code: 'LEADS_PARSE_FAILED', durationMs: Date.now() - taskStart })
          return
        }
        const contacts = await extractContactData(html, url).catch(() => [])
        const leadsForTask = contacts.map((c) => toOutput(c, url))
        allLeads.push(...leadsForTask)
        completed++
        emit({ type: 'scrape_ok', url, leads: leadsForTask.length, durationMs: Date.now() - taskStart })
        for (const l of leadsForTask) emit({ type: 'lead', lead: l })
        emit({ type: 'extract', url, leads: leadsForTask.length })
        const percent = Math.round((completed / Math.max(total, 1)) * 55) + 20
        emit({ type: 'progress', step: 'scrape', percent, message: `Scraped ${completed}/${total} pages, ${allLeads.length} leads so far` })
      } catch (err) {
        completed++
        const code = err instanceof LeadPipelineError ? err.code : 'LEADS_FETCH_FAILED'
        const cause = err instanceof LeadPipelineError ? err.causeDetail : String(err)
        emit({ type: 'scrape_failed', url, code, durationMs: Date.now() - taskStart, cause })
      }
    },
    signal
  )

  return completed
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min
  return Math.min(Math.max(value, min), max)
}

function uniqueBy<T>(items: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>()
  const out: T[] = []
  for (const item of items) {
    const k = key(item)
    if (seen.has(k)) continue
    seen.add(k)
    out.push(item)
  }
  return out
}

// ── Catalog mirror (export for UI) ──────────────────────────────────────

export { LEAD_ERROR_CATALOG }
export { LeadPipelineError }
export { engineHealth } from './engines'
export { directoryHealth }
