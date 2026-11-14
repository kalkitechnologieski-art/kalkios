// == KALKI B6 ENTERPRISE SEO/AEO/GEO ==
// Enhanced metadata builder with answer engine and generative engine optimization
// -----------------------------------------------------------------------------

import type { Metadata } from 'next';
import { siteOrigin } from '@/lib/seo/site-url';

const SITE = siteOrigin();
const SITE_NAME = 'KALKI OS';
const DEFAULT_LOCALE = 'en_IN';

export interface EnhancedMetadataOptions {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogImage?: string;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  category?: string;
  tags?: string[];
  noIndex?: boolean;
  locale?: string;
  // AEO-specific fields
  faqCount?: number;
  howToSteps?: number;
  // GEO-specific fields
  entities?: string[];
  brandAuthority?: boolean;
}

/**
 * Build comprehensive metadata with SEO, AEO, and GEO optimizations
 */
export function buildEnhancedMetadata(options: EnhancedMetadataOptions): Metadata {
  const url = options.canonicalUrl || `${SITE}${options.path || ''}`;
  const title = options.title;
  const description = truncateDescription(options.description, 160);
  const keywords = buildKeywordString(options.keywords || []);
  const ogImage = options.ogImage || `${SITE}/images/og-default.png`;

  return {
    // Core meta tags
    title,
    description,
    keywords,
    
    // Canonical URL to prevent duplicate content
    alternates: {
      canonical: url,
    },

    // Authorship and E-E-A-T signals
    authors: [{ name: options.author || 'KALKI Intelligence', url: SITE }],
    creator: 'KALKI Intelligence',
    publisher: 'KALKI Intelligence',

    // Category and classification
    category: options.category || 'Technology',
    classification: 'AI & Digital Services',

    // Open Graph for social sharing
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      type: options.category === 'blog' ? 'article' : 'website',
      locale: options.locale || DEFAULT_LOCALE,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
          type: 'image/png',
        },
      ],
      ...(options.publishedTime && {
        publishedTime: options.publishedTime,
        modifiedTime: options.modifiedTime,
      }),
    },

    // Twitter Cards
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      creator: '@kalki_intel',
      site: '@kalki_intel',
      images: [ogImage],
    },

    // Robots directives - fine-grained control
    robots: options.noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1, // Allow unlimited snippet length for featured snippets
          },
        },

    // Additional meta tags for AEO/GEO
    other: {
      // Entity extraction hints for AI search engines
      'entity-type': (options.entities || ['SoftwareApplication', 'DigitalService']).join(', '),
      
      // Brand authority signals
      'brand-name': 'KALKI Intelligence',
      'brand-url': SITE,
      
      // Content freshness signals
      'last-modified': options.modifiedTime || new Date().toISOString(),
      
      // Audience targeting
      audience: 'Indian businesses, enterprises, startups',
      'geo.region': 'IN-MP',
      'geo.placename': 'Indore, Madhya Pradesh, India',
      'geo.position': '22.7196;75.8577',
      
      // Industry classification
      industry: 'Artificial Intelligence, Digital Services, SaaS',
      
      // AEO: Question-answer format indicators
      'question-format': options.faqCount ? `${options.faqCount} FAQs` : '',
      'howto-steps': options.howToSteps ? `${options.howToSteps} steps` : '',
    },

    // Site ownership verification is only emitted when a real code exists;
    // placeholder values make Search Console reject the verification attempt.
    ...((process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION)
      ? {
          verification: {
            ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
              ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
              : {}),
            ...(process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION
              ? { yandex: process.env.NEXT_PUBLIC_YANDEX_SITE_VERIFICATION }
              : {}),
          },
        }
      : {}),
  };
}

/**
 * Build FAQ page metadata optimized for People Also Ask
 */
export function buildFAQMetadata(
  topic: string,
  questionCount: number
): Metadata {
  return buildEnhancedMetadata({
    title: `${topic} - Frequently Asked Questions | ${SITE_NAME}`,
    description: `Complete guide to ${topic}. ${questionCount} expert answers to common questions about ${topic.toLowerCase()}. Updated for 2026.`,
    keywords: [
      topic,
      `${topic} FAQ`,
      `${topic} questions`,
      `${topic} answers`,
      `${topic} guide`,
      'how to',
      'what is',
      'best practices',
    ],
    faqCount: questionCount,
    category: 'FAQ',
  });
}

