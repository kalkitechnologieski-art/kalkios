// ═══ LEADGEN v3 ERROR CATALOG ═══
// Hardcoded, documented error codes for the lead generation pipeline.
// Each code maps to a stable, retryable class so the client can show
// an actionable message and decide whether to retry.
// ─────────────────────────────────────────────────────────────────────────────

export type LeadErrorCode =
  | 'LEADS_INVALID_QUERY'
  | 'LEADS_QUERY_TOO_SHORT'
  | 'LEADS_RATE_LIMITED'
  | 'LEADS_UNAUTHORIZED'
  | 'LEADS_PAYWALL_REQUIRED'
  | 'LEADS_ALL_ENGINES_DOWN'
  | 'LEADS_ALL_ENGINES_RATE_LIMITED'
  | 'LEADS_NO_RESULTS'
  | 'LEADS_PARTIAL_RESULTS'
  | 'LEADS_ENGINE_TIMEOUT'
  | 'LEADS_ENGINE_BLOCKED'
  | 'LEADS_ENGINE_CIRCUIT_OPEN'
  | 'LEADS_CIRCUIT_OPEN'
  | 'LEADS_SCRAPE_FAILED'
  | 'LEADS_SCRAPE_TIMEOUT'
  | 'LEADS_SCRAPE_BLOCKED'
  | 'LEADS_EXTRACT_FAILED'
  | 'LEADS_FETCH_FAILED'
  | 'LEADS_PARSE_FAILED'
  | 'LEADS_INVALID_URL'
  | 'LEADS_DEDUPE_FAILED'
  | 'LEADS_VALIDATION_FAILED'
  | 'LEADS_DB_WRITE_FAILED'
  | 'LEADS_QUEUE_FULL'
  | 'LEADS_QUEUE_TIMEOUT'
  | 'LEADS_ABORTED_BY_USER'
  | 'LEADS_INTERNAL_ERROR'
  | 'LEADS_PROXY_BLOCKED'
  | 'ENGINE_SEARXNG_FAILED'
  | 'ENGINE_SEARXNG_TIMEOUT'
  | 'ENGINE_DUCKDUCKGO_FAILED'
  | 'ENGINE_DUCKDUCKGO_TIMEOUT'
  | 'ENGINE_DUCKDUCKGO_BLOCKED'
  | 'ENGINE_BING_FAILED'
  | 'ENGINE_BING_TIMEOUT'
  | 'ENGINE_BING_BLOCKED'
  | 'ENGINE_BRAVE_FAILED'
  | 'ENGINE_BRAVE_TIMEOUT'
  | 'ENGINE_BRAVE_NO_KEY'
  | 'ENGINE_BRAVE_QUOTA'
  | 'ENGINE_MOJEEK_FAILED'
  | 'ENGINE_MOJEEK_TIMEOUT'
  | 'ENGINE_YANDEX_FAILED'
  | 'ENGINE_YANDEX_TIMEOUT'
  | 'ENGINE_WIKIPEDIA_FAILED'
  | 'ENGINE_WIKIPEDIA_TIMEOUT'
  | 'ENGINE_WIKIDATA_FAILED'
  | 'ENGINE_WIKIDATA_TIMEOUT'
  | 'ENGINE_ECOSIA_FAILED'
  | 'ENGINE_ECOSIA_TIMEOUT'
  | 'ENGINE_GOOGLE_SCHOLAR_FAILED'
  | 'ENGINE_GOOGLE_SCHOLAR_TIMEOUT'
  | 'ENGINE_OSM_OVERPASS_FAILED'
  | 'ENGINE_OSM_OVERPASS_TIMEOUT'
  | 'ENGINE_OSM_OVERPASS_RATE'
  | 'ENGINE_GITHUB_ORGS_FAILED'
  | 'ENGINE_GITHUB_ORGS_TIMEOUT'
  | 'ENGINE_GITHUB_ORGS_RATE'
  | 'ENGINE_JUSTDIAL_FAILED'
  | 'ENGINE_JUSTDIAL_BLOCKED'
  | 'ENGINE_SULEKHA_FAILED'
  | 'ENGINE_SULEKHA_BLOCKED'
  | 'ENGINE_INDIAMART_FAILED'
  | 'ENGINE_INDIAMART_BLOCKED'
  | 'ENGINE_PRODUCTHUNT_FAILED'
  | 'ENGINE_WIKIDATA_SPARQL_FAILED'
  | 'ENGINE_WIKIDATA_SPARQL_TIMEOUT'
  | 'ENGINE_OPENCORPORATES_FAILED'
  | 'ENGINE_OPENCORPORATES_NO_KEY'

