// == KALKI MARKETPLACE ==
// Server-rendered catalog so the grid is in the first HTML response — no
// skeleton, no client-side fetch round trip before the first paint.
// -----------------------------------------------------------------------------

import type { Metadata } from 'next'
import { MarketplaceBrowser } from '@/components/marketplace/MarketplaceBrowser'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { fetchServices, getSupabaseStatus } from '@/lib/services'
import { languageAlternates } from '@/lib/seo/site-url'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'AI Services Marketplace — Websites, Apps, SEO, Automation',
  description:
    'Catalog of websites, SEO, WhatsApp, CRM, video and AI services from KALKI Intelligence. For astrologers, vastu consultants and every industry. Written quote, ₹0 to start.',
  alternates: languageAlternates('/marketplace'),
}

export default async function MarketplacePage() {
  const services = await fetchServices()

  return (
    <>
      <MarketplaceBrowser services={services as never} online={getSupabaseStatus()} />
      <SiteFooter />
    </>
  )
}
