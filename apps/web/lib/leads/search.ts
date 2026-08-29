interface SearchResult { url: string; title: string; snippet: string }

export async function searchWeb(query: string, limit: number = 50): Promise<SearchResult[]> {
  const searxngUrl = process.env.SEARXNG_URL || 'http://localhost:8080'
  try {
    const response = await fetch(
      `${searxngUrl}/search?q=${encodeURIComponent(query)}&format=json&categories=general&engines=google,bing,duckduckgo&language=en`,
      { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(10000) }
    )
    if (!response.ok) throw new Error(`SearXNG returned ${response.status}`)
    const data = await response.json()
    const results = data.results || []
    return results.slice(0, limit).map((r: { url?: string; title?: string; content?: string }) => ({
      url: r.url || '',
      title: r.title || '',
      snippet: r.content || '',
    })).filter((r: SearchResult) => r.url && !r.url.includes('linkedin.com/sales'))
  } catch (error) {
    console.error('Search failed:', error)
    return []
  }
}
