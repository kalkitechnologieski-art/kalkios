// ═══ LEADGEN v3 ENGINE STACK ═══
// Parallel multi-source search engines. All engines share a single fetch
// implementation, per-engine circuit breakers, hardcoded timeouts, and
// structured error codes.
// ─────────────────────────────────────────────────────────────────────────────

import { logger } from '@/lib/utils/logger'
import { CircuitBreaker, CircuitBreakerError } from '@/lib/ai/resilience'
import { LeadPipelineError } from './errors'

export interface LeadSearchResult {
  url: string
  title: string
  snippet: string
  engine: string
  relevance: number
}

export interface EngineContext {
  query: string
  location?: string
  limit: number
  signal: AbortSignal
}

interface EngineConfig {
  name: string
  enabled: () => boolean
  fetch: (ctx: EngineContext) => Promise<LeadSearchResult[]>
  timeoutMs: number
  retries: number
  circuit: CircuitBreaker
}

const BRAVE_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const SEARCHBOT_USER_AGENT = 'Mozilla/5.0 (compatible; SiddhiBot/2.0; +https://kalkicore.local)'

// ── Helpers ────────────────────────────────────────────────────────────────

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ').replace(/&#x([0-9a-f]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
}

function stripTags(s: string): string {
  return decodeHtmlEntities(s.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim()
}

function safeParseUrl(raw: string): string | null {
  try {
    const u = new URL(raw)
    if (!/^https?:$/.test(u.protocol)) return null
    return u.toString()
  } catch { return null }
}

function classifyStatus(reply: number): 'rate' | 'blocked' | 'server' | 'client' | 'ok' {
  if (reply === 200) return 'ok'
  if (reply === 429) return 'rate'
  if (reply === 403 || reply === 451) return 'blocked'
  if (reply >= 500) return 'server'
  return 'client'
}

async function fetchWithTimeout(url: string, opts: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...opts, signal: controller.signal })
  } finally {
    clearTimeout(tid)
  }
}

// ── SearXNG ────────────────────────────────────────────────────────────────

async function fetchSearXNG(ctx: EngineContext): Promise<LeadSearchResult[]> {
  const baseUrl = process.env.SEARXNG_URL?.replace(/\/$/, '') || 'http://localhost:8080'
  const params = new URLSearchParams({
    q: ctx.location ? `${ctx.query} ${ctx.location}` : ctx.query,
    format: 'json',
    language: 'en',
    safesearch: '0',
    categories: 'general',
    engines: 'google,bing,duckduckgo,wikipedia,brave',
  })
  const url = `${baseUrl}/search?${params}`
  const response = await fetchWithTimeout(url, {
    headers: { 'Accept': 'application/json', 'User-Agent': SEARCHBOT_USER_AGENT },
  }, ctx.signal as never ? 12_000 : 12_000)

  const status = classifyStatus(response.status)
  if (status !== 'ok') {
    throw new LeadPipelineError({
      code: status === 'rate' ? 'ENGINE_SEARXNG_FAILED' : status === 'blocked' ? 'ENGINE_SEARXNG_FAILED' : 'ENGINE_SEARXNG_FAILED',
      message: `SearXNG ${response.status}`,
      retryable: status === 'rate' || status === 'server',
      engine: 'searxng',
      cause: status,
    })
  }
  const data = await response.json() as { results?: Array<{ title?: string; url?: string; content?: string }> }
  const results = (data.results || []).slice(0, ctx.limit)
  return results
    .map((r) => {
      const parsed = safeParseUrl(r.url || '')
      return parsed ? { url: parsed, title: r.title || '', snippet: r.content || '', engine: 'searxng', relevance: 0 } : null
    })
    .filter((r): r is LeadSearchResult => r !== null)
}

// ── DuckDuckGo HTML ────────────────────────────────────────────────────────

