// == KALKI SERVICE CATALOG ==
// Server-safe catalog access. Uses the public (anon, RLS-gated) Supabase client so
// it works in RSC, route handlers and the browser alike. Mock JSON is a fallback
// for a missing/unreachable Supabase config only — never a way to mask a lookup.
// -----------------------------------------------------------------------------

import { createPublicClient } from '@/lib/supabase/public-client'
import { normKey, serviceHref, categoryHref } from '@/lib/services/href'
import servicesData from '@/lib/mock/services.json'
import type { Database } from '@/lib/supabase/types'

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

function fromMock(): Service[] {
  isSupabaseAvailable = false
  return MOCK
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
      return MOCK
    }
    return rows
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
          if (exact) return exact
          // The URL pairs a real slug with a stale category: serve it, the
          // canonical link is derived from the row itself.
          if (wantedCategory) return bySlug[0]
        }

        const byName = rows.find(
          (r) => norm(r.name) === wantedSlug || norm(r.name) === norm(category) + '-' + wantedSlug
        )
        if (byName) {
          isSupabaseAvailable = true
          return byName
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

  const offline = MOCK.find((s) => isSameKey(s.slug, slug) && isSameKey(s.category, category))
    ?? MOCK.find((s) => isSameKey(s.slug, slug))
  return offline ?? null
}

// Canonical URL segments for a service row.
export { serviceHref, categoryHref, normKey } from '@/lib/services/href'

export function getSupabaseStatus(): boolean {
  return isSupabaseAvailable ?? false
}
