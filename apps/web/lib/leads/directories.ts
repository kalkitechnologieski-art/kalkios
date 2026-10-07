// ═══ LEADGEN v3 BUSINESS DIRECTORIES ═══
// Structured, no-key business listing sources. Unlike web-search engines
// (which return URLs that still need scraping), these return already-shaped
// lead records: name + phone + website + address. They run in parallel with
// the web engines inside the aggregator.
//
// Sources:
//   - OpenStreetMap Overpass API  (world-wide, no key, business POIs)
//   - GitHub orgs search          (no key, ~10/min unauth)
//   - Wikidata SPARQL             (companies with website/HQ/phone)
//   - Justdial                    (best-effort HTML, India SMBs)
//   - Sulekha                     (best-effort HTML, India SMBs)
//   - IndiaMART                   (best-effort HTML, India B2B)
//   - ProductHunt                 (best-effort HTML, SaaS startups)
// ─────────────────────────────────────────────────────────────────────────────

import { logger } from '@/lib/utils/logger'
import { CircuitBreaker, CircuitBreakerError } from '@/lib/ai/resilience'
import { LeadPipelineError } from './errors'

export interface StructuredLead {
  name: string | null
  email: string | null
  phone: string | null
  company: string | null
  website: string | null
  jobTitle: string | null
  linkedinUrl: string | null
  twitterUrl: string | null
  facebookUrl: string | null
  instagramUrl: string | null
  city: string | null
  country: string | null
  address: string | null
  metaDescription: string | null
  source: string
  sourceUrl: string
  confidence: number
  category: string | null
  lat: number | null
  lng: number | null
  extractedAt: string
}

export interface DirectoryContext {
  query: string
  location?: string
  limit: number
  signal: AbortSignal
}

interface DirectoryConfig {
  name: string
  enabled: () => boolean
  fetch: (ctx: DirectoryContext) => Promise<StructuredLead[]>
  timeoutMs: number
  circuit: CircuitBreaker
}

const OSM_BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const OSM_BOT_UA = 'SiddhiBot/3.0 (KalkiCore lead intelligence; +https://kalkicore.com)'

function newBreaker(): CircuitBreaker {
  return new CircuitBreaker({ failureThreshold: 5, recoveryTimeoutMs: 120_000, halfOpenMaxRequests: 2 })
}

async function fetchWithTimeout(url: string, opts: RequestInit, ms: number, externalSignal?: AbortSignal): Promise<Response> {
  const ctrl = new AbortController()
  const tid = setTimeout(() => ctrl.abort(new DOMException('timeout', 'AbortError')), ms)
  const onAbort = () => ctrl.abort(externalSignal?.reason ?? new DOMException('aborted', 'AbortError'))
  if (externalSignal) {
    if (externalSignal.aborted) onAbort()
    else externalSignal.addEventListener('abort', onAbort, { once: true })
  }
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal })
  } finally {
    clearTimeout(tid)
    externalSignal?.removeEventListener('abort', onAbort)
  }
}

function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null
  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const u = new URL(candidate)
    if (!/^https?:$/.test(u.protocol)) return null
    return u.toString()
  } catch {
    return null
  }
}

function stripTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// ── OpenStreetMap Overpass ─────────────────────────────────────────────────
// Overpass QL returns fully structured business nodes (name + phone + website
// + address + opening hours + category). No key, world-wide, generous free
// tier (60 req/min shared). Query is intentionally tight (name match OR
// amenity/shop office within a city) to avoid timeouts.

