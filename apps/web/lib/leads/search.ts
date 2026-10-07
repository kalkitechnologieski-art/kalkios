interface SearchResult { url: string; title: string; snippet: string }

// Hardcoded anti-spam domains — never used in leads
const BLOCKED_DOMAINS = [
  'linkedin.com/sales',
  'facebook.com/login',
  'twitter.com/login',
  'youtube.com',
  'reddit.com',
  'quora.com',
  'pinterest.com',
  'tiktok.com',
]

function isBlocked(url: string): boolean {
  return BLOCKED_DOMAINS.some((d) => url.includes(d))
}

function dedupe(results: SearchResult[]): SearchResult[] {
  const seen = new Set<string>()
  const out: SearchResult[] = []
  for (const r of results) {
    if (!r.url) continue
    if (seen.has(r.url)) continue
    if (isBlocked(r.url)) continue
    seen.add(r.url)
    out.push(r)
  }
  return out
}

async function searchSearXNG(query: string, limit: number, signal: AbortSignal): Promise<SearchResult[]> {
  const searxngUrl = process.env.SEARXNG_URL || 'http://localhost:8080'
  try {
    const response = await fetch(
      `${searxngUrl}/search?q=${encodeURIComponent(query)}&format=json&categories=general&engines=google,bing,duckduckgo&language=en`,
      { headers: { 'Accept': 'application/json' }, signal }
    )
    if (!response.ok) throw new Error(`SearXNG returned ${response.status}`)
    const data = await response.json() as { results?: Array<{ url?: string; title?: string; content?: string }> }
    const results = data.results || []
    return results.slice(0, limit).map((r) => ({
      url: r.url || '',
      title: r.title || '',
      snippet: r.content || '',
    }))
  } catch (error) {
    console.error('SearXNG search failed:', error)
    return []
  }
}

async function searchDuckDuckGo(query: string, limit: number, signal: AbortSignal): Promise<SearchResult[]> {
  // DDG HTML endpoint — no API key required, returns a static HTML page.
  // We parse `<a class="result__a">` (title + href) and `<a class="result__snippet">`.
  try {
    const response = await fetch(
      `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}&kl=us-en`,
      {
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (compatible; SiddhiBot/1.0; +https://kalkicore.local)',
        },
        signal,
      }
    )
    if (!response.ok) throw new Error(`DuckDuckGo returned ${response.status}`)
    const html = await response.text()

    const blocks = html.split(/class="result\s+result--type-organic|class="result\s+links_main/).slice(1) || []
    const out: SearchResult[] = []
    for (const block of blocks) {
      const titleMatch = block.match(/class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
        || block.match(/<a[^>]+class="result__a"[^>]*>([\s\S]*?)<\/a>/)
      if (!titleMatch) continue
      const url = titleMatch[1] || ''
      const title = titleMatch[2]?.replace(/<[^>]+>/g, '').trim() || ''
      const snippetMatch = block.match(/class="result__snippet[^"]*"[^>]*>([\s\S]*?)<\//)
      const snippet = snippetMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || ''
      out.push({ url, title, snippet })
      if (out.length >= limit) break
    }
    return out
  } catch (error) {
    console.error('DuckDuckGo search failed:', error)
    return []
  }
}

async function searchBing(query: string, limit: number, signal: AbortSignal): Promise<SearchResult[]> {
  // Bing public HTML scrape. Bing rate-limits anonymous requests aggressively,
  // so we only fall back here when SearXNG and DuckDuckGo both returned nothing.
  try {
    const response = await fetch(
      `https://www.bing.com/search?q=${encodeURIComponent(query)}&count=${limit}&setlang=en`,
      {
        headers: {
          'Accept': 'text/html,application/xhtml+xml',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        },
        signal,
      }
    )
    if (!response.ok) throw new Error(`Bing returned ${response.status}`)
    const html = await response.text()
    const out: SearchResult[] = []
    // Bing results are wrapped in <li class="b_algo"> blocks
    const blocks = html.split('<li class="b_algo"').slice(1) || []
    for (const block of blocks) {
      const linkMatch = block.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/)
      if (!linkMatch) continue
      const url = linkMatch[1] || ''
      const title = linkMatch[2]?.replace(/<[^>]+>/g, '').trim() || ''
      const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/)
      const snippet = snippetMatch?.[1]?.replace(/<[^>]+>/g, '').trim() || ''
      out.push({ url, title, snippet })
      if (out.length >= limit) break
    }
    return out
  } catch (error) {
    console.error('Bing search failed:', error)
    return []
  }
}

export async function searchWeb(query: string, limit: number = 50): Promise<SearchResult[]> {
  // Single 12s budget shared across all engines, with cascading fallback.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12_000)

  try {
    const merged: SearchResult[] = []

    const searx = await searchSearXNG(query, limit, controller.signal)
    if (searx.length > 0) merged.push(...searx)

    // If primary didn't yield enough, try DuckDuckGo
    if (merged.length < limit) {
      const remaining = limit - merged.length
      const ddg = await searchDuckDuckGo(query, remaining, controller.signal)
      merged.push(...ddg)
    }

    // Last resort: Bing
    if (merged.length < Math.min(10, limit)) {
      const remaining = Math.max(limit - merged.length, 10)
      const bing = await searchBing(query, remaining, controller.signal)
      merged.push(...bing)
    }

    return dedupe(merged).slice(0, limit)
  } catch (error) {
    console.error('Search cascade failed:', error)
    return []
  } finally {
    clearTimeout(timeout)
  }
}