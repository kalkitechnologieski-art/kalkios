import { insightsSitemap, xmlResponse } from '@/lib/seo/xml-sitemap'

export const revalidate = 3600

export function GET() {
  return xmlResponse(insightsSitemap())
}
