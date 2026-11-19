// Canonical origin for every public SEO surface (canonical, og:url, JSON-LD,
// sitemap, robots, llms.txt). A local NEXT_PUBLIC_APP_URL left pointing at
// localhost would otherwise be baked into production URLs, so dev origins fall
// back to the real domain.
const PROD_ORIGIN = 'https://www.kalki-intelligence.in';

export function languageAlternates(canonical: string): {
  canonical: string
  languages: { en: string; 'x-default': string }
} {
  const origin = siteOrigin()
  const url = canonical.startsWith('http')
    ? canonical
    : `${origin}${canonical.startsWith('/') ? canonical : `/${canonical}`}`
  return { canonical: url, languages: { en: url, 'x-default': url } }
}

export function siteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (!raw) return PROD_ORIGIN;
  try {
    const url = new URL(raw);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname === '0.0.0.0') {
      return PROD_ORIGIN;
    }
    return url.origin;
  } catch {
    return PROD_ORIGIN;
  }
}