async function fetchDuckDuckGo(ctx: EngineContext): Promise<LeadSearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(ctx.query)}&kl=us-en`
  const response = await fetchWithTimeout(url, {
    headers: { 'Accept': 'text/html,application/xhtml+xml', 'User-Agent': SEARCHBOT_USER_AGENT },
  }, 10_000)

  const status = classifyStatus(response.status)
  if (status === 'blocked') {
    throw new LeadPipelineError({
      code: 'ENGINE_DUCKDUCKGO_BLOCKED',
      message: `DuckDuckGo blocked (${response.status})`,
      retryable: true,
      engine: 'duckduckgo',
      cause: status,
    })
  }
  if (status !== 'ok') {
    throw new LeadPipelineError({
      code: status === 'rate' ? 'ENGINE_DUCKDUCKGO_FAILED' : 'ENGINE_DUCKDUCKGO_FAILED',
      message: `DuckDuckGo ${response.status}`,
      retryable: status === 'rate' || status === 'server',
      engine: 'duckduckgo',
      cause: status,
    })
  }

  const html = await response.text()
  const blocks = html.split(/class="result\s/).slice(1)
  const out: LeadSearchResult[] = []
  for (const block of blocks) {
    const linkMatch = block.match(/class="result__a"[^>]*href="([^"]+)"/)
      || block.match(/href="\/\/duckduckgo\.com\/l\/\?uddg=([^&"]+)/)
    if (!linkMatch) continue
    const href = linkMatch[1]?.startsWith('//') ? `https:${linkMatch[1]}` : (linkMatch[1] ?? '')
    const decoded = href.includes('uddg=') ? decodeURIComponent(href.split('uddg=')[1]?.split('&')[0] ?? '') : href
    const parsed = safeParseUrl(decoded)
    if (!parsed) continue
    const titleMatch = block.match(/class="result__a"[^>]*>([\s\S]*?)<\/a>/)
    const title = titleMatch ? stripTags(titleMatch[1] ?? '') : ''
    const snippetMatch = block.match(/class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\//)
    const snippet = snippetMatch ? stripTags(snippetMatch[1] ?? '') : ''
    out.push({ url: parsed, title, snippet, engine: 'duckduckgo', relevance: 0 })
    if (out.length >= ctx.limit) break
  }
  return out
}

// ── Bing HTML ──────────────────────────────────────────────────────────────

async function fetchBing(ctx: EngineContext): Promise<LeadSearchResult[]> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(ctx.query)}&count=${ctx.limit}&setlang=en&cc=us`
  const response = await fetchWithTimeout(url, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
      'User-Agent': BRAVE_USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
    },
  }, 10_000)

  const status = classifyStatus(response.status)
  if (status === 'blocked') {
    throw new LeadPipelineError({
      code: 'ENGINE_BING_BLOCKED',
      message: `Bing blocked (${response.status})`,
      retryable: true,
      engine: 'bing',
      cause: status,
    })
  }
  if (status !== 'ok') {
    throw new LeadPipelineError({
      code: 'ENGINE_BING_FAILED',
      message: `Bing ${response.status}`,
      retryable: status === 'rate' || status === 'server',
      engine: 'bing',
      cause: status,
    })
  }
  const html = await response.text()
  const blocks = html.split(/<li class="b_algo"/).slice(1)
  const out: LeadSearchResult[] = []
  for (const block of blocks) {
    const linkMatch = block.match(/<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/)
    if (!linkMatch) continue
    const parsed = safeParseUrl(linkMatch[1] || '')
    if (!parsed) continue
    const title = stripTags(linkMatch[2] ?? '')
    const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/)
    const snippet = snippetMatch ? stripTags(snippetMatch[1] ?? '') : ''
    out.push({ url: parsed, title, snippet, engine: 'bing', relevance: 0 })
    if (out.length >= ctx.limit) break
  }
  return out
}

// ── Brave (free tier with key, optional) ───────────────────────────────────

