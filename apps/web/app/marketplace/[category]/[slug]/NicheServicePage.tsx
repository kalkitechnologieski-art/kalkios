import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight, FileText } from 'lucide-react';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { AnimatedHeadline } from '@/components/motion/AnimatedHeadline';
import { AnimatedEyebrow } from '@/components/motion/AnimatedEyebrow';
import { decodeSegment, normKey } from '@/lib/services/href';

const SITE = 'https://www.kalki-intelligence.in';

type Offer = { name: string; price: string; note: string };

type NichePage = {
  category: string;
  slug: string;
  title: string;
  description: string;
  h1: string;
  eyebrow: string;
  intro: string[];
  sections: { heading: string; paragraphs: string[] }[];
  faqs: { q: string; a: string }[];
  links: { href: string; label: string }[];
  offers: Offer[];
};

const PAGES: NichePage[] = [
  {
    category: 'Web Development',
    slug: 'astrology-website-development',
    title: 'Astrology Website Development | KALKI Intelligence',
    description:
      'Indore-based KALKI Intelligence builds astrology-practice websites from a written scope and fixed price. ₹0 advance. Written quote in 24 hours.',
    h1: 'Astrology Website Development',
    eyebrow: 'Web Development',
    intro: [
      'KALKI Intelligence can scope and build a website for an astrology practice, with the pages, contact form and any kundli tools listed in a written quote before work starts.',
      'We are based in Indore, founded in 2025, and every project has a fixed price, a ₹0 advance (you approve the quote first; this is not free work), and a written quote within 24 hours.',
    ],
    sections: [
      {
        heading: 'What this website can include',
        paragraphs: [
          'A typical starting point is our Landing Page (5 Pages) service: five custom-designed, mobile-responsive pages, a contact form, basic SEO setup, social media links, and one month of hosting. For an astrology practice, those five pages can be scoped as, for example, a home page, an about page, a services page, a booking or contact page, and a Hindi or English content page — the exact set is fixed in the quote. The listed starting price for this package is ₹5,000, pending a written quote; most projects are quoted individually.',
        ],
      },
      {
        heading: 'Kundli and horoscope tools',
        paragraphs: [
          'If the brief includes kundli or horoscope features, we can scope them from our existing AI Horoscope & Kundali API service, which is built to integrate horoscope and kundali generation into a website or app. That service lists daily horoscope, kundali generation, compatibility matching, and muhurta (auspicious time) APIs, and is described as white-label ready. The listed starting price is ₹29,999, pending a written quote. This page does not claim that KALKI has already shipped a finished astrology website.',
        ],
      },
      {
        heading: 'Booking, chat and contact',
        paragraphs: [
          'The five-page website package includes contact form integration. Separately, our AI chatbot automation service can be scoped to automate lead qualification and appointment booking via AI chat. WhatsApp can be set up as a booking or contact channel within the written scope. Custom chatbot work is also available, with multi-channel deployment listed as a deliverable; the channels themselves are confirmed in the quote.',
        ],
      },
      {
        heading: 'How we work, price and timing',
        paragraphs: [
          'You get a fixed-scope quote listing deliverables, revisions and the delivery date. If it is not written down, it is not promised. There is no card, payment link or advance to start; you approve the quote first, then work is scheduled. A written quote comes within 24 hours. After you accept a quote, most digital services are delivered in 30–60 days; the five-page landing page service typically lists 30 days, depending on complexity.',
        ],
      },
      {
        heading: 'Support in Hindi and English',
        paragraphs: [
          'Support is available in Hindi and English from our Indore team, which serves businesses across India. We build Hindi-language website pages as part of the written scope. We also work with vastu consultancies, and the same website scope applies.',
        ],
      },
    ],
    faqs: [
      {
        q: 'Do I pay anything to get a quote?',
        a: 'No. There is no advance and no payment link to start. You approve the written quote first, then work is scheduled. ₹0 to start does not mean the work is free.',
      },
      {
        q: 'How soon do I get a quote, and how long does a website take?',
        a: 'A written scope and fixed price come within 24 hours of your brief. The five-page landing page service typically lists 30 days, depending on complexity. After you accept a quote, most digital services are delivered in 30–60 days.',
      },
      {
        q: 'Can kundli or horoscope tools be part of the website?',
        a: 'Yes, they can be scoped. Our AI Horoscope & Kundali API is built to integrate horoscope and kundali generation into a website or app, and lists daily horoscope, kundali generation, compatibility matching and muhurta APIs.',
      },
      {
        q: 'What is the starting price?',
        a: 'The five-page landing page lists a starting price of ₹5,000, and the horoscope and kundali API lists a starting price of ₹29,999. Both are starting figures pending a written quote. Most projects are quoted individually.',
      },
    ],
    links: [
      { href: '/marketplace/Web%20Development/landing-page-5-pages', label: 'Landing Page (5 Pages)' },
      { href: '/marketplace/AI%20Automation/ai-horoscope-kundali-api', label: 'AI Horoscope & Kundali API' },
      { href: '/marketplace/AI/ai-chatbot-development', label: 'AI chatbot development' },
      { href: '/marketplace/AI%20Automation/ai-chatbot-automation', label: 'AI chatbot automation' },
      { href: '/marketplace/Marketing/enterprise-seo', label: 'Enterprise SEO' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
    offers: [
      { name: 'Landing Page (5 Pages)', price: '5000', note: 'Starting price pending a written quote.' },
      { name: 'AI Horoscope & Kundali API', price: '29999', note: 'Starting price pending a written quote.' },
    ],
  },
  {
    category: 'Marketing',
    slug: 'seo-for-astrologers',
    title: 'SEO for Astrologers | KALKI Intelligence',
    description:
      'On-page SEO, competitor analysis, link building and monthly reporting for astrologers. Starting from ₹49,999. No ranking promises. Quote in 24 hours.',
    h1: 'SEO for Astrologers',
    eyebrow: 'Marketing',
    intro: [
      'KALKI Intelligence can scope SEO work for an astrology practice using the services listed on our Enterprise SEO page: competitor analysis, on-page SEO, link building and monthly reporting.',
      'We are based in Indore and were founded in 2025; every engagement has a written scope, a fixed price, a ₹0 advance (you approve the quote first; this is not free work), and a written quote within 24 hours.',
    ],
    sections: [
      {
        heading: 'What the SEO work covers',
        paragraphs: [
          'The Enterprise SEO service covers competitor analysis, on-page SEO, link building and monthly reporting. That is the work we can put in a written scope for an astrology practice. We do not promise rankings, traffic gains or AI-search citations.',
        ],
      },
      {
        heading: 'How progress is reported',
        paragraphs: [
          'SEO, conversion and lead-nurturing work ships with the numbers attached — rankings, enquiries and traffic sources — reported in writing. Monthly reporting is a listed deliverable of the Enterprise SEO service. Those reports describe what was measured; they are not a guarantee of a position.',
        ],
      },
      {
        heading: 'Website and content prerequisites',
        paragraphs: [
          'SEO work assumes there is a website to improve. If you also need a site, our five-page landing page package includes basic SEO setup, and a separate astrology-website scope can be written alongside this one. Content writing, including service pages, Hindi-language pages and articles about consultations, is part of our SEO work and is set out in the written scope. Local SEO, including Google Business Profile work, is also part of our SEO work.',
        ],
      },
      {
        heading: 'Price, timing and how we work',
        paragraphs: [
          'Enterprise SEO lists a starting price of ₹49,999, pending a written quote, and typically 30-day delivery depending on complexity. ₹0 advance means no payment is needed to share your brief; listed prices are starting figures, and the work is not free. You get a fixed-scope quote listing deliverables, revisions and the delivery date. If it is not written down, it is not promised.',
        ],
      },
      {
        heading: 'Related services and support',
        paragraphs: [
          'If the brief also covers a new site, kundli tools, or a chatbot for appointment booking, those are separate services and are quoted in writing. Support is available in Hindi and English from our Indore team, which serves businesses across India. We also work with vastu consultancies, and the same SEO scope applies.',
        ],
      },
      {
        heading: 'What we will not claim',
        paragraphs: [
          'We will not claim a number-one ranking, a guaranteed position, or prior astrology-SEO case results on this page. The About page states we do not publish invented client counts, unverifiable ratings, or award badges. Test us with a real brief.',
        ],
      },
    ],
    faqs: [
      {
        q: 'What does the SEO work include?',
        a: 'Competitor analysis, on-page SEO, link building and monthly reporting, confirmed in a written quote before work starts.',
      },
      {
        q: 'Do you guarantee rankings?',
        a: 'No. We do not promise rankings, traffic gains or AI-search citations. Monthly reporting shares measured rankings, enquiries and traffic sources in writing.',
      },
      {
        q: 'How much does it cost and when do I pay?',
        a: 'Enterprise SEO lists a starting price of ₹49,999, pending a written quote. There is no advance to start. You approve the quote first. A written quote comes within 24 hours. Typical delivery is 30 days, depending on complexity.',
      },
      {
        q: 'Can this be combined with a new astrology website?',
        a: 'Yes. Website work and SEO are separate services and can be scoped together in writing. The five-page landing page package includes basic SEO setup, and kundli or chatbot features can be added from those service pages.',
      },
    ],
    links: [
      { href: '/marketplace/Marketing/enterprise-seo', label: 'Enterprise SEO' },
      { href: '/marketplace/Web%20Development/landing-page-5-pages', label: 'Landing Page (5 Pages)' },
      { href: '/marketplace/AI%20Automation/ai-horoscope-kundali-api', label: 'AI Horoscope & Kundali API' },
      { href: '/marketplace/AI/ai-chatbot-development', label: 'AI chatbot development' },
      { href: '/marketplace/Web%20Development/astrology-website-development', label: 'Astrology website development' },
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact' },
    ],
    offers: [
      { name: 'Enterprise SEO', price: '49999', note: 'Starting price pending a written quote. No ranking promise.' },
    ],
  },
];

export function canonicalNicheUrl(page: NichePage): string {
  return `${SITE}/marketplace/${encodeURIComponent(page.category)}/${encodeURIComponent(page.slug)}`;
}

export function findNichePage(category: string, slug: string): NichePage | null {
  const cat = normKey(decodeSegment(category));
  const sl = normKey(decodeSegment(slug));
  return PAGES.find((p) => normKey(p.category) === cat && normKey(p.slug) === sl) ?? null;
}

export function nicheMetadata(page: NichePage): Metadata {
  const canonical = canonicalNicheUrl(page);
  return {
    title: { absolute: page.title },
    description: page.description,
    alternates: { canonical },
    openGraph: { title: page.title, description: page.description, url: canonical },
  };
}

function serviceJsonLd(page: NichePage) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.h1,
    description: page.intro.join(' '),
    url: canonicalNicheUrl(page),
    provider: { '@id': `${SITE}/#organization` },
    areaServed: 'India',
    offers: page.offers.map((offer) => ({
      '@type': 'Offer',
      name: offer.name,
      price: offer.price,
      priceCurrency: 'INR',
      description: offer.note,
      url: canonicalNicheUrl(page),
    })),
  };
}

