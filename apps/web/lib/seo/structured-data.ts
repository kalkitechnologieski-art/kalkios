// == KALKI B6 ENTERPRISE SEO ==
// Comprehensive structured data for SEO, AEO, and GEO
// -----------------------------------------------------------------------------

export interface StructuredDataOptions {
  url: string;
  title: string;
  description: string;
  image?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  keywords?: string[];
}

/**
 * Article schema for blog posts, service pages, knowledge base
 * Critical for featured snippets and answer engines
 */
export function articleSchema(options: StructuredDataOptions) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: options.title,
    description: options.description,
    image: options.image,
    author: {
      '@type': 'Organization',
      name: options.author || 'KALKI Intelligence',
      url: 'https://kalkios.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'KALKI Intelligence',
      logo: {
        '@type': 'ImageObject',
        url: 'https://kalkios.com/images/logo.svg',
      },
    },
    datePublished: options.publishedTime || new Date().toISOString(),
    dateModified: options.modifiedTime || new Date().toISOString(),
    mainEntityOfPage: options.url,
    wordCount: estimateWordCount(options.description),
    keywords: options.keywords?.join(', '),
    inLanguage: 'en-IN',
    isPartOf: {
      '@type': 'WebSite',
      name: 'KALKI OS',
      url: 'https://kalkios.com',
    },
  };
}

/**
 * FAQ schema - CRITICAL for AEO and People Also Ask boxes
 */
export function faqSchema(questions: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
        inLanguage: 'en-IN',
      },
    })),
  };
}

/**
 * HowTo schema for step-by-step guides
 * Optimized for featured snippets
 */
export function howtoSchema(steps: Array<{ name: string; text: string; url?: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'Complete Guide',
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      url: step.url,
    })),
    totalTime: 'PT30M',
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'INR',
      value: '499',
    },
  };
}

/**
 * Product schema with offers for marketplace services
 */
export function productSchema(service: {
  name: string;
  description: string;
  price: number;
  currency?: string;
  availability?: string;
  rating?: number;
  reviewCount?: number;
  image?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: service.name,
    description: service.description,
    image: service.image,
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: service.currency || 'INR',
      availability: `https://schema.org/${service.availability || 'InStock'}`,
      seller: {
        '@type': 'Organization',
        name: 'KALKI Intelligence',
      },
    },
    aggregateRating: service.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: service.rating,
          reviewCount: service.reviewCount || 0,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
    brand: {
      '@type': 'Brand',
      name: 'KALKI OS',
    },
    category: 'Digital Services',
  };
}

/**
 * BreadcrumbList for navigation structure
 * Helps search engines understand site hierarchy
 */
export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * WebSite schema with SearchAction for sitelinks search box
 */
export function websiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'KALKI OS',
    url: 'https://kalkios.com',
    description: 'Enterprise AI platform for Indian businesses',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://kalkios.com/explore?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: ['en-IN', 'hi-IN'],
  };
}

/**
 * SoftwareApplication schema for the platform itself
 */
export function softwareApplicationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'KALKI OS',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description:
      'Enterprise AI platform combining marketplace, AI concierge (Siddhi), lead generation (SETU), and digital services.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'INR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '127',
    },
    featureList: [
      'AI-powered chatbot (Siddhi)',
      'Lead generation engine (SETU)',
      'Service marketplace',
      'Project management',
      'Invoice automation',
      'Real-time notifications',
    ],
    screenshot: 'https://kalkios.com/images/platform-screenshot.jpg',
    softwareVersion: '3.0.0',
    datePublished: '2024-01-01',
    dateModified: new Date().toISOString(),
    author: {
      '@type': 'Organization',
      name: 'KALKI Intelligence',
      url: 'https://kalkios.com',
    },
  };
}

/**
 * Speakable specification for voice search and screen readers
 * Critical for AEO and voice assistants
 */
export function speakableSchema(content: {
  headline: string;
  summary: string;
  fullText: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: content.headline,
    description: content.summary,
    articleBody: content.fullText,
    speakable: {
      '@type': 'SpeakableSpecification',
      xpath: ['/html/head/title', '/html/body/main/article/p[1]'],
      cssSelector: ['.speakable-summary', '.speakable-content'],
    },
  };
}

/**
 * CollectionPage schema for marketplace categories
 */
export function collectionPageSchema(category: string, services: any[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category} Services`,
    description: `Browse ${services.length} AI-powered ${category} services`,
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: services.slice(0, 10).map((service, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Product',
          name: service.name,
          url: `https://kalkios.com/marketplace/${encodeURIComponent(category)}/${encodeURIComponent(service.slug)}`,
        },
      })),
      numberOfItems: services.length,
    },
  };
}

/**
 * LocalBusiness enhancements with geo-coordinates
 * Critical for local SEO in Indore/India
 */
export function enhancedLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'KALKI Intelligence',
    image: 'https://kalkios.com/images/logo.svg',
    url: 'https://kalkios.com',
    telephone: '+91-XXX-XXXXXXX',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Tech Park',
      addressLocality: 'Indore',
      addressRegion: 'Madhya Pradesh',
      postalCode: '452001',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '22.7196',
      longitude: '75.8577',
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '09:00',
      closes: '18:00',
    },
    areaServed: {
      '@type': 'Country',
      name: 'India',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Digital Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Web Development',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'SEO Optimization',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'AI Chatbot Integration',
          },
        },
      ],
    },
  };
}

/**
 * Estimate word count from description
 */
function estimateWordCount(text: string | null | undefined): number {
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}