interface OverpassElement {
  type: 'node' | 'way' | 'relation'
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

function buildOverpassQuery(query: string, location?: string, limit: number = 60): string {
  const q = query.replace(/["\\]/g, '').trim()
  const loc = (location || '').replace(/["\\]/g, '').trim()
  const wordList = q.split(/\s+/).filter((w) => w.length > 2).slice(0, 4)
  const nameOr = wordList.map((w) => `["name"~"${w}" i]`).join('')
  const areaFilter = loc ? `area["name"~"${loc}" i]->.a;` : ''
  const bounding = loc ? '(area.a)' : '(if.t.count()>0)'
  return [
    '[out:json][timeout:20];',
    areaFilter,
    '(' +
      `node${nameOr}["phone"]${bounding};` +
      `node${nameOr}["contact:phone"]${bounding};` +
      `node${nameOr}["website"]${bounding};` +
      `way${nameOr}["phone"]${bounding};` +
      `node["shop"${q ? `]["name"~"${q}" i]${bounding};` : bounding + ';'}` +
      `node["amenity"~"office|company|craft"]${bounding};`,
    ');',
    `out center tags ${Math.min(limit, 255)};`,
  ]
    .filter(Boolean)
    .join('\n')
}

function overpassToLead(el: OverpassElement, query: string): StructuredLead | null {
  const t = el.tags ?? {}
  const name = t.name || t['office:name'] || t.operator
  if (!name) return null
  const website = safeUrl(t.website ?? t['contact:website'] ?? t['website:ref'])
  const phone = t.phone || t['contact:phone'] || t['phone:mobile'] || null
  const email = t.email || t['contact:email'] || null
  if (!website && !phone && !email) return null
  const addr = [t['addr:housenumber'], t['addr:street'], t['addr:suburb'], t['addr:city'], t['addr:state'], t['addr:postcode'], t['addr:country']]
    .filter(Boolean)
    .join(', ')
  const lat = el.lat ?? el.center?.lat ?? null
  const lng = el.lon ?? el.center?.lon ?? null
  const category = t.shop || t.amenity || t.office || t.craft || null
  let conf = 20
  if (email) conf += 30
  if (phone) conf += 25
  if (website) conf += 20
  if (addr) conf += 10
  if (category) conf += 5
  if (name.toLowerCase().includes(query.toLowerCase().split(/\s+/)[0] ?? '')) conf += 5
  return {
    name,
    email: email?.toLowerCase() ?? null,
    phone,
    company: t['operator'] || t['brand'] || name,
    website,
    jobTitle: null,
    linkedinUrl: safeUrl(t['contact:linkedin']),
    twitterUrl: safeUrl(t['contact:twitter']),
    facebookUrl: safeUrl(t['contact:facebook']),
    instagramUrl: safeUrl(t['contact:instagram']),
    city: t['addr:city'] || t['addr:town'] || t['addr:village'] || null,
    country: t['addr:country'] || null,
    address: addr || null,
    metaDescription: t['description'] || t['opening_hours'] || null,
    source: 'osm_overpass',
    sourceUrl: website || `https://www.openstreetmap.org/${el.type}/${el.id}`,
    confidence: Math.min(conf, 100),
    category,
    lat,
    lng,
    extractedAt: new Date().toISOString(),
  }
}

async function fetchOsmOverpass(ctx: DirectoryContext): Promise<StructuredLead[]> {
  const endpoints = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter', 'https://overpass.private.coffee/api/interpreter']
  const body = 'data=' + encodeURIComponent(buildOverpassQuery(ctx.query, ctx.location, ctx.limit))
  let lastErr: unknown = null
  for (const url of endpoints) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
            'User-Agent': OSM_BOT_UA,
          },
          body,
        },
        25_000,
        ctx.signal
      )
      if (response.status === 429 || response.status === 504) {
        lastErr = new LeadPipelineError({
          code: 'ENGINE_OSM_OVERPASS_RATE',
          message: `Overpass ${response.status}`,
          retryable: true,
          engine: 'osm',
        })
        continue
      }
      if (!response.ok) {
        lastErr = new LeadPipelineError({
          code: 'ENGINE_OSM_OVERPASS_FAILED',
          message: `Overpass ${response.status}`,
          retryable: response.status >= 500,
          engine: 'osm',
        })
        continue
      }
      const data = (await response.json()) as { elements?: OverpassElement[] }
      const out: StructuredLead[] = []
      const seen = new Set<string>()
      for (const el of data.elements ?? []) {
        const lead = overpassToLead(el, ctx.query)
        if (!lead) continue
        const key = (lead.name || '').toLowerCase() + '|' + (lead.phone ?? lead.website ?? '')
        if (seen.has(key)) continue
        seen.add(key)
        out.push(lead)
        if (out.length >= ctx.limit) break
      }
      if (out.length > 0) return out
    } catch (err) {
      lastErr = err
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new LeadPipelineError({
          code: 'ENGINE_OSM_OVERPASS_TIMEOUT',
          message: 'Overpass timeout',
          retryable: true,
          engine: 'osm',
        })
      }
      continue
    }
  }
  if (lastErr instanceof LeadPipelineError) throw lastErr
  throw new LeadPipelineError({
    code: 'ENGINE_OSM_OVERPASS_FAILED',
    message: 'Overpass returned no leads',
    retryable: false,
    engine: 'osm',
  })
}

