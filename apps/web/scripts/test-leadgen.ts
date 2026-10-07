// ═══ LEADGEN v3 SELF-TEST ═══
// Integration smoke test that hits every engine, every business directory,
// and the full aggregator pipeline (including multi-query expansion).
// Use: `npx tsx scripts/test-leadgen.ts`
// ─────────────────────────────────────────────────────────────────────────────

import { leadEngineRegistry, engineHealth, parallelSearch } from '../lib/leads/engines'
import { directoryRegistry, directoryHealth, parallelDirectories } from '../lib/leads/directories'
import { generateLeads, expandQueries } from '../lib/leads/aggregator'
import { LeadPipelineError } from '../lib/leads/errors'

interface TestOutcome {
  source: string
  kind: 'engine' | 'directory' | 'aggregator'
  ok: boolean
  count: number
  durationMs: number
  code?: string
  error?: string
}

const FIXED_QUERIES = [
  'marketing agencies in mumbai',
  'software startups india',
  'enterprise lead generation tools',
  'dentists in bangalore',
]

async function testEngine(engine: string, query: string): Promise<TestOutcome> {
  const start = Date.now()
  try {
    const result = await parallelSearch(query, { engines: [engine], limit: 5 })
    const engineOutcome = result.perEngine[0]
    if (!engineOutcome) return { source: engine, kind: 'engine', ok: false, count: 0, durationMs: Date.now() - start, error: 'no outcome' }
    if (engineOutcome.error) {
      return { source: engine, kind: 'engine', ok: false, count: 0, durationMs: engineOutcome.durationMs, code: engineOutcome.error.code, error: engineOutcome.error.message }
    }
    return { source: engine, kind: 'engine', ok: true, count: engineOutcome.results.length, durationMs: engineOutcome.durationMs }
  } catch (err) {
    return { source: engine, kind: 'engine', ok: false, count: 0, durationMs: Date.now() - start, code: err instanceof LeadPipelineError ? err.code : 'UNKNOWN', error: err instanceof Error ? err.message : String(err) }
  }
}

async function testDirectory(dir: string, query: string, location?: string): Promise<TestOutcome> {
  const start = Date.now()
  try {
    const result = await parallelDirectories(query, { directories: [dir], limit: 8, location })
    const outcome = result.perDirectory[0]
    if (!outcome) return { source: dir, kind: 'directory', ok: false, count: 0, durationMs: Date.now() - start, error: 'no outcome' }
    if (outcome.error) {
      return { source: dir, kind: 'directory', ok: false, count: 0, durationMs: outcome.durationMs, code: outcome.error.code, error: outcome.error.message }
    }
    return { source: dir, kind: 'directory', ok: true, count: outcome.leads.length, durationMs: outcome.durationMs }
  } catch (err) {
    return { source: dir, kind: 'directory', ok: false, count: 0, durationMs: Date.now() - start, code: err instanceof LeadPipelineError ? err.code : 'UNKNOWN', error: err instanceof Error ? err.message : String(err) }
  }
}

async function testAggregator(query: string, location?: string): Promise<TestOutcome & { leads: unknown[]; structured: number; passes: number }> {
  const start = Date.now()
  try {
    const result = await generateLeads({ query, location, maxResults: 8, maxPagesPerSite: 1, expandQueries: true })
    return {
      source: `agg[${query}]`,
      kind: 'aggregator',
      ok: result.leads.length > 0,
      count: result.leads.length,
      durationMs: Date.now() - start,
      leads: result.leads,
      structured: result.totalStructured,
      passes: result.passesRun,
    }
  } catch (err) {
    return {
      source: `agg[${query}]`,
      kind: 'aggregator',
      ok: false,
      count: 0,
      durationMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
      code: err instanceof LeadPipelineError ? err.code : 'UNKNOWN',
      leads: [],
      structured: 0,
      passes: 0,
    }
  }
}

function printRow(outcome: TestOutcome) {
  const icon = outcome.ok ? '✓' : '✗'
  const count = `${outcome.count}`.padStart(4)
  const ms = `${outcome.durationMs}ms`.padStart(8)
  const note = outcome.code ? ` [${outcome.code}] ${outcome.error ?? ''}` : ''
  console.log(`  ${icon} ${outcome.source.padEnd(20)} ${outcome.kind.padEnd(11)} results=${count} ${ms}${note}`)
}

async function main() {
  console.log('\n=== LEADGEN v3.1 SELF-TEST ===\n')

  console.log('-- Web search engines --')
  for (const engine of leadEngineRegistry) {
    if (!engine.enabled()) {
      console.log(`  - ${engine.name.padEnd(20)} (disabled)`)
      continue
    }
    printRow(await testEngine(engine.name, FIXED_QUERIES[0]!))
  }

  console.log('\n-- Business directories --')
  for (const dir of directoryRegistry) {
    if (!dir.enabled()) {
      console.log(`  - ${dir.name.padEnd(20)} (disabled)`)
      continue
    }
    printRow(await testDirectory(dir.name, FIXED_QUERIES[0]!, 'Mumbai'))
  }

  console.log('\n-- Query expansion samples --')
  for (const q of FIXED_QUERIES.slice(0, 2)) {
    console.log(`  "${q}" → ${JSON.stringify(expandQueries(q, 'Mumbai'))}`)
  }

  console.log('\n-- Aggregator end-to-end --')
  for (const q of FIXED_QUERIES) {
    const out = await testAggregator(q, 'Mumbai')
    printRow(out)
    if (out.leads.length > 0) {
      for (const l of out.leads.slice(0, 3) as Array<{ email: string | null; phone: string | null; company: string | null; confidence: number; source: string | null }>) {
        console.log(`       ${(l.source ?? '?').padEnd(15)} email=${l.email ?? '(none)'} phone=${l.phone ?? ''} conf=${l.confidence.toFixed(0)} ${l.company ?? ''}`)
      }
    }
    console.log(`       structured=${out.structured} passes=${out.passes}`)
  }

  console.log('\n-- Circuit breaker health --')
  console.log('  [engines]')
  for (const [engine, health] of Object.entries(engineHealth())) {
    console.log(`    ${engine.padEnd(20)} state=${health.state.padEnd(10)} failures=${health.failures}`)
  }
  console.log('  [directories]')
  for (const [dir, health] of Object.entries(directoryHealth())) {
    console.log(`    ${dir.padEnd(20)} state=${health.state.padEnd(10)} failures=${health.failures}`)
  }
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1) })
