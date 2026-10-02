// == KALKI B5 LAUNCH ==
// JSON-LD generators for SEO (Product, Offer, FAQ, HowTo, Review,
// Breadcrumb, Organization, LocalBusiness, Article).
// All generators return plain objects safe to JSON.stringify.
// -----------------------------------------------------------------------------

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com';
const ORG_NAME = 'KALKI Intelligence';
const ORG_LEGAL_NAME = 'KALKI Intelligence LLP';
const ORG_LOGO = `${SITE}/images/logo.svg`;

export interface ProductInput {
  name: string;
  slug: string;
  category: string;
  description: string;
  image_url?: string | null;
  price?: number | null;
  rating?: number | null;
  review_count?: number | null;
}

export function productSchema(p: ProductInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    description: p.description,
    sku: p.slug,
    mpn: p.slug,
    image: p.image_url ? [p.image_url] : undefined,
    brand: { '@type': 'Brand', name: ORG_NAME },
    category: p.category,
    offers: {
      '@type': 'Offer',
      url: `${SITE}/marketplace/${encodeURIComponent(p.category)}/${encodeURIComponent(p.slug)}`,
      priceCurrency: 'INR',
      price: p.price ?? 0,
      priceValidUntil: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: ORG_NAME,
        url: SITE,
      },
    },
    aggregateRating:
      p.rating && p.review_count
        ? {
            '@type': 'AggregateRating',
            ratingValue: p.rating,
            reviewCount: p.review_count,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
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
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${SITE}${it.url}`,
    })),
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
    logo: {
      '@type': 'ImageObject',
      url: ORG_LOGO,
      width: 512,
      height: 512,
    },
    foundingDate: '2025-01-01',
    founders: [{ '@type': 'Person', name: 'KALKI Intelligence Team' }],
    email: 'team@kalki-intelligence.in',
    telephone: '+91-6261031710',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '51, MOG Lines, Swastik Nagar',
      addressLocality: 'Indore',
      addressRegion: 'Madhya Pradesh',
      postalCode: '452002',
      addressCountry: 'IN',
    },
    sameAs: [
      `${SITE}`,
      'https://www.linkedin.com/company/kalki-intelligence',
      'https://twitter.com/kalki_intel',
    ],
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
    telephone: '+91-6261031710',
    priceRange: '₹₹',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '51, MOG Lines, Swastik Nagar',
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
      '@type': 'Country',
      name: 'India',
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
      '@type': 'Person',
      name: a.authorName ?? 'KALKI Intelligence',
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