// ── GitHub organisation search ───────────────────────────────────────────
// Unauthenticated 10 req/min. Returns orgs whose public profile matches the
// query (name/description/location). Their html_url is scrapeable for contact
// info; we also read the profile fields (blog, email via users endpoint).

async function fetchGithubOrgs(ctx: DirectoryContext): Promise<StructuredLead[]> {
  const q = ctx.location ? `${ctx.query} in:${ctx.location} type:org` : `${ctx.query} type:org`
  const url = `https://api.github.com/search/users?q=${encodeURIComponent(q)}&per_page=${Math.min(ctx.limit, 30)}&sort=followers&order=desc`
  const response = await fetchWithTimeout(
    url,
    { headers: { 'Accept': 'application/vnd.github+json', 'User-Agent': OSM_BOT_UA, 'X-GitHub-Api-Version': '2022-11-28' }, cache: 'no-store' },
    9_000,
    ctx.signal
  )
  if (response.status === 403 || response.status === 429) {
    throw new LeadPipelineError({ code: 'ENGINE_GITHUB_ORGS_RATE', message: `GitHub rate limited (${response.status})`, retryable: true, engine: 'github' })
  }
  if (!response.ok) {
    throw new LeadPipelineError({ code: 'ENGINE_GITHUB_ORGS_FAILED', message: `GitHub ${response.status}`, retryable: response.status >= 500, engine: 'github' })
  }
  const data = (await response.json()) as {
    items?: Array<{
      login: string
      html_url: string
      type: string
      name?: string | null
      location?: string | null
      email?: string | null
      blog?: string | null
      description?: string | null
    }>
  }
  const out: StructuredLead[] = []
  for (const item of data.items ?? []) {
    if (item.type !== 'Organization') continue
    const website = safeUrl(item.blog ?? null)
    const conf = (item.email ? 40 : 0) + (website ? 25 : 0) + (item.location ? 10 : 0) + 20
    const cityGuess = item.location?.split(/[,]/)[0]?.trim() || null
    const countryGuess = item.location?.split(/[,]/).pop()?.trim() || null
    out.push({
      name: item.name || item.login,
      email: item.email?.toLowerCase() || null,
      phone: null,
      company: item.name || item.login,
      website,
      jobTitle: null,
      linkedinUrl: null,
      twitterUrl: null,
      facebookUrl: null,
      instagramUrl: null,
      city: cityGuess,
      country: countryGuess,
      address: item.location || null,
      metaDescription: item.description || null,
      source: 'github_org',
      sourceUrl: website || item.html_url,
      confidence: Math.min(conf, 100),
      category: 'technology',
      lat: null,
      lng: null,
      extractedAt: new Date().toISOString(),
    })
    if (out.length >= ctx.limit) break
  }
  return out
}

