import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { findInsight, INSIGHTS } from '@/lib/content/insights'
import { articleSchema, breadcrumbSchema, faqSchema } from '@/lib/seo/schema'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { siteOrigin } from '@/lib/seo/site-url'

type Params = { params: Promise<{ slug: string }> }

export const revalidate = 3600

export function generateStaticParams() {
  return INSIGHTS.map((article) => ({ slug: article.slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const article = findInsight((await params).slug)
  if (!article) return {}
  const canonical = `/insights/${article.slug}`
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical },
    openGraph: {
      title: article.title,
      description: article.description,
      url: canonical,
      type: 'article',
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified,
    },
  }
}

export default async function InsightArticlePage({ params }: Params) {
  const article = findInsight((await params).slug)
  if (!article) notFound()

  const url = `${siteOrigin()}/insights/${article.slug}`
  const articleLd = articleSchema({
    headline: article.title,
    description: article.description,
    url,
    datePublished: article.datePublished,
    dateModified: article.dateModified,
  })
  const faqLd = faqSchema(article.faqs.map((faq) => ({ question: faq.question, answer: faq.answer })))
  const crumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Notes', url: '/insights' },
    { name: article.title, url: `/insights/${article.slug}` },
  ])

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <p className="text-sm text-white/45 mb-4">
        <Link href="/" className="hover:text-white">Home</Link>
        {' / '}
        <Link href="/insights" className="hover:text-white">Notes</Link>
      </p>
      <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{article.title}</h1>
      <p className="text-white/45 text-xs mt-3">19 November 2026 · KALKI Intelligence</p>
      <div className="mt-8 space-y-8">
        {article.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold text-white mb-3">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="text-white/75 text-sm leading-relaxed mb-3">{paragraph}</p>
            ))}
          </section>
        ))}
        <section>
          <h2 className="text-xl font-bold text-white mb-3">Related services</h2>
          <ul className="space-y-1.5">
            {article.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-cyan-400/85 hover:text-cyan-300">{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-white mb-4">Frequently asked</h2>
          <div className="space-y-4">
            {article.faqs.map((faq) => (
              <details key={faq.question} className="border-b border-white/5 pb-3">
                <summary className="text-white font-medium cursor-pointer hover:text-cyan-400">{faq.question}</summary>
                <p className="text-white/65 mt-2 text-sm">{faq.answer}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
      <SiteFooter />
    </article>
  )
}