async function fetchBrave(ctx: EngineContext): Promise<LeadSearchResult[]> {
  const key = process.env.BRAVE_SEARCH_API_KEY
  if (!key) {
    throw new LeadPipelineError({
      code: 'ENGINE_BRAVE_NO_KEY',
      message: 'BRAVE_SEARCH_API_KEY not configured',
      retryable: false,
      engine: 'brave',
    })
  }
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(ctx.query)}&count=${ctx.limit}`
  const response = await fetchWithTimeout(url, {
    headers: { 'Accept': 'application/json', 'X-Subscription-Token': key },
  }, 8_000)

  const status = classifyStatus(response.status)
  if (status === 'rate') {
    throw new LeadPipelineError({ code: 'ENGINE_BRAVE_QUOTA', message: 'Brave quota exceeded', retryable: true, engine: 'brave' })
  }
  if (status !== 'ok') {
    throw new LeadPipelineError({ code: 'ENGINE_BRAVE_FAILED', message: `Brave ${response.status}`, retryable: status === 'server', engine: 'brave' })
  }
  const data = await response.json() as { web?: { results?: Array<{ title?: string; url?: string; description?: string }> } }
  return (data.web?.results || []).slice(0, ctx.limit)
    .map((r) => {
      const parsed = safeParseUrl(r.url || '')
      return parsed ? { url: parsed, title: r.title || '', snippet: r.description || '', engine: 'brave', relevance: 0 } : null
    })
    .filter((r): r is LeadSearchResult => r !== null)
}

// ── Mojeek (no key, privacy-first; JSON then HTML fallback) ─────────────────

async function fetchMojeek(ctx: EngineContext): Promise<LeadSearchResult[]> {
  // Try JSON first
  try {
    const jsonUrl = `https://www.mojeek.com/search?q=${encodeURIComponent(ctx.query)}&fmt=json&count=${ctx.limit}`
    const response = await fetchWithTimeout(jsonUrl, {
      headers: { 'Accept': 'application/json', 'User-Agent': SEARCHBOT_USER_AGENT },
    }, 6_000)
    if (response.ok) {
      const ct = response.headers.get('content-type') ?? ''
      if (ct.includes('json')) {
        const data = await response.json() as { results?: Array<{ title?: string; url?: string; desc?: string }> }
        return (data.results || []).slice(0, ctx.limit)
          .map((r) => {
            const parsed = safeParseUrl(r.url || '')
            return parsed ? { url: parsed, title: r.title || '', snippet: r.desc || '', engine: 'mojeek', relevance: 0 } : null
          })
          .filter((r): r is LeadSearchResult => r !== null)
      }
    }
  } catch { /* fall through to HTML */ }

  // HTML fallback
  const url = `https://www.mojeek.com/search?q=${encodeURIComponent(ctx.query)}`
  const response = await fetchWithTimeout(url, {
    headers: { 'Accept': 'text/html,application/xhtml+xml', 'User-Agent': SEARCHBOT_USER_AGENT },
  }, 8_000)
  const status = classifyStatus(response.status)
  if (status !== 'ok') {
    throw new LeadPipelineError({ code: 'ENGINE_MOJEEK_FAILED', message: `Mojeek ${response.status}`, retryable: status === 'server', engine: 'mojeek' })
  }
  const html = await response.text()
  // Mojeek results: <a class="ob">Title</a> with snippet <p class="s">desc</p>
  const blocks = html.split(/class="results/)[1]?.split(/<li[^>]*class="result[^"]*"/).slice(1) ?? []
  const out: LeadSearchResult[] = []
  for (const block of blocks) {
    const linkMatch = block.match(/<a[^>]+class="ob"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
    if (!linkMatch) continue
    const parsed = safeParseUrl(linkMatch[1] ?? '')
    if (!parsed) continue
    const title = stripTags(linkMatch[2] ?? '')
    const snippetMatch = block.match(/<p[^>]*class="s"[^>]*>([\s\S]*?)<\/p>/)
    const snippet = snippetMatch ? stripTags(snippetMatch[1] ?? '') : ''
    out.push({ url: parsed, title, snippet, engine: 'mojeek', relevance: 0 })
    if (out.length >= ctx.limit) break
  }
  return out
}

// ── Wikipedia (REST) ───────────────────────────────────────────────────────

async function fetchWikipedia(ctx: EngineContext): Promise<LeadSearchResult[]> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(ctx.query)}&format=json&utf8=1&origin=*&srlimit=${Math.min(ctx.limit, 20)}`
  const response = await fetchWithTimeout(url, { headers: { 'Accept': 'application/json', 'User-Agent': SEARCHBOT_USER_AGENT } }, 8_000)
  const status = classifyStatus(response.status)
  if (status !== 'ok') {
    throw new LeadPipelineError({ code: 'ENGINE_WIKIPEDIA_FAILED', message: `Wikipedia ${response.status}`, retryable: status === 'server', engine: 'wikipedia' })
  }
  const data = await response.json() as { query?: { search?: Array<{ title?: string; pageid?: number; snippet?: string }> } }
  return (data.query?.search || []).slice(0, ctx.limit)
    .map((r) => ({
      url: r.pageid ? `https://en.wikipedia.org/wiki/${encodeURIComponent(r.title || '')}` : '',
      title: r.title || '',
      snippet: stripTags(r.snippet || ''),
      engine: 'wikipedia',
      relevance: 0,
    }))
    .filter((r) => r.url)
}

