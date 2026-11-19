import { fetchAllCategories, fetchServices } from '@/lib/services'
import { categoryHref, serviceHref } from '@/lib/services/href'
import { getCategoryImageUrl, getServiceImageUrl } from '@/lib/services/service-image'
import { siteOrigin } from '@/lib/seo/site-url'
import { INSIGHTS } from '@/lib/content/insights'
import { INDUSTRY_HUBS } from '@/lib/services/phase3-services'
import { CONTENT_UPDATED } from '@/lib/seo/content-date'

const UPDATED = CONTENT_UPDATED

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function abs(pathOrUrl: string): string {
  const origin = siteOrigin()
  return pathOrUrl.startsWith('http') ? pathOrUrl : `${origin}${pathOrUrl}`
}

export function sitemapIndex(paths: string[]): string {
  const body = paths.map((path) => `  <sitemap><loc>${xmlEscape(abs(path))}</loc><lastmod>${UPDATED}</lastmod></sitemap>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`
}

function urlset(urls: { loc: string; lastmod: string; image?: string }[]): string {
  const body = urls.map((url) => {
    const image = url.image
      ? `\n    <image:image><image:loc>${xmlEscape(abs(url.image))}</image:loc></image:image>`
      : ''
    return `  <url><loc>${xmlEscape(url.loc)}</loc><lastmod>${url.lastmod}</lastmod>${image}\n  </url>`
  }).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${body}\n</urlset>\n`
}

export async function servicesSitemap(): Promise<string> {
  const services = await fetchServices()
  return urlset(services.map((service) => ({
    loc: abs(serviceHref(service)),
    lastmod: service.updated_at || UPDATED,
    image: getServiceImageUrl(service),
  })))
}

export async function categoriesSitemap(): Promise<string> {
  const categories = await fetchAllCategories()
  return urlset(categories.map((category) => ({
    loc: abs(categoryHref(category)),
    lastmod: UPDATED,
    image: getCategoryImageUrl(category),
  })))
}

export function industriesSitemap(): string {
  return urlset([
    { loc: abs('/industries'), lastmod: UPDATED },
    ...INDUSTRY_HUBS.map((hub) => ({ loc: abs(`/industries/${hub.slug}`), lastmod: UPDATED })),
  ])
}

export function insightsSitemap(): string {
  return urlset([
    { loc: abs('/insights'), lastmod: UPDATED },
    ...INSIGHTS.map((article) => ({ loc: abs(`/insights/${article.slug}`), lastmod: article.dateModified })),
  ])
}

export function pagesSitemap(): string {
  const paths = ['/', '/marketplace', '/about', '/contact', '/request', '/explore', '/careers', '/support', '/privacy', '/terms']
  return urlset(paths.map((path) => ({ loc: abs(path), lastmod: UPDATED })))
}

export function xmlResponse(body: string): Response {
  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
