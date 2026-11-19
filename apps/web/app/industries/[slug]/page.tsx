import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { INDUSTRY_HUBS } from '@/lib/services/phase3-services'
import { fetchServices } from '@/lib/services'
import { serviceHref } from '@/lib/services/href'
import { languageAlternates, siteOrigin } from '@/lib/seo/site-url'
import { breadcrumbSchema, faqSchema } from '@/lib/seo/schema'
import { SiteFooter } from '@/components/layout/SiteFooter'

type Params = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return INDUSTRY_HUBS.map((hub) => ({ slug: hub.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const hub = INDUSTRY_HUBS.find((item) => item.slug === slug)
  if (!hub) return {}
  return {
    title: `${hub.name} services`,
    description: hub.lede,
    alternates: languageAlternates(`/industries/${hub.slug}`),
  }
}

export default async function IndustryHubPage({ params }: Params) {
  const { slug } = await params
  const hub = INDUSTRY_HUBS.find((item) => item.slug === slug)
  if (!hub) notFound()
  const services = await fetchServices()
  const linked = hub.serviceSlugs
    .map((slug) => services.find((service) => service.slug === slug))
    .filter((service): service is (typeof services)[number] => Boolean(service))
  const faqs = [
    { question: `What does the ${hub.name} hub include?`, answer: hub.lede },
    { question: 'Is a result promised?', answer: 'No. Each linked service lists the work in a written quote. Rankings, bookings, and revenue are not promised.' },
  ]
  const origin = siteOrigin()
  const crumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Industries', url: '/industries' },
    { name: hub.name, url: `/industries/${hub.slug}` },
  ])
  const collection = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: hub.name,
    description: hub.lede,
    url: `${origin}/industries/${hub.slug}`,
    isPartOf: { '@id': `${origin}/#website` },
  }
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collection) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }} />
      <p className="text-sm text-white/45 mb-4">
        <Link href="/" className="hover:text-white">Home</Link> / <Link href="/industries" className="hover:text-white">Industries</Link> / {hub.name}
      </p>
      <h1 className="text-3xl font-bold text-white">{hub.name}</h1>
      <p className="text-white/75 text-sm mt-4">{hub.lede}</p>
      <p className="text-white/75 text-sm mt-3">{hub.body}</p>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">Services</h2>
      <ul className="space-y-2">
        {linked.map((service) => (
          <li key={service.slug}>
            <Link href={serviceHref(service)} className="text-cyan-300 hover:text-cyan-200 text-sm">{service.name}</Link>
            <span className="text-white/45 text-sm"> · from ₹{Number(service.price ?? 0).toLocaleString('en-IN')}</span>
          </li>
        ))}
      </ul>
      <h2 className="text-xl font-bold text-white mt-8 mb-3">Frequently asked</h2>
      {faqs.map((faq) => (
        <details key={faq.question} className="border-b border-white/10 py-3">
          <summary className="text-white cursor-pointer">{faq.question}</summary>
          <p className="text-white/70 text-sm mt-2">{faq.answer}</p>
        </details>
      ))}
      <p className="text-sm mt-6"><Link href="/marketplace" className="text-cyan-300">All services</Link></p>
      <SiteFooter />
    </div>
  )
}