// ── Wikidata (knowledge graph) ─────────────────────────────────────────────

async function fetchWikidata(ctx: EngineContext): Promise<LeadSearchResult[]> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(ctx.query)}&language=en&format=json&limit=${Math.min(ctx.limit, 20)}&origin=*`
  const response = await fetchWithTimeout(url, { headers: { 'Accept': 'application/json', 'User-Agent': SEARCHBOT_USER_AGENT } }, 8_000)
  const status = classifyStatus(response.status)
  if (status !== 'ok') {
    throw new LeadPipelineError({ code: 'ENGINE_WIKIDATA_FAILED', message: `Wikidata ${response.status}`, retryable: status === 'server', engine: 'wikidata' })
  }
  const data = await response.json() as { search?: Array<{ id?: string; label?: string; description?: string; url?: string }> }
  return (data.search || []).slice(0, ctx.limit)
    .map((r) => ({
      url: r.url || (r.id ? `https://www.wikidata.org/wiki/${r.id}` : ''),
      title: r.label || '',
      snippet: r.description || '',
      engine: 'wikidata',
      relevance: 0,
    }))
    .filter((r) => r.url)
}

// ── DuckDuckGo Lite (no-key alternative HTML endpoint) ─────────────────────

async function fetchDuckDuckGoLite(ctx: EngineContext): Promise<LeadSearchResult[]> {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(ctx.query)}`
  const response = await fetchWithTimeout(url, {
    headers: { 'Accept': 'text/html,application/xhtml+xml', 'User-Agent': SEARCHBOT_USER_AGENT },
  }, 10_000)

  const status = classifyStatus(response.status)
  if (status === 'blocked') {
    throw new LeadPipelineError({
      code: 'ENGINE_DUCKDUCKGO_BLOCKED',
      message: `DuckDuckGo lite blocked (${response.status})`,
      retryable: true,
      engine: 'duckduckgo-lite',
      cause: status,
    })
  }
  if (status !== 'ok') {
    throw new LeadPipelineError({
      code: 'ENGINE_DUCKDUCKGO_FAILED',
      message: `DuckDuckGo lite ${response.status}`,
      retryable: status === 'rate' || status === 'server',
      engine: 'duckduckgo-lite',
      cause: status,
    })
  }

  const html = await response.text()
  const out: LeadSearchResult[] = []
  // DDG Lite uses <a class="result-link"> wrapping the URL, with snippet in the next <td>
  const rowMatches = html.match(/<td[^>]*class="result-link"[^>]*>([\s\S]*?)<\/td>/g) ?? []
  for (const row of rowMatches) {
    const linkMatch = row.match(/href="([^"]+)"/)
    if (!linkMatch) continue
    const parsed = safeParseUrl(linkMatch[1] ?? '')
    if (!parsed) continue
    const title = stripTags(row)
    out.push({ url: parsed, title, snippet: '', engine: 'duckduckgo-lite', relevance: 0 })
    if (out.length >= ctx.limit) break
  }
  // Fallback: parse <a class="result__a"> if any
  if (out.length === 0) {
    const blocks = html.split(/class="result-link"/).slice(1)
    for (const block of blocks) {
      const linkMatch = block.match(/href="(https?:\/\/[^"]+)"/)
      if (!linkMatch) continue
      const parsed = safeParseUrl(linkMatch[1] ?? '')
      if (!parsed) continue
      const titleMatch = block.match(/>([^<]+)</)
      const title = titleMatch ? stripTags(titleMatch[1] ?? '') : ''
      out.push({ url: parsed, title, snippet: '', engine: 'duckduckgo-lite', relevance: 0 })
      if (out.length >= ctx.limit) break
    }
  }
  return out
}

// ── Startpage (no key, HTML) ────────────────────────────────────────────────

async function fetchStartpage(ctx: EngineContext): Promise<LeadSearchResult[]> {
  const url = `https://www.startpage.com/sp/search?query=${encodeURIComponent(ctx.query)}&cat=web&language=english`
  const response = await fetchWithTimeout(url, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
      'User-Agent': BRAVE_USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
    },
  }, 10_000)
  const status = classifyStatus(response.status)
  if (status !== 'ok') {
    throw new LeadPipelineError({ code: 'ENGINE_ECOSIA_FAILED', message: `Startpage ${response.status}`, retryable: status === 'server', engine: 'startpage' })
  }
  const html = await response.text()
  // Startpage wraps results in <div class="result">
  const blocks = html.split(/class="result"/).slice(1)
  const out: LeadSearchResult[] = []
  for (const block of blocks) {
    const linkMatch = block.match(/href="([^"]+)"/)
    if (!linkMatch) continue
    // Startpage uses /sp/ redirect URLs; we have to follow them, but accept them as-is for now
    const parsed = safeParseUrl(linkMatch[1] ?? '')
    if (!parsed) continue
    const titleMatch = block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)
    const title = titleMatch ? stripTags(titleMatch[1] ?? '') : ''
    const snippetMatch = block.match(/<p class="description">([\s\S]*?)<\/p>/)
    const snippet = snippetMatch ? stripTags(snippetMatch[1] ?? '') : ''
    out.push({ url: parsed, title, snippet, engine: 'startpage', relevance: 0 })
    if (out.length >= ctx.limit) break
  }
  return out
}

