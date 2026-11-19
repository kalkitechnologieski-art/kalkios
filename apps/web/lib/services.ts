// == KALKI SERVICE CATALOG ==
// Server-safe catalog access. Uses the public (anon, RLS-gated) Supabase client so
// it works in RSC, route handlers and the browser alike. Mock JSON is a fallback
// for a missing/unreachable Supabase config only — never a way to mask a lookup.
// -----------------------------------------------------------------------------

import { createPublicClient } from '@/lib/supabase/public-client'
import { normKey, serviceHref, categoryHref, decodeSegment } from '@/lib/services/href'
import { CATALOG_ADDITIONS } from '@/lib/services/catalog-additions'
import { publicCopy } from '@/lib/seo/public-copy'
import servicesData from '@/lib/mock/services.json'
import type { Database, Json } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row'] & {
  target_industries?: string[]
  long_description?: string | null
}

let isSupabaseAvailable: boolean | null = null

// Slugs and categories drift in case/spacing between the admin form, the seed
// file and the mock catalog, so every comparison goes through this normaliser.
const norm = normKey

function isSameKey(a: unknown, b: unknown): boolean {
  const na = norm(a)
  const nb = norm(b)
  return !!na && !!nb && na === nb
}

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return !!url && !!key && url.startsWith('https://')
}

const MOCK = servicesData as unknown as Service[]

function sanitizeRow(row: Service): Service {
  const extra = row as Service & { aeo_summary?: string | null }
  let features = row.features
  if (Array.isArray(row.features)) {
    const cleaned: Json[] = []
    for (const item of row.features) {
      if (typeof item !== 'string') {
        if (item !== undefined) cleaned.push(item)
        continue
      }
      const text = publicCopy(item)
      if (text) cleaned.push(text)
    }
    features = cleaned
  }
  const next: Service = {
    ...row,
    description: row.description ? publicCopy(row.description) : row.description,
    meta_description: row.meta_description ? publicCopy(row.meta_description) : row.meta_description,
    long_description: row.long_description ? publicCopy(row.long_description) : row.long_description,
    features,
  }
  if (extra.aeo_summary) {
    ;(next as Service & { aeo_summary?: string | null }).aeo_summary = publicCopy(extra.aeo_summary)
  }
  return next
}

function withCatalog(rows: Service[]): Service[] {
  const seen = new Set(rows.map((row) => norm(row.slug)))
  const extras = (CATALOG_ADDITIONS as Service[]).filter((row) => !seen.has(norm(row.slug)))
  return [...rows, ...extras]
    .map(sanitizeRow)
    .sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0))
}

function fromMock(): Service[] {
  isSupabaseAvailable = false
  return withCatalog(MOCK)
}

export async function checkSupabaseConnection(): Promise<boolean> {
  if (isSupabaseAvailable !== null) return isSupabaseAvailable
  if (!supabaseConfigured()) {
    isSupabaseAvailable = false
    return false
  }
  try {
    const supabase = createPublicClient()
    const { error } = await supabase.from('services').select('id').limit(1)
    isSupabaseAvailable = !error
    return isSupabaseAvailable
  } catch {
    isSupabaseAvailable = false
    return false
  }
}

export async function fetchServices(): Promise<Service[]> {
  if (!supabaseConfigured()) return fromMock()

  try {
    const supabase = createPublicClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('price', { ascending: true })

    if (error) {
      console.warn('[catalog] services query failed, using offline catalog:', error.message)
      return fromMock()
    }

    const rows = (data ?? []) as Service[]
    isSupabaseAvailable = true
    if (rows.length === 0) {
      console.warn('[catalog] no live services in database, using offline catalog')
      return withCatalog(MOCK)
    }
    return withCatalog(rows)
  } catch (err) {
    console.warn('[catalog] unreachable database, using offline catalog:', err)
    return fromMock()
  }
}

export async function fetchAllCategories(): Promise<string[]> {
  const rows = await fetchServices()
  const seen = new Map<string, string>()
  for (const r of rows) {
    const key = norm(r.category)
    if (key && !seen.has(key)) seen.set(key, String(r.category).trim())
  }
  return Array.from(seen.values()).sort((a, b) => a.localeCompare(b))
}

export async function fetchServicesByCategory(category: string): Promise<Service[]> {
  const rows = await fetchServices()
  const wanted = norm(category)
  return rows.filter((r) => norm(r.category) === wanted)
}

export async function fetchServiceBySlug(category: string, slug: string): Promise<Service | null> {
  const wantedSlug = norm(slug)
  const wantedCategory = norm(category)

  if (supabaseConfigured()) {
    try {
      const supabase = createPublicClient()

      // Slug is the real identifier; the category segment only scopes the URL.
      // Matching on slug alone prevents a drifted category label from 404-ing a
      // page the user can already see listed elsewhere.
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('id')
        .limit(500)

      if (!error && data) {
        const rows = data as Service[]
        const bySlug = rows.filter((r) => norm(r.slug) === wantedSlug)
        if (bySlug.length > 0) {
          isSupabaseAvailable = true
          const exact = bySlug.find((r) => norm(r.category) === wantedCategory)
          if (exact) return sanitizeRow(exact)
          // The URL pairs a real slug with a stale category: serve it, the
          // canonical link is derived from the row itself.
          if (wantedCategory) return sanitizeRow(bySlug[0])
        }

        const byName = rows.find(
          (r) => norm(r.name) === wantedSlug || norm(r.name) === norm(category) + '-' + wantedSlug
        )
        if (byName) {
          isSupabaseAvailable = true
          return sanitizeRow(byName)
        }

        if (bySlug.length > 0 || rows.length > 0) {
          // Database answered and the service genuinely isn't there.
          isSupabaseAvailable = true
        }
      } else if (error) {
        console.warn('[catalog] lookup failed, falling back to offline catalog:', error.message)
      }
    } catch (err) {
      console.warn('[catalog] lookup unreachable, falling back to offline catalog:', err)
    }
  }

  const pool = withCatalog(MOCK)
  const offline = pool.find((s) => isSameKey(s.slug, slug) && isSameKey(s.category, category))
    ?? pool.find((s) => isSameKey(s.slug, slug))
  return offline ?? null
}

export async function resolveCategoryName(segment: string): Promise<string | null> {
  const wanted = norm(decodeSegment(segment))
  if (!wanted) return null
  const categories = await fetchAllCategories()
  return categories.find((category) => norm(category) === wanted) ?? null
}

// Canonical URL segments for a service row.
export { serviceHref, categoryHref, normKey } from '@/lib/services/href'

export function getSupabaseStatus(): boolean {
  return isSupabaseAvailable ?? false
}
