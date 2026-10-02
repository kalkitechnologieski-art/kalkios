// == KALKI B5 LAUNCH ==
// Build Next.js Metadata objects per entity type.
// -----------------------------------------------------------------------------

import type { Metadata } from 'next';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com';
const SITE_NAME = 'KALKI OS';

export interface ProductMetaInput {
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  ogImage?: string | null;
}

export function buildProductMetadata(p: ProductMetaInput): Metadata {
  const canonical = p.canonicalUrl ?? `${SITE}/marketplace/${encodeURIComponent(p.category)}/${encodeURIComponent(p.slug)}`;
  const title = p.seoTitle ?? `${p.name} — ${SITE_NAME}`;
  const description = p.seoDescription ?? p.description ?? 'AI-powered service by KALKI OS.';
  const ogImage = p.ogImage ?? `${SITE}/api/og/${encodeURIComponent(p.slug)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'en_IN',
      images: [{ url: ogImage, width: 1200, height: 630, alt: p.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

export function buildCategoryMetadata(category: string, count: number): Metadata {
  const title = `${category} Services — ${SITE_NAME}`;
  const description = `Browse ${count} AI-powered ${category} services from KALKI Intelligence. Starting at ₹499. Indore-based team, serving all of India.`;
  const canonical = `${SITE}/marketplace?category=${encodeURIComponent(category)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      type: 'website',
    },
  };
}

export function buildRootMetadata(): Metadata {
  return {
    metadataBase: new URL(SITE),
    title: {
      template: `%s | ${SITE_NAME}`,
      default: `${SITE_NAME} — Temple of Technology`,
    },
    description:
      'Enterprise AI platform: marketplace, AI concierge (Siddhi), lead generation (SETU), and digital services for Indian businesses.',
    keywords: [
      'AI', 'AI automation', 'digital marketing', 'Indore', 'India',
      'web development', 'SEO', 'chatbot', 'enterprise AI', 'Siddhi', 'KALKI OS',
    ],
    authors: [{ name: 'KALKI Intelligence', url: SITE }],
    creator: 'KALKI Intelligence',
    publisher: 'KALKI Intelligence',
    formatDetection: { email: false, address: false, telephone: false },
    alternates: { canonical: SITE },
    openGraph: {
      title: `${SITE_NAME} — Temple of Technology`,
      description: 'AI-powered digital services & enterprise solutions.',
      url: SITE,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: 'website',
      images: [{ url: `${SITE}/images/og-image.jpg`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — Temple of Technology`,
      description: 'AI-powered digital services & enterprise solutions.',
      creator: '@kalki_intel',
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    category: 'technology',
  };
}
