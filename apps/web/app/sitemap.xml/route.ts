import { sitemapIndex, xmlResponse } from '@/lib/seo/xml-sitemap'

export const revalidate = 3600

export function GET() {
  return xmlResponse(sitemapIndex([
    '/sitemap-pages.xml',
    '/sitemap-categories.xml',
    '/sitemap-industries.xml',
    '/sitemap-services.xml',
    '/sitemap-insights.xml',
  ]))
}