export interface LeadError {
  code: LeadErrorCode
  message: string
  retryable: boolean
  retryAfterMs?: number
  engine?: string
  source?: string
  cause?: string
}

export class LeadPipelineError extends Error {
  readonly code: LeadErrorCode
  readonly retryable: boolean
  readonly retryAfterMs?: number
  readonly engine?: string
  readonly source?: string
  readonly causeDetail?: string

  constructor(spec: LeadError) {
    super(spec.message)
    this.name = 'LeadPipelineError'
    this.code = spec.code
    this.retryable = spec.retryable
    if (spec.retryAfterMs !== undefined) this.retryAfterMs = spec.retryAfterMs
    if (spec.engine !== undefined) this.engine = spec.engine
    if (spec.source !== undefined) this.source = spec.source
    if (spec.cause !== undefined) this.causeDetail = spec.cause
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      retryable: this.retryable,
      retryAfterMs: this.retryAfterMs,
      engine: this.engine,
      source: this.source,
      cause: this.causeDetail,
    }
  }
}

export const LEAD_ERROR_CATALOG: Record<LeadErrorCode, { description: string; severity: 'info' | 'warn' | 'error' | 'critical'; retryable: boolean }> = {
  LEADS_INVALID_QUERY:           { description: 'Query missing or not a string', severity: 'warn', retryable: false },
  LEADS_QUERY_TOO_SHORT:         { description: 'Query must be at least 2 characters', severity: 'warn', retryable: false },
  LEADS_RATE_LIMITED:            { description: 'Too many lead requests for current window', severity: 'warn', retryable: true },
  LEADS_UNAUTHORIZED:            { description: 'No valid session', severity: 'warn', retryable: false },
  LEADS_PAYWALL_REQUIRED:        { description: 'This many-results request requires paid tier', severity: 'warn', retryable: false },
  LEADS_ALL_ENGINES_DOWN:        { description: 'Every search engine in the cluster is down or blocked', severity: 'critical', retryable: true },
  LEADS_ALL_ENGINES_RATE_LIMITED:{ description: 'Every engine returned 429/rate-limited', severity: 'warn', retryable: true },
  LEADS_NO_RESULTS:              { description: 'No URLs found across all engines', severity: 'info', retryable: false },
  LEADS_PARTIAL_RESULTS:         { description: 'Some engines failed but partial result returned', severity: 'info', retryable: false },
  LEADS_ENGINE_TIMEOUT:          { description: 'Engine did not return in budget', severity: 'warn', retryable: true },
  LEADS_ENGINE_BLOCKED:          { description: 'Engine returned 403/blocked content', severity: 'warn', retryable: false },
  LEADS_ENGINE_CIRCUIT_OPEN:     { description: 'Engine circuit breaker is open, skipping', severity: 'warn', retryable: true },
  LEADS_CIRCUIT_OPEN:            { description: 'Upstream circuit breaker is open', severity: 'warn', retryable: true },
  LEADS_SCRAPE_FAILED:           { description: 'Page fetch returned non-2xx', severity: 'warn', retryable: true },
  LEADS_SCRAPE_TIMEOUT:          { description: 'Page fetch timed out', severity: 'warn', retryable: true },
  LEADS_SCRAPE_BLOCKED:          { description: 'Page returned 403/blocked from scraping', severity: 'warn', retryable: false },
  LEADS_EXTRACT_FAILED:          { description: 'Extraction threw an exception', severity: 'warn', retryable: false },
  LEADS_FETCH_FAILED:            { description: 'Generic fetch failure', severity: 'warn', retryable: true },
  LEADS_PARSE_FAILED:            { description: 'Response body could not be parsed', severity: 'warn', retryable: false },
  LEADS_INVALID_URL:             { description: 'Discovered URL was malformed', severity: 'info', retryable: false },
  LEADS_DEDUPE_FAILED:           { description: 'Dedup step threw', severity: 'error', retryable: false },
  LEADS_VALIDATION_FAILED:       { description: 'Lead failed validation', severity: 'info', retryable: false },
  LEADS_DB_WRITE_FAILED:         { description: 'Database write failed', severity: 'error', retryable: true },
  LEADS_QUEUE_FULL:              { description: 'Internal queue rejected the task', severity: 'warn', retryable: true },
  LEADS_QUEUE_TIMEOUT:           { description: 'Task waited too long in queue', severity: 'warn', retryable: true },
  LEADS_ABORTED_BY_USER:         { description: 'Caller closed the connection', severity: 'info', retryable: false },
  LEADS_INTERNAL_ERROR:          { description: 'Unhandled internal error', severity: 'error', retryable: false },
  LEADS_PROXY_BLOCKED:           { description: 'All proxies blocked the target', severity: 'warn', retryable: false },
  ENGINE_SEARXNG_FAILED:         { description: 'SearXNG returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_SEARXNG_TIMEOUT:        { description: 'SearXNG timeout', severity: 'warn', retryable: true },
  ENGINE_DUCKDUCKGO_FAILED:      { description: 'DuckDuckGo returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_DUCKDUCKGO_TIMEOUT:     { description: 'DuckDuckGo timeout', severity: 'warn', retryable: true },
  ENGINE_DUCKDUCKGO_BLOCKED:     { description: 'DuckDuckGo blocked us (CAPTCHA/challenge)', severity: 'warn', retryable: true },
  ENGINE_BING_FAILED:            { description: 'Bing returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_BING_TIMEOUT:           { description: 'Bing timeout', severity: 'warn', retryable: true },
  ENGINE_BING_BLOCKED:           { description: 'Bing blocked us', severity: 'warn', retryable: true },
  ENGINE_BRAVE_FAILED:           { description: 'Brave returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_BRAVE_TIMEOUT:          { description: 'Brave timeout', severity: 'warn', retryable: true },
  ENGINE_BRAVE_NO_KEY:           { description: 'Brave API key not configured', severity: 'info', retryable: false },
  ENGINE_BRAVE_QUOTA:            { description: 'Brave quota exceeded', severity: 'warn', retryable: true },
  ENGINE_MOJEEK_FAILED:          { description: 'Mojeek returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_MOJEEK_TIMEOUT:         { description: 'Mojeek timeout', severity: 'warn', retryable: true },
  ENGINE_YANDEX_FAILED:          { description: 'Yandex returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_YANDEX_TIMEOUT:         { description: 'Yandex timeout', severity: 'warn', retryable: true },
  ENGINE_WIKIPEDIA_FAILED:       { description: 'Wikipedia returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_WIKIPEDIA_TIMEOUT:      { description: 'Wikipedia timeout', severity: 'warn', retryable: true },
  ENGINE_WIKIDATA_FAILED:        { description: 'Wikidata returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_WIKIDATA_TIMEOUT:       { description: 'Wikidata timeout', severity: 'warn', retryable: true },
  ENGINE_ECOSIA_FAILED:          { description: 'Ecosia returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_ECOSIA_TIMEOUT:         { description: 'Ecosia timeout', severity: 'warn', retryable: true },
  ENGINE_GOOGLE_SCHOLAR_FAILED:  { description: 'Google Scholar returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_GOOGLE_SCHOLAR_TIMEOUT: { description: 'Google Scholar timeout', severity: 'warn', retryable: true },
  ENGINE_OSM_OVERPASS_FAILED:    { description: 'OpenStreetMap Overpass returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_OSM_OVERPASS_TIMEOUT:   { description: 'Overpass query timed out', severity: 'warn', retryable: true },
  ENGINE_OSM_OVERPASS_RATE:      { description: 'Overpass rate limit hit; retry with backoff', severity: 'warn', retryable: true },
  ENGINE_GITHUB_ORGS_FAILED:     { description: 'GitHub org search returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_GITHUB_ORGS_TIMEOUT:    { description: 'GitHub org search timeout', severity: 'warn', retryable: true },
  ENGINE_GITHUB_ORGS_RATE:       { description: 'GitHub unauthenticated search rate limit (10/min)', severity: 'warn', retryable: true },
  ENGINE_JUSTDIAL_FAILED:        { description: 'Justdial returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_JUSTDIAL_BLOCKED:       { description: 'Justdial blocked the scraper', severity: 'warn', retryable: false },
  ENGINE_SULEKHA_FAILED:         { description: 'Sulekha returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_SULEKHA_BLOCKED:        { description: 'Sulekha blocked the scraper', severity: 'warn', retryable: false },
  ENGINE_INDIAMART_FAILED:       { description: 'IndiaMART returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_INDIAMART_BLOCKED:      { description: 'IndiaMART blocked the scraper', severity: 'warn', retryable: false },
  ENGINE_PRODUCTHUNT_FAILED:     { description: 'ProductHunt returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_WIKIDATA_SPARQL_FAILED: { description: 'Wikidata SPARQL returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_WIKIDATA_SPARQL_TIMEOUT:{ description: 'Wikidata SPARQL timeout', severity: 'warn', retryable: true },
  ENGINE_OPENCORPORATES_FAILED:  { description: 'OpenCorporates returned non-2xx', severity: 'warn', retryable: true },
  ENGINE_OPENCORPORATES_NO_KEY:  { description: 'OpenCorporates requires an API token; skipping', severity: 'info', retryable: false },
}

export function isRetryable(err: unknown): boolean {
  if (err instanceof LeadPipelineError) return err.retryable
  return false
}