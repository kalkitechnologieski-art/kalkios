// == KALKI B5 LAUNCH ==
// Build Next.js Metadata objects per entity type.
// -----------------------------------------------------------------------------

import type { Metadata } from 'next';
import { siteOrigin } from '@/lib/seo/site-url';
import { categoryHref, serviceHref } from '@/lib/services/href';

const SITE = siteOrigin();
const SITE_NAME = 'KALKI Intelligence';

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
  const canonical = p.canonicalUrl ?? `${SITE}${serviceHref({ category: p.category, slug: p.slug })}`;
  const title = p.seoTitle ?? p.name;
  const description = p.seoDescription ?? p.description ?? `Service by ${SITE_NAME}. Written scope, fixed price, ₹0 advance.`;
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
  const description = `Browse ${count} ${category} services from KALKI Intelligence for astrologers, spiritual practitioners and every industry. Written scope, quote within 24 hours.`;
  const canonical = `${SITE}${categoryHref(category)}`;

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
      default: `${SITE_NAME} — AI & Development Partner`,
    },
    description:
      'KALKI Intelligence is an AI and development tech partner for astrologers, vastu consultants, spiritual practitioners, and businesses in every industry. Written scope, fixed price, ₹0 advance.',
    keywords: [
      'KALKI Intelligence', 'AI development company', 'AI automation agency',
      'astrology website development', 'SEO for astrologers', 'vastu consultant marketing',
      'WhatsApp API setup', 'omnichannel CRM development', 'AEO', 'GEO',
      'AI automation for astrologers', 'web development', 'SEO',
    ],
    authors: [{ name: 'KALKI Intelligence', url: SITE }],
    creator: 'KALKI Intelligence',
    publisher: 'KALKI Intelligence',
    formatDetection: { email: false, address: false, telephone: false },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
        { url: '/favicon-16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon-32.png', sizes: '32x32', type: 'image/png' },
        { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
        { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
      ],
      apple: '/apple-touch-icon.png',
      shortcut: '/favicon.ico',
    },
    manifest: '/manifest.webmanifest',
    appleWebApp: {
      title: SITE_NAME,
      statusBarStyle: 'default',
    },
    // No canonical here: it would leak the homepage URL to every page that does
    // not set its own, telling Google they are all duplicates of "/".
    openGraph: {
      title: `${SITE_NAME} — AI & Development Partner`,
      description:
        'AI and development for astrologers, vastu consultants, spiritual practitioners, and businesses in every industry. Written scope, fixed price, ₹0 advance.',
      url: SITE,
      siteName: SITE_NAME,
      locale: 'en_IN',
      type: 'website',
      images: [{ url: `${SITE}/images/og-default.png`, width: 1200, height: 630, type: 'image/png', alt: `${SITE_NAME} — Temple of technology` }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${SITE_NAME} — AI & Development Partner`,
      description:
        'AI and development for astrologers, vastu consultants, spiritual practitioners, and businesses in every industry. Written scope, fixed price, ₹0 advance.',
      creator: '@kalki_intel',
      images: [`${SITE}/images/og-default.png`],
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
