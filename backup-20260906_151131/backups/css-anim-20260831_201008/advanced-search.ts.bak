import { chat } from './index'
import { webSearch } from './zhipu'

export interface SearchResult {
  title: string
  url: string
  snippet: string
  source: string
  date: string
  icon?: string
  score?: number
}

export class AdvancedSearch {
  private static instance: AdvancedSearch
  private searchEngines: string[] = ['search_pro', 'search_pro_sogou', 'search_pro_quark']

  static getInstance(): AdvancedSearch {
    if (!AdvancedSearch.instance) {
      AdvancedSearch.instance = new AdvancedSearch()
    }
    return AdvancedSearch.instance
  }

  async search(query: string, options?: {
    count?: number
    recency?: 'oneDay' | 'oneWeek' | 'oneMonth' | 'oneYear' | 'noLimit'
    domainFilter?: string
    engine?: 'search_pro' | 'search_pro_sogou' | 'search_pro_quark' | 'search_std'
  }): Promise<SearchResult[]> {
    const engine = options?.engine || 'search_pro'
    try {
      // Primary: Zhipu
      return await this.zhipuSearch(query, options)
    } catch (error) {
      console.warn(`Zhipu search failed, trying fallback: ${error}`)
      // Fallback to other Zhipu engines
      for (const fallbackEngine of this.searchEngines) {
        if (fallbackEngine === engine) continue
        try {
          return await this.zhipuSearch(query, { ...options, engine: fallbackEngine as any })
        } catch (e) {
          continue
        }
      }
      // Ultimate fallback: human-like scraping using a simple fetch with proper headers
      try {
        return await this.humanLikeSearch(query)
      } catch (e) {
        console.warn('Human-like fallback failed:', e)
        return []
      }
    }
  }

  private async zhipuSearch(query: string, options?: any): Promise<SearchResult[]> {
    const results = await webSearch(query, options?.count || 10)
    return results.map((r: any) => ({
      title: r.title,
      url: r.url,
      snippet: r.snippet,
      source: r.source,
      date: r.date || '',
    }))
  }

  private async humanLikeSearch(query: string): Promise<SearchResult[]> {
    // Use a public search API or fetch with proper headers
    // This simulates a human search request
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    try {
      // Use DuckDuckGo API (free, no key required)
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
        {
          headers: {
            'User-Agent': userAgent,
          },
        }
      )
      if (!response.ok) throw new Error('DuckDuckGo API failed')
      const data = await response.json()
      // DuckDuckGo returns results in a different format
      const results: SearchResult[] = []
      if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics) {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text,
              url: topic.FirstURL,
              snippet: topic.Text,
              source: 'DuckDuckGo',
              date: '',
            })
          }
        }
      }
      // Also try a simple Google search via a public proxy (if available)
      // For now, we'll return what we have
      return results.slice(0, 10)
    } catch (error) {
      console.warn('Human-like search failed:', error)
      return []
    }
  }

  async searchWithAI(query: string): Promise<{ results: SearchResult[]; synthesis: string }> {
    const results = await this.search(query)
    if (results.length === 0) {
      return { results, synthesis: 'No search results found. Please try a different query.' }
    }
    const synthesisPrompt = `
You are Siddhi. Based on these search results, provide a comprehensive, synthesized answer to: "${query}"

Search results:
${results.map((r, i) => `${i+1}. ${r.title} (${r.source}): ${r.snippet}`).join('\n')}

Provide a well-structured summary that:
1. Answers the query directly
2. Cites key sources
3. Highlights different perspectives
4. Notes any gaps or limitations
`
    const response = await chat([
      { role: 'system', content: 'You are Siddhi, an expert researcher and synthesizer.' },
      { role: 'user', content: synthesisPrompt }
    ])
    return { results, synthesis: response.content }
  }
}