/**
 * Build blog post metadata with article schema support
 */
export function buildBlogMetadata(post: {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
  author?: string;
  tags?: string[];
  readTime?: number;
}): Metadata {
  return buildEnhancedMetadata({
    title: post.title,
    description: post.excerpt,
    path: `/blog/${post.slug}`,
    keywords: post.tags,
    publishedTime: post.publishedAt,
    modifiedTime: post.updatedAt || post.publishedAt,
    author: post.author || 'KALKI Team',
    category: 'blog',
    tags: post.tags,
  });
}

/**
 * Build service page metadata with product schema
 */
export function buildServiceMetadata(service: {
  name: string;
  description: string;
  slug: string;
  category: string;
  price: number;
  rating?: number;
  reviewCount?: number;
}): Metadata {
  return buildEnhancedMetadata({
    title: `${service.name} Services in Indore | From ₹${service.price}`,
    description: `Professional ${service.name.toLowerCase()} services from KALKI Intelligence, an AI tech company in Indore. ${service.description} Serving Indore and businesses across India.`,
    path: `/marketplace/${encodeURIComponent(service.category)}/${encodeURIComponent(service.slug)}`,
    keywords: [
      service.name,
      `${service.name} services`,
      `${service.name} Indore`,
      `${service.name} India`,
      `${service.name} price`,
      `${service.name} cost`,
      'tech company Indore',
      'AI tech company India',
      'professional',
      'enterprise',
    ],
    category: 'Service',
    entities: ['Product', 'Service', 'Offer'],
  });
}

/**
 * Build category page metadata
 */
export function buildCategoryMetadata(
  category: string,
  count: number,
  description?: string
): Metadata {
  const solutionLabel = count === 1 ? 'AI-Powered Solution' : 'AI-Powered Solutions';
  return buildEnhancedMetadata({
    title: `${category} Services in India | ${count} ${solutionLabel}`,
    description: description || `Browse ${count} professional ${category.toLowerCase()} services from an Indore-based tech company serving all of India. Transparent INR pricing, written scope, quote within 24 hours.`,
    path: `/marketplace/${encodeURIComponent(category)}`,
    keywords: [
      category,
      `${category} services`,
      `${category} India`,
      `${category} company Indore`,
      'AI services',
      'tech company India',
      'digital solutions',
      'business automation',
    ],
    category: 'Category',
    entities: ['CollectionPage', 'ItemList'],
  });
}

/**
 * Build homepage metadata with maximum keyword density
 */
export function buildHomepageMetadata(): Metadata {
  const title = 'AI Tech Company in Indore, India | KALKI OS';
  return {
    ...buildEnhancedMetadata({
      title,
      description:
        'KALKI Intelligence is a tech company in Indore building AI-powered websites, SEO, chatbots and business automation for Indian businesses. Transparent INR pricing, written scope, quote within 24 hours.',
      keywords: [
        'tech company',
        'tech company in Indore',
        'AI tech company India',
        'technology company India',
        'KALKI OS',
        'KALKI Intelligence',
        'AI platform India',
        'AI concierge',
        'Siddhi chatbot',
        'SETU lead generation',
        'web development Indore',
        'SEO services India',
        'digital marketing',
        'business automation',
        'SaaS India',
      ],
      entities: ['SoftwareApplication', 'Organization', 'LocalBusiness'],
      brandAuthority: true,
    }),
    // The "/" route re-exports this object, so the root title template never
    // reaches it; the brand has to be part of the absolute title.
    title: { absolute: title },
  };
}

/**
 * Helper: Truncate description to optimal length
 */
function truncateDescription(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const truncated = text.substring(0, maxLength - 3);
  const lastSpace = truncated.lastIndexOf(' ');
  return lastSpace > 0 ? truncated.substring(0, lastSpace) + '...' : truncated + '...';
}

/**
 * Helper: Build keyword string (comma-separated, max 20 keywords)
 */
function buildKeywordString(keywords: string[]): string | undefined {
  if (keywords.length === 0) return undefined;
  return keywords.slice(0, 20).join(', ');
}
