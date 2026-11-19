import { servicesSitemap, xmlResponse } from '@/lib/seo/xml-sitemap'

export const revalidate = 3600

export async function GET() {
  return xmlResponse(await servicesSitemap())
}
