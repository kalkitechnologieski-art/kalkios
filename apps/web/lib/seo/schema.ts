// == KALKI B5 LAUNCH ==
// JSON-LD generators for SEO (Product, Offer, FAQ, HowTo, Review,
// Breadcrumb, Organization, LocalBusiness, Article).
// All generators return plain objects safe to JSON.stringify.
// -----------------------------------------------------------------------------

import { siteOrigin } from '@/lib/seo/site-url';
import { serviceHref } from '@/lib/services/href';

const SITE = siteOrigin();
const ORG_NAME = 'KALKI Intelligence';
const ORG_LEGAL_NAME = 'KALKI Intelligence LLP';
const ORG_LOGO = `${SITE}/images/logo.svg`;
const FOUNDER_LINKEDIN = 'https://www.linkedin.com/in/nikhil-singh-8a4338298';
const COMPANY_LINKEDIN = 'https://www.linkedin.com/company/kalki-intelligence';

export function founderSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${SITE}/#founder`,
    name: 'Nikhil Singh',
    jobTitle: 'Founder & CEO',
    email: 'ceo@kalki-intelligence.in',
    url: `${SITE}/about`,
    worksFor: { '@id': `${SITE}/#organization` },
    sameAs: [FOUNDER_LINKEDIN],
  };
}

export interface ProductInput {
  name: string;
  slug: string;
  category: string;
  description: string;
  image_url?: string | null;
  price?: number | null;
}

export function productSchema(p: ProductInput) {
  // Service (not Product): Product+Offer is treated as a Merchant listing and
  // flags missing shipping/returns. These are scoped services, not shipped goods.
  const url = `${SITE}${serviceHref({ category: p.category, slug: p.slug })}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: p.name,
    description: p.description,
    url,
    image: p.image_url ? [p.image_url] : undefined,
    serviceType: p.category,
    provider: { '@id': `${SITE}/#organization` },
    areaServed: { '@type': 'Place', name: 'Worldwide' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: p.price ?? 0,
      availability: 'https://schema.org/InStock',
    },
  };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export function faqSchema(items: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  };
}

export interface HowToStep {
  name: string;
  text: string;
}

export function howToSchema(input: {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string; // ISO 8601 duration
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: input.name,
    description: input.description,
    totalTime: input.totalTime,
    step: input.steps.map((s, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: s.name,
      text: s.text,
    })),
  };
}

export interface ReviewInput {
  author: string;
  rating: number;
  text: string;
  datePublished: string;
}

export function reviewSchema(input: { itemName: string; reviews: ReviewInput[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.itemName,
    review: input.reviews.map((r) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: r.author },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.text,
      datePublished: r.datePublished,
    })),
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => {
      const name = (it.name || '').trim() || 'Page';
      let href = it.url.startsWith('http') ? it.url : `${SITE}${it.url || '/'}`;
      if (href === SITE) href = `${SITE}/`;
      return {
        '@type': 'ListItem',
        position: i + 1,
        name,
        item: { '@id': href, name },
      };
    }),
  };
}

export function organizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE}/#organization`,
    name: ORG_NAME,
    legalName: ORG_LEGAL_NAME,
    url: SITE,
    description:
      'KALKI Intelligence is an AI and development tech partner for astrologers, vastu consultants, other spiritual practitioners, and businesses in every industry. The studio is in Indore. Delivery is worldwide. Written scope, fixed price, ₹0 advance.',
    slogan: 'Temple of technology',
    keywords: 'KALKI Intelligence, AI development company, AI automation agency, astrology website development, SEO for astrologers, vastu consultant marketing, AEO, GEO, WhatsApp Business API',
    areaServed: { '@type': 'Place', name: 'Worldwide' },
    logo: {
      '@type': 'ImageObject',
      url: ORG_LOGO,
      width: 512,
      height: 512,
    },
    foundingDate: '2025-01-01',
    founder: { '@id': `${SITE}/#founder` },
    knowsAbout: [
      'Custom AI agent development',
      'AI chatbot development',
      'WhatsApp Business API',
      'WhatsApp chatbots',
      'Omnichannel CRM and unified inboxes',
      'n8n workflow automation',
      'Astrology website development',
      'Astrology app development',
      'Kundali software',
      'AEO and GEO',
      'SEO for astrologers',
      'Vastu consultant websites and marketing',
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'KALKI Intelligence services',
      itemListElement: [
        ['Custom AI agent development', '/marketplace/ai/custom-ai-development'],
        ['AI chatbot development', '/marketplace/ai/ai-chatbot-development'],
        ['WhatsApp chatbot for business', '/marketplace/ai-chatbots/whatsapp-chatbot-for-business'],
        ['WhatsApp API integration', '/marketplace/ai-automation/whatsapp-business-api-setup'],
        ['Omnichannel CRM', '/marketplace/development/omnichannel-dm-crm'],
        ['n8n workflow automation', '/marketplace/ai-automation/n8n-workflow-automation'],
        ['Astrology website development', '/marketplace/web-development/astrology-website-development'],
        ['Astrology app development', '/marketplace/app-development/astrology-app-development'],
        ['Kundali software', '/marketplace/ai-automation/ai-horoscope-kundali-api'],
        ['AEO and GEO services', '/marketplace/marketing/aeo-geo-services'],
      ].map(([name, path]) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name, url: `${SITE}${path}` },
      })),
    },
    email: 'team@kalki-intelligence.in',
    telephone: '+91-6261031710',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '52, MOG Lines, Swastik Nagar',
      addressLocality: 'Indore',
      addressRegion: 'Madhya Pradesh',
      postalCode: '452002',
      addressCountry: 'IN',
    },
    sameAs: [COMPANY_LINKEDIN],
  };
}

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE}/#localbusiness`,
    name: ORG_NAME,
    image: ORG_LOGO,
    url: SITE,
    description:
      'KALKI Intelligence, Temple of technology. AI and development for astrologers, vastu consultants, spiritual practitioners, and businesses in every industry. Studio in Indore, delivery worldwide.',
    knowsAbout: [
      'Artificial intelligence',
      'Web development',
      'Astrology website development',
      'Vastu consultant websites and marketing',
      'SEO for astrologers',
      'AEO and GEO',
      'WhatsApp Business API',
      'Omnichannel CRM',
      'Lead generation',
      'Business automation',
    ],
    telephone: '+91-6261031710',
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '52, MOG Lines, Swastik Nagar',
      addressLocality: 'Indore',
      addressRegion: 'Madhya Pradesh',
      postalCode: '452002',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 22.7196,
      longitude: 75.8577,
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
    ],
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
  };
}

export interface ArticleInput {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
}

export function articleSchema(a: ArticleInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.headline,
    description: a.description,
    image: a.image ? [a.image] : undefined,
    datePublished: a.datePublished,
    dateModified: a.dateModified ?? a.datePublished,
    author: {
      '@type': 'Organization',
      name: a.authorName ?? ORG_NAME,
      url: SITE,
    },
    publisher: {
      '@type': 'Organization',
      name: ORG_NAME,
      logo: { '@type': 'ImageObject', url: ORG_LOGO },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': a.url,
    },
  };
}
