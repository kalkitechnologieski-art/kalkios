// Canonical marketplace URLs. Kept dependency-free so client components can
// build links without pulling the Supabase client into the browser bundle.

function trim(value: unknown): string {
  return String(value ?? '').trim()
}

export function normKey(value: unknown): string {
  return trim(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9-]+/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function categoryHref(category: unknown): string {
  return `/marketplace/${encodeURIComponent(trim(category))}`
}

// Dynamic segments arrive still percent-encoded on the standalone server, so a
// category like "AI Chatbots" reaches the page as "AI%20Chatbots" and matches
// nothing in the catalog. Decode before any lookup.
export function decodeSegment(value: string): string {
  const raw = trim(value)
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
}

export function serviceHref(service: { category: unknown; slug: unknown }): string {
  return `${categoryHref(service.category)}/${encodeURIComponent(trim(service.slug))}`
}
