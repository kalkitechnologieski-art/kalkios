// Canonical origin for every public SEO surface (canonical, og:url, JSON-LD,
// sitemap, robots, llms.txt). A local NEXT_PUBLIC_APP_URL left pointing at
// localhost would otherwise be baked into production URLs, so dev origins fall
// back to the real domain.
const PROD_ORIGIN = 'https://www.kalki-intelligence.in';

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