// ── Wikidata SPARQL (companies) ──────────────────────────────────────────
// Queries for ?item that is an instance of company/organisation/business,
// filtered by substring label match + optional location. Returns website
// (P856), phone (P1324 or P2663), HQ location (P159).

function buildWikidataSparql(query: string, location?: string, limit: number = 40): string {
  const q = query.replace(/["\\]/g, '').trim()
  const loc = location ? location.replace(/["\\]/g, '').trim() : null
  const filter = loc
    ? `FILTER(CONTAINS(LCASE(STR(?label)), LCASE("${q}")) || CONTAINS(LCASE(COALESCE(STR(?desc), '')), LCASE("${q}")))
      FILTER(CONTAINS(LCASE(COALESCE(STR(?hqLabel), '')), LCASE("${loc}")))`
    : `FILTER(CONTAINS(LCASE(STR(?label)), LCASE("${q}")) || CONTAINS(LCASE(COALESCE(STR(?desc), '')), LCASE("${q}")))`
  return `
PREFIX wdt: <http://www.wikidata.org/prop/direct/>
PREFIX rdfs: <http://www.w3.org/2000/01/ns/rdf#>
SELECT ?item ?itemLabel ?desc ?website ?phone ?hqLabel ?email WHERE {
  VALUES ?type { wd:Q715 wd:Q7871393 wd:Q7270 wd:Q473972 wd:Q6886911 }
  ?item wdt:P31/wdt:P279* ?type .
  ?item rdfs:label ?label FILTER(LANG(?label) = 'en') .
  OPTIONAL { ?item schema:description ?desc FILTER(LANG(?desc) = 'en') }
  OPTIONAL { ?item wdt:P856 ?website }
  OPTIONAL { ?item wdt:P1324 ?phone }
  OPTIONAL { ?item wdt:P2663 ?phone }
  OPTIONAL { ?item wdt:P968 ?email }
  OPTIONAL { ?item wdt:P159 ?hq OPTIONAL { ?hq rdfs:label ?hqLabel FILTER(LANG(?hqLabel) = 'en') } }
  ${filter}
}
LIMIT ${Math.min(limit, 60)}
`.trim()
}

async function fetchWikidataSparql(ctx: DirectoryContext): Promise<StructuredLead[]> {
  const endpoint = 'https://query.wikidata.org/sparql'
  const sparql = buildWikidataSparql(ctx.query, ctx.location, ctx.limit)
  const url = `${endpoint}?query=${encodeURIComponent(sparql)}&format=json`
  const response = await fetchWithTimeout(
    url,
    { headers: { 'Accept': 'application/sparql-results+json', 'User-Agent': OSM_BOT_UA } },
    15_000,
    ctx.signal
  )
  if (!response.ok) {
    throw new LeadPipelineError({
      code: 'ENGINE_WIKIDATA_SPARQL_FAILED',
      message: `Wikidata SPARQL ${response.status}`,
      retryable: response.status >= 500 || response.status === 429,
      engine: 'wikidata-sparql',
    })
  }
  const data = (await response.json()) as {
    head?: { vars: string[] }
    results?: { bindings?: Array<Record<string, { value: string }>> }
  }
  const out: StructuredLead[] = []
  for (const b of data.results?.bindings ?? []) {
    const name = b.itemLabel?.value
    if (!name) continue
    const websiteRaw = b.website?.value
    const website = safeUrl(websiteRaw)
    const phone = b.phone?.value ?? null
    const emailRaw = b.email?.value ?? null
    const email = emailRaw?.replace(/^mailto:/i, '').toLowerCase() ?? null
    const hq = b.hqLabel?.value ?? null
    if (!website && !phone && !email) continue
    const itemUri = b.item?.value ?? ''
    const wikidataId = itemUri.split('/').pop() ?? ''
    let conf = 25
    if (email) conf += 30
    if (phone) conf += 20
    if (website) conf += 20
    if (hq) conf += 5
    out.push({
      name,
      email,
      phone,
      company: name,
      website,
      jobTitle: null,
      linkedinUrl: null,
      twitterUrl: null,
      facebookUrl: null,
      instagramUrl: null,
      city: hq ? hq.split(/[,]/)[0]?.trim() ?? null : null,
      country: hq ? hq.split(/[,]/).pop()?.trim() ?? null : null,
      address: hq,
      metaDescription: b.desc?.value ?? null,
      source: 'wikidata_sparql',
      sourceUrl: website || `https://www.wikidata.org/wiki/${wikidataId}`,
      confidence: Math.min(conf, 100),
      category: 'company',
      lat: null,
      lng: null,
      extractedAt: new Date().toISOString(),
    })
    if (out.length >= ctx.limit) break
  }
  return out
}

// ── Justdial (best-effort HTML) ─────────────────────────────────────────
// India SMB directory. Public listing pages embed `<a class="lnk listing">`
// and JSON-LD `Organization`. Blocked from many IPs; circuit breaker absorbs
// the noise when it happens.

async function fetchJustdial(ctx: DirectoryContext): Promise<StructuredLead[]> {
  const location = ctx.location || 'india'
  const url = `https://www.justdial.com/${encodeURIComponent(location)}/${encodeURIComponent(ctx.query)}`
  const response = await fetchWithTimeout(
    url,
    { headers: { 'Accept': 'text/html,application/xhtml+xml', 'User-Agent': OSM_BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9' } },
    12_000,
    ctx.signal
  )
  const status = response.status
  if (status === 403 || status === 451) {
    throw new LeadPipelineError({ code: 'ENGINE_JUSTDIAL_BLOCKED', message: `Justdial blocked (${status})`, retryable: false, engine: 'justdial' })
  }
  if (!response.ok) {
    throw new LeadPipelineError({ code: 'ENGINE_JUSTDIAL_FAILED', message: `Justdial ${status}`, retryable: status >= 500, engine: 'justdial' })
  }
  const html = await response.text()
  const out: StructuredLead[] = []
  const blocks = html.split(/<div class="col-xs-8 lst-dtls">/).slice(1)
  for (const block of blocks) {
    const nameMatch = block.match(/<a[^>]*class="[^"]*trunc[^"]*"[^>]*>([^<]+)<\/a>/i)
    const phoneMatch = block.match(/href="tel:\+?([\d\s-]{7,})"/i)
    const websiteMatch = block.match(/href="(https?:\/\/[^"]+)"[^>]*>Website</i)
    const addressMatch = block.match(/class="adr-add">([^<]+)</i)
    const name = nameMatch ? stripTags(nameMatch[1] ?? '') : ''
    if (!name) continue
    const phone = phoneMatch ? `+${phoneMatch[1]!.replace(/\D/g, '')}` : null
    const website = safeUrl(websiteMatch?.[1] ?? null)
    let conf = 20
    if (phone) conf += 30
    if (website) conf += 25
    if (addressMatch) conf += 10
    out.push({
      name,
      email: null,
      phone,
      company: name,
      website,
      jobTitle: null,
      linkedinUrl: null,
      twitterUrl: null,
      facebookUrl: null,
      instagramUrl: null,
      city: ctx.location ?? null,
      country: 'India',
      address: addressMatch ? stripTags(addressMatch[1] ?? '') : null,
      metaDescription: null,
      source: 'justdial',
      sourceUrl: website || url,
      confidence: Math.min(conf, 100),
      category: 'smb',
      lat: null,
      lng: null,
      extractedAt: new Date().toISOString(),
    })
    if (out.length >= ctx.limit) break
  }
  return out
}

// ── Sulekha (best-effort HTML) ───────────────────────────────────────────

async function fetchSulekha(ctx: DirectoryContext): Promise<StructuredLead[]> {
  const location = (ctx.location || 'india').toLowerCase().replace(/\s+/g, '-')
  const q = ctx.query.toLowerCase().replace(/\s+/g, '-')
  const url = `https://www.sulekha.com/${q}/${location}`
  const response = await fetchWithTimeout(
    url,
    { headers: { 'Accept': 'text/html,application/xhtml+xml', 'User-Agent': OSM_BROWSER_UA } },
    12_000,
    ctx.signal
  )
  if (response.status === 403) {
    throw new LeadPipelineError({ code: 'ENGINE_SULEKHA_BLOCKED', message: 'Sulekha blocked', retryable: false, engine: 'sulekha' })
  }
  if (!response.ok) {
    throw new LeadPipelineError({ code: 'ENGINE_SULEKHA_FAILED', message: `Sulekha ${response.status}`, retryable: response.status >= 500, engine: 'sulekha' })
  }
  const html = await response.text()
  const out: StructuredLead[] = []
  const ldJsons = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi) ?? []
  for (const raw of ldJsons) {
    const body = raw.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '')
    let parsed: unknown
    try {
      parsed = JSON.parse(body)
    } catch {
      continue
    }
    const nodes = Array.isArray(parsed) ? parsed : [parsed]
    for (const node of nodes) {
      const obj = node as { '@type'?: string; name?: string; telephone?: string; address?: unknown; url?: string; email?: string }
      if (!obj || typeof obj !== 'object') continue
      if (!/LocalBusiness|Organization|Corporation/i.test(obj['@type'] ?? '')) continue
      const name = obj.name?.trim()
      if (!name) continue
      const phone = obj.telephone ?? null
      const website = safeUrl(obj.url ?? null)
      const addr = obj.address
      const city = typeof addr === 'object' && addr && 'addressLocality' in addr ? String((addr as { addressLocality?: unknown }).addressLocality ?? '') : null
      const country = typeof addr === 'object' && addr && 'addressCountry' in addr ? String((addr as { addressCountry?: unknown }).addressCountry ?? '') : 'India'
      let conf = 20
      if (obj.email) conf += 30
      if (phone) conf += 25
      if (website) conf += 20
      out.push({
        name,
        email: obj.email?.toLowerCase() ?? null,
        phone,
        company: name,
        website,
        jobTitle: null,
        linkedinUrl: null,
        twitterUrl: null,
        facebookUrl: null,
        instagramUrl: null,
        city: city || ctx.location || null,
        country,
        address: typeof addr === 'object' && addr && 'streetAddress' in addr ? String((addr as { streetAddress?: unknown }).streetAddress ?? '') : null,
        metaDescription: null,
        source: 'sulekha',
        sourceUrl: website || url,
        confidence: Math.min(conf, 100),
        category: 'smb',
        lat: null,
        lng: null,
        extractedAt: new Date().toISOString(),
      })
      if (out.length >= ctx.limit) return out
    }
  }
  return out
}

// ── IndiaMART (best-effort HTML) ────────────────────────────────────────

async function fetchIndiaMART(ctx: DirectoryContext): Promise<StructuredLead[]> {
  const url = `https://dir.indiamart.com/search.mp?ss=${encodeURIComponent(ctx.query)}`
  const response = await fetchWithTimeout(
    url,
    { headers: { 'Accept': 'text/html,application/xhtml+xml', 'User-Agent': OSM_BROWSER_UA } },
    12_000,
    ctx.signal
  )
  if (response.status === 403) {
    throw new LeadPipelineError({ code: 'ENGINE_INDIAMART_BLOCKED', message: 'IndiaMART blocked', retryable: false, engine: 'indiamart' })
  }
  if (!response.ok) {
    throw new LeadPipelineError({ code: 'ENGINE_INDIAMART_FAILED', message: `IndiaMART ${response.status}`, retryable: response.status >= 500, engine: 'indiamart' })
  }
  const html = await response.text()
  const out: StructuredLead[] = []
  const blocks = html.split(/class="cardsec /).slice(1)
  for (const block of blocks) {
    const nameMatch = block.match(/class="cmpn"\s*>([^<]+)</i)
    const cityMatch = block.match(/class="pctext">([^<]+)</i)
    const phoneMatch = block.match(/data-number="(\d+)"/i)
    const name = nameMatch ? stripTags(nameMatch[1] ?? '') : ''
    if (!name) continue
    const website = safeUrl(block.match(/href="(https?:\/\/[^"]*indiamart\/[^"]*ShowCompany[^"]*)"/i)?.[1] ?? null)
    const phone = phoneMatch ? `+91${phoneMatch[1]}` : null
    let conf = 15
    if (phone) conf += 30
    if (website) conf += 20
    if (cityMatch) conf += 5
    out.push({
      name,
      email: null,
      phone,
      company: name,
      website,
      jobTitle: null,
      linkedinUrl: null,
      twitterUrl: null,
      facebookUrl: null,
      instagramUrl: null,
      city: cityMatch ? stripTags(cityMatch[1] ?? '') : ctx.location ?? null,
      country: 'India',
      address: null,
      metaDescription: null,
      source: 'indiamart',
      sourceUrl: website || url,
      confidence: Math.min(conf, 100),
      category: 'b2b',
      lat: null,
      lng: null,
      extractedAt: new Date().toISOString(),
    })
    if (out.length >= ctx.limit) break
  }
  return out
}

// ── ProductHunt (best-effort HTML) ───────────────────────────────────────

async function fetchProductHunt(ctx: DirectoryContext): Promise<StructuredLead[]> {
  const url = `https://www.producthunt.com/search?q=${encodeURIComponent(ctx.query)}`
  const response = await fetchWithTimeout(
    url,
    { headers: { 'Accept': 'text/html,application/xhtml+xml', 'User-Agent': OSM_BROWSER_UA } },
    10_000,
    ctx.signal
  )
  if (!response.ok) {
    throw new LeadPipelineError({ code: 'ENGINE_PRODUCTHUNT_FAILED', message: `ProductHunt ${response.status}`, retryable: response.status >= 500, engine: 'producthunt' })
  }
  const html = await response.text()
  const out: StructuredLead[] = []
  const nameRe = /data-test="post-name-[^"]*"[^>]*>([^<]+)</gi
  let m: RegExpExecArray | null
  while ((m = nameRe.exec(html)) !== null && out.length < ctx.limit) {
    const name = stripTags(m[1] ?? '')
    if (!name) continue
    out.push({
      name,
      email: null,
      phone: null,
      company: name,
      website: null,
      jobTitle: null,
      linkedinUrl: null,
      twitterUrl: null,
      facebookUrl: null,
      instagramUrl: null,
      city: null,
      country: null,
      address: null,
      metaDescription: null,
      source: 'producthunt',
      sourceUrl: url,
      confidence: 10,
      category: 'saas',
      lat: null,
      lng: null,
      extractedAt: new Date().toISOString(),
    })
  }
  return out
}

// ── Registry ─────────────────────────────────────────────────────────────

export const directoryRegistry: DirectoryConfig[] = [
  { name: 'osm', enabled: () => true, fetch: fetchOsmOverpass, timeoutMs: 30_000, circuit: newBreaker() },
  { name: 'wikidata-sparql', enabled: () => true, fetch: fetchWikidataSparql, timeoutMs: 20_000, circuit: newBreaker() },
  { name: 'github', enabled: () => true, fetch: fetchGithubOrgs, timeoutMs: 12_000, circuit: newBreaker() },
  { name: 'justdial', enabled: () => true, fetch: fetchJustdial, timeoutMs: 12_000, circuit: newBreaker() },
  { name: 'sulekha', enabled: () => true, fetch: fetchSulekha, timeoutMs: 12_000, circuit: newBreaker() },
  { name: 'indiamart', enabled: () => true, fetch: fetchIndiaMART, timeoutMs: 12_000, circuit: newBreaker() },
  { name: 'producthunt', enabled: () => true, fetch: fetchProductHunt, timeoutMs: 10_000, circuit: newBreaker() },
]

export interface DirectoryOutcome {
  directory: string
  leads: StructuredLead[]
  durationMs: number
  error?: LeadPipelineError
}

async function runDirectory(dir: DirectoryConfig, ctx: DirectoryContext): Promise<DirectoryOutcome> {
  const start = Date.now()
  if (!dir.enabled()) return { directory: dir.name, leads: [], durationMs: 0 }
  try {
    const leads = await dir.circuit.execute(() => dir.fetch(ctx))
    return { directory: dir.name, leads, durationMs: Date.now() - start }
  } catch (error) {
    const converted =
      error instanceof LeadPipelineError
        ? error
        : error instanceof CircuitBreakerError
        ? new LeadPipelineError({ code: 'LEADS_CIRCUIT_OPEN', message: error.message, retryable: true, engine: dir.name })
        : error instanceof DOMException && error.name === 'AbortError'
        ? new LeadPipelineError({ code: 'ENGINE_OSM_OVERPASS_TIMEOUT', message: `${dir.name} aborted`, retryable: true, engine: dir.name })
        : new LeadPipelineError({ code: 'LEADS_INTERNAL_ERROR', message: String((error as { message?: string })?.message ?? 'unknown'), retryable: true, engine: dir.name, cause: String(error) })
    return { directory: dir.name, leads: [], durationMs: Date.now() - start, error: converted }
  }
}

export interface ParallelDirectoryOutcome {
  leads: StructuredLead[]
  perDirectory: DirectoryOutcome[]
  durationMs: number
  ok: number
  failed: number
}

export async function parallelDirectories(
  query: string,
  options: { limit?: number; location?: string; signal?: AbortSignal; directories?: string[] } = {}
): Promise<ParallelDirectoryOutcome> {
  const start = Date.now()
  const limit = options.limit ?? 60
  const ctx: DirectoryContext = {
    query,
    location: options.location,
    limit,
    signal: options.signal ?? new AbortController().signal,
  }
  const targets = (options.directories?.length
    ? directoryRegistry.filter((d) => options.directories!.includes(d.name))
    : directoryRegistry
  ).filter((d) => d.enabled())

  const outcomes = await Promise.all(targets.map((d) => runDirectory(d, ctx)))

  const byKey = new Map<string, StructuredLead>()
  for (const o of outcomes) {
    for (const lead of o.leads) {
      const key =
        lead.email?.toLowerCase() ||
        lead.phone ||
        (lead.name || '').toLowerCase() + '|' + (lead.website ?? lead.sourceUrl)
      if (!key) continue
      const existing = byKey.get(key)
      if (!existing || lead.confidence > existing.confidence) byKey.set(key, lead)
    }
  }
  const merged = [...byKey.values()].sort((a, b) => b.confidence - a.confidence).slice(0, limit)

  for (const o of outcomes) {
    if (o.error) logger.warn(`[Directories] ${o.directory} failed: ${o.error.code} in ${o.durationMs}ms`)
    else logger.info(`[Directories] ${o.directory} returned ${o.leads.length} in ${o.durationMs}ms`)
  }

  return {
    leads: merged,
    perDirectory: outcomes,
    durationMs: Date.now() - start,
    ok: outcomes.filter((o) => !o.error).length,
    failed: outcomes.filter((o) => o.error).length,
  }
}

export function directoryHealth(): Record<string, { state: string; failures: number }> {
  const out: Record<string, { state: string; failures: number }> = {}
  for (const d of directoryRegistry) {
    const m = d.circuit.getMetrics()
    out[d.name] = { state: m.state, failures: m.failures }
  }
  return out
}
