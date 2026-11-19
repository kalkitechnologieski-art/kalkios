import type { Metadata } from 'next'
import Link from 'next/link'
import { INDUSTRY_HUBS } from '@/lib/services/phase3-services'
import { languageAlternates } from '@/lib/seo/site-url'
import { breadcrumbSchema } from '@/lib/seo/schema'
import { SiteFooter } from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'Industry solutions',
  description: 'Industry hubs for clinics, real estate, education, restaurants, commerce, finance, legal, hospitality, manufacturing, and spiritual practices. Each hub links to distinct services.',
  alternates: languageAlternates('/industries'),
}

export default function IndustriesPage() {
  const crumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Industries', url: '/industries' },
  ])
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <p className="text-sm text-white/45 mb-4"><Link href="/" className="hover:text-white">Home</Link> / Industries</p>
      <h1 className="text-3xl md:text-4xl font-bold text-white">Solutions by industry</h1>
      <p className="text-white/70 text-sm mt-4 max-w-3xl">
        These hubs group services whose deliverable is specific to the industry. A generic website, an app, or an automation that any business can buy stays in the marketplace categories. Astrology and vastu are one hub, not the front of the catalog.
      </p>
      <ul className="mt-8 grid sm:grid-cols-2 gap-4">
        {INDUSTRY_HUBS.map((hub) => (
          <li key={hub.slug} className="border border-white/10 rounded-xl p-4">
            <h2 className="text-white font-semibold"><Link href={`/industries/${hub.slug}`} className="hover:text-cyan-300">{hub.name}</Link></h2>
            <p className="text-white/65 text-sm mt-2">{hub.lede}</p>
          </li>
        ))}
      </ul>
      <SiteFooter />
    </div>
  )
}