// ── Qwant (no key) ─────────────────────────────────────────────────────────

async function fetchQwant(ctx: EngineContext): Promise<LeadSearchResult[]> {
  const url = `https://api.qwant.com/v3/search/web?q=${encodeURIComponent(ctx.query)}&count=${ctx.limit}&locale=en_US&safesearch=0`
  const response = await fetchWithTimeout(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': BRAVE_USER_AGENT,
      'Origin': 'https://www.qwant.com',
      'Referer': 'https://www.qwant.com/',
    },
  }, 10_000)
  const status = classifyStatus(response.status)
  if (status !== 'ok') {
    throw new LeadPipelineError({ code: 'LEADS_FETCH_FAILED', message: `Qwant ${response.status}`, retryable: status === 'server', engine: 'qwant' })
  }
  const data = await response.json() as {
    data?: { result?: { items?: { mainline?: Array<{ items?: Array<{ title?: string; url?: string; desc?: string }> }> } } }
  }
  const items = data.data?.result?.items?.mainline?.flatMap((m) => m.items ?? []) ?? []
  return items.slice(0, ctx.limit)
    .map((r) => {
      const parsed = safeParseUrl(r.url ?? '')
      return parsed ? { url: parsed, title: r.title ?? '', snippet: r.desc ?? '', engine: 'qwant', relevance: 0 } : null
    })
    .filter((r): r is LeadSearchResult => r !== null)
}

// ── Ecosia (no key) ────────────────────────────────────────────────────────

async function fetchEcosia(ctx: EngineContext): Promise<LeadSearchResult[]> {
  const url = `https://www.ecosia.org/search?q=${encodeURIComponent(ctx.query)}`
  const response = await fetchWithTimeout(url, {
    headers: { 'Accept': 'text/html,application/xhtml+xml', 'User-Agent': SEARCHBOT_USER_AGENT },
  }, 10_000)
  const status = classifyStatus(response.status)
  if (status !== 'ok') {
    throw new LeadPipelineError({ code: 'ENGINE_ECOSIA_FAILED', message: `Ecosia ${response.status}`, retryable: status === 'server', engine: 'ecosia' })
  }
  const html = await response.text()
  const blocks = html.split(/<a class="result-title"/).slice(1)
  const out: LeadSearchResult[] = []
  for (const block of blocks) {
    const linkMatch = block.match(/href="(https?:\/\/[^"]+)"/)
    if (!linkMatch) continue
    const parsed = safeParseUrl(linkMatch[1] || '')
    if (!parsed) continue
    const title = stripTags(block.split('</a>')[0] ?? '')
    out.push({ url: parsed, title, snippet: '', engine: 'ecosia', relevance: 0 })
    if (out.length >= ctx.limit) break
  }
  return out
}

// ── Yandex (HTML scrape, no key) ───────────────────────────────────────────

