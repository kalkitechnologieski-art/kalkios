// == KALKI MARKETPLACE ==
// Server-rendered catalog so the grid is in the first HTML response — no
// skeleton, no client-side fetch round trip before the first paint.
// -----------------------------------------------------------------------------

import type { Metadata } from 'next'
import { MarketplaceBrowser } from '@/components/marketplace/MarketplaceBrowser'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { fetchServices, getSupabaseStatus } from '@/lib/services'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'AI Services Marketplace — Websites, Apps, SEO, Automation',
  description:
    'Browse fixed-price AI-powered services from KALKI Intelligence, an Indore-based tech company: websites, apps, SEO, automation and content. Request a tailored quote with no payment required.',
  alternates: { canonical: '/marketplace' },
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