export function NicheServicePage({ page }: { page: NichePage }) {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd(page)) }} />
      <div className="flex items-center gap-2 text-sm text-white/40 mb-6 flex-wrap">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/marketplace" className="hover:text-white transition">Marketplace</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/marketplace/${encodeURIComponent(page.category)}`} className="hover:text-white transition">{page.category}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white/80">{page.h1}</span>
      </div>
      <div className="space-y-4 max-w-3xl">
        <AnimatedEyebrow label={page.eyebrow} />
        <AnimatedHeadline as="h1" text={page.h1} className="text-3xl md:text-4xl font-bold text-white leading-tight" />
        {page.intro.map((p) => (
          <p key={p} className="text-white/75 text-sm leading-relaxed border-l-2 border-cyan-500/30 pl-3">{p}</p>
        ))}
      </div>
      <div className="mt-10 space-y-8 max-w-3xl">
        {page.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold text-white mb-3">{section.heading}</h2>
            {section.paragraphs.map((p) => (
              <p key={p} className="text-white/75 text-sm leading-relaxed mb-3">{p}</p>
            ))}
          </section>
        ))}
        <section>
          <h2 className="text-xl font-bold text-white mb-3">Related pages</h2>
          <ul className="space-y-1.5">
            {page.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-cyan-400/85 hover:text-cyan-300 transition">{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Frequently asked</h2>
          <div className="space-y-4">
            {page.faqs.map((faq) => (
              <details key={faq.q} className="border-b border-white/5 pb-3">
                <summary className="text-white font-medium cursor-pointer hover:text-cyan-400 transition">{faq.q}</summary>
                <p className="text-white/65 mt-2 text-sm">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-white/75 text-sm leading-relaxed">
            Send a brief — you get a written scope, a fixed price and a delivery date within 24 hours. Nothing to pay to start.
          </p>
          <Link href="/contact">
            <LuxuryButton variant="cyber" size="lg" label="Use the contact form" icon={<FileText className="w-4 h-4" />} />
          </Link>
          <p className="text-sm text-white/60">
            Or email <a className="text-cyan-400 hover:text-cyan-300" href="mailto:ceo@kalki-intelligence.in">ceo@kalki-intelligence.in</a>
          </p>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
