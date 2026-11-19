import type { Metadata } from 'next'
import Link from 'next/link'
import { INSIGHTS } from '@/lib/content/insights'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { CONTENT_UPDATED } from '@/lib/seo/content-date'
import { siteOrigin } from '@/lib/seo/site-url'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Notes on Astrology, Vastu and AI Development',
  description:
    'Short, sourced notes from KALKI Intelligence on astrology websites, SEO, WhatsApp API setup, omnichannel CRM, AEO/GEO and YouTube production. No invented results.',
  alternates: { canonical: '/insights' },
}

export default function InsightsIndexPage() {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'KALKI Intelligence notes',
    description: 'Explanatory articles about how KALKI Intelligence scopes its services.',
    dateModified: CONTENT_UPDATED,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: INSIGHTS.length,
      itemListElement: INSIGHTS.map((article, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `${siteOrigin()}/insights/${article.slug}`,
        name: article.title,
      })),
    },
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <p className="text-cyan-300/80 text-xs tracking-[0.2em] uppercase mb-3">Temple of technology</p>
      <h1 className="text-3xl md:text-4xl font-bold text-white">Notes from KALKI Intelligence</h1>
      <p className="text-white/70 text-sm leading-relaxed mt-4">
        These articles explain how a service is scoped, priced and limited. They are not case studies.
        KALKI Intelligence does not publish client counts, rankings or results it cannot show.
        The studio works with astrologers, vastu consultants and other spiritual practitioners, and with businesses in every industry.
      </p>
      <div className="mt-8 space-y-6">
        {INSIGHTS.map((article) => (
          <article key={article.slug} className="border-b border-white/10 pb-6">
            <h2 className="text-xl font-semibold text-white">
              <Link href={`/insights/${article.slug}`} className="hover:text-cyan-300 transition">{article.title}</Link>
            </h2>
            <p className="text-white/45 text-xs mt-1">19 November 2026</p>
            <p className="text-white/70 text-sm mt-2 leading-relaxed">{article.description}</p>
          </article>
        ))}
      </div>
      <p className="text-sm text-white/60 mt-8">
        <Link href="/marketplace" className="text-cyan-400 hover:text-cyan-300">Browse the service catalog</Link>
        {' · '}
        <Link href="/about" className="text-cyan-400 hover:text-cyan-300">About the studio</Link>
      </p>
      <SiteFooter />
    </div>
  )
}