async function fetchYandex(ctx: EngineContext): Promise<LeadSearchResult[]> {
  const url = `https://yandex.com/search/?text=${encodeURIComponent(ctx.query)}&web=1`
  const response = await fetchWithTimeout(url, {
    headers: {
      'Accept': 'text/html,application/xhtml+xml',
      'User-Agent': BRAVE_USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
    },
  }, 10_000)
  const status = classifyStatus(response.status)
  if (status !== 'ok') {
    throw new LeadPipelineError({ code: 'ENGINE_YANDEX_FAILED', message: `Yandex ${response.status}`, retryable: status === 'server', engine: 'yandex' })
  }
  const html = await response.text()
  const blocks = html.split(/Path Organic-Item"/).slice(1)
  const out: LeadSearchResult[] = []
  for (const block of blocks) {
    const linkMatch = block.match(/href="(https?:\/\/[^"]+)"/)
    if (!linkMatch) continue
    const parsed = safeParseUrl(linkMatch[1] || '')
    if (!parsed) continue
    const titleMatch = block.match(/OrganicTitle-Title[^>]*>([\s\S]*?)<\//)
    const title = titleMatch ? stripTags(titleMatch[1] ?? '') : ''
    out.push({ url: parsed, title, snippet: '', engine: 'yandex', relevance: 0 })
    if (out.length >= ctx.limit) break
  }
  return out
}

// ── Engine Registry ────────────────────────────────────────────────────────

function makeBreaker(): CircuitBreaker {
  return new CircuitBreaker({
    failureThreshold: 6,
    recoveryTimeoutMs: 90_000,
    halfOpenMaxRequests: 3,
  })
}

export const leadEngineRegistry: EngineConfig[] = [
  { name: 'searxng',     enabled: () => !!process.env.SEARXNG_URL,
    fetch: fetchSearXNG,     timeoutMs: 12_000, retries: 1, circuit: makeBreaker() },
  { name: 'duckduckgo',  enabled: () => true,
    fetch: fetchDuckDuckGo,  timeoutMs: 10_000, retries: 1, circuit: makeBreaker() },
  { name: 'duckduckgo-lite', enabled: () => true,
    fetch: fetchDuckDuckGoLite, timeoutMs: 10_000, retries: 1, circuit: makeBreaker() },
  { name: 'bing',        enabled: () => true,
    fetch: fetchBing,        timeoutMs: 10_000, retries: 1, circuit: makeBreaker() },
  { name: 'brave',       enabled: () => !!process.env.BRAVE_SEARCH_API_KEY,
    fetch: fetchBrave,       timeoutMs: 8_000,  retries: 1, circuit: makeBreaker() },
  { name: 'startpage',   enabled: () => true,
    fetch: fetchStartpage,   timeoutMs: 10_000, retries: 1, circuit: makeBreaker() },
  { name: 'mojeek',      enabled: () => true,
    fetch: fetchMojeek,      timeoutMs: 8_000,  retries: 1, circuit: makeBreaker() },
  { name: 'wikipedia',   enabled: () => true,
    fetch: fetchWikipedia,   timeoutMs: 8_000,  retries: 1, circuit: makeBreaker() },
  { name: 'wikidata',    enabled: () => true,
    fetch: fetchWikidata,    timeoutMs: 8_000,  retries: 1, circuit: makeBreaker() },
  { name: 'qwant',       enabled: () => true,
    fetch: fetchQwant,       timeoutMs: 10_000, retries: 1, circuit: makeBreaker() },
  { name: 'yandex',      enabled: () => true,
    fetch: fetchYandex,      timeoutMs: 10_000, retries: 1, circuit: makeBreaker() },
]

export function getEngine(name: string): EngineConfig | undefined {
  return leadEngineRegistry.find((e) => e.name === name)
}

export function engineHealth(): Record<string, { state: string; failures: number }> {
  const out: Record<string, { state: string; failures: number }> = {}
  for (const e of leadEngineRegistry) {
    const m = e.circuit.getMetrics()
    out[e.name] = { state: m.state, failures: m.failures }
  }
  return out
}

// ── Parallel Runner ───────────────────────────────────────────────────────

interface EngineOutcome {
  engine: string
  results: LeadSearchResult[]
  durationMs: number
  error?: LeadPipelineError
}

async function runEngine(engine: EngineConfig, ctx: EngineContext): Promise<EngineOutcome> {
  const start = Date.now()
  if (!engine.enabled()) {
    return { engine: engine.name, results: [], durationMs: 0 }
  }
  const mergedSignal = mergeSignals(ctx.signal, engine.timeoutMs)
  let lastError: LeadPipelineError | undefined
  for (let attempt = 0; attempt <= engine.retries; attempt++) {
    try {
      const results = await engine.circuit.execute(() =>
        engine.fetch({ ...ctx, signal: mergedSignal.signal })
      )
      const scored = scoreResults(results, ctx.query)
      mergedSignal.cancel()
      return { engine: engine.name, results: scored, durationMs: Date.now() - start }
    } catch (error) {
      const converted =
        error instanceof LeadPipelineError ? error :
        error instanceof CircuitBreakerError ? new LeadPipelineError({ code: 'LEADS_CIRCUIT_OPEN', message: error.message, retryable: true, engine: engine.name }) :
        error instanceof DOMException && error.name === 'AbortError' ?
          new LeadPipelineError({ code: 'LEADS_ENGINE_TIMEOUT' as never, message: `${engine.name} timeout`, retryable: true, engine: engine.name }) :
        new LeadPipelineError({ code: 'LEADS_INTERNAL_ERROR', message: String((error as { message?: string })?.message || 'unknown'), retryable: true, engine: engine.name, cause: String(error) })
      lastError = converted
      if (!converted.retryable) break
      await sleep(Math.min(400 * Math.pow(2, attempt), 2000))
    }
  }
  mergedSignal.cancel()
  return { engine: engine.name, results: [], durationMs: Date.now() - start, error: lastError }
}

function mergeSignals(external: AbortSignal, timeoutMs: number): { signal: AbortSignal; cancel: () => void } {
  const ctrl = new AbortController()
  const tid = setTimeout(() => ctrl.abort(new DOMException('timeout', 'AbortError')), timeoutMs)
  const onAbort = () => ctrl.abort(external?.reason ?? new DOMException('aborted', 'AbortError'))
  if (external) {
    if (external.aborted) onAbort()
    else external.addEventListener('abort', onAbort, { once: true })
  }
  return {
    signal: ctrl.signal,
    cancel: () => {
      clearTimeout(tid)
      external?.removeEventListener('abort', onAbort)
    },
  }
}

function sleep(ms: number): Promise<void> { return new Promise((r) => setTimeout(r, ms)) }

function scoreResults(results: LeadSearchResult[], query: string): LeadSearchResult[] {
  const q = query.toLowerCase()
  const words = q.split(/\s+/).filter((w) => w.length > 2)
  return results.map((r) => {
    const title = r.title.toLowerCase()
    const snippet = r.snippet.toLowerCase()
    let score = 0
    if (title.includes(q)) score += 10
    if (snippet.includes(q)) score += 5
    for (const w of words) {
      if (title.includes(w)) score += 2
      if (snippet.includes(w)) score += 1
    }
    return { ...r, relevance: score }
  })
}

// ── Public API ─────────────────────────────────────────────────────────────

export interface ParallelSearchOutcome {
  results: LeadSearchResult[]
  perEngine: EngineOutcome[]
  durationMs: number
  ok: number
  failed: number
}

export async function parallelSearch(
  query: string,
  options: { limit?: number; location?: string; signal?: AbortSignal; engines?: string[] } = {}
): Promise<ParallelSearchOutcome> {
  const start = Date.now()
  const limit = options.limit ?? 30
  const ctx: EngineContext = {
    query,
    location: options.location,
    limit,
    signal: options.signal ?? new AbortController().signal,
  }
  const targets = (options.engines?.length
    ? leadEngineRegistry.filter((e) => options.engines!.includes(e.name))
    : leadEngineRegistry).filter((e) => e.enabled())

  const outcomes = await Promise.all(targets.map((e) => runEngine(e, ctx)))

  // dedupe by URL, keep highest relevance
  const byUrl = new Map<string, LeadSearchResult>()
  for (const o of outcomes) {
    for (const r of o.results) {
      const key = r.url.split('?')[0]!.toLowerCase()
      const existing = byUrl.get(key)
      if (!existing || r.relevance > existing.relevance) byUrl.set(key, r)
    }
  }
  const merged = [...byUrl.values()].sort((a, b) => b.relevance - a.relevance).slice(0, limit)

  // log telemetry
  for (const o of outcomes) {
    if (o.error) logger.warn(`[LeadSearch] ${o.engine} failed: ${o.error.code} in ${o.durationMs}ms`)
    else logger.info(`[LeadSearch] ${o.engine} returned ${o.results.length} in ${o.durationMs}ms`)
  }

  return {
    results: merged,
    perEngine: outcomes,
    durationMs: Date.now() - start,
    ok: outcomes.filter((o) => !o.error).length,
    failed: outcomes.filter((o) => o.error).length,
  }
}