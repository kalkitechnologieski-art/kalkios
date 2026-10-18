// == KALKI B5 LAUNCH ==
// Rich JSON-LD for a service detail page: Product (with indexable premium
// image) + FAQPage (AEO) + BreadcrumbList. Server-only, no client JS.
// -----------------------------------------------------------------------------

import type { Database } from '@/lib/supabase/types';
import { getServiceImageUrl } from '@/lib/services/service-image';
import { faqSchema, breadcrumbSchema } from '@/lib/seo/schema';
import { buildFaqs } from '@/lib/aeo/answer-blocks';

type Service = Database['public']['Tables']['services']['Row'] & {
  aeo_summary?: string | null;
  target_industries?: string[] | null;
};

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com';

function absoluteImage(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${SITE}${url}`;
}

export function ProductSchema({ service }: { service: Service }) {
  const image = absoluteImage(getServiceImageUrl(service));
  const catPath = `/marketplace/${encodeURIComponent(service.category)}`;
  const url = `${catPath}/${encodeURIComponent(service.slug)}`;

  const features = Array.isArray(service.features)
    ? (service.features as unknown[]).filter((f): f is string => typeof f === 'string')
    : [];

  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: service.name,
    description: service.aeo_summary ?? service.description ?? '',
    image: [image],
    sku: service.slug,
    url: `${SITE}${url}`,
    brand: { '@type': 'Brand', name: 'KALKI OS' },
    category: service.category,
    offers: {
      '@type': 'Offer',
      url: `${SITE}${url}`,
      priceCurrency: 'INR',
      price: service.price ?? 0,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'KALKI Intelligence', url: SITE },
    },
    aggregateRating: service.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: service.rating,
          reviewCount: service.review_count || 0,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined,
  };

  const faqs = faqSchema(
    buildFaqs({
      name: service.name,
      category: service.category,
      description: service.description,
      long_description: null,
      price: service.price,
      duration_days: service.duration_days,
      features,
      target_industries: service.target_industries ?? null,
    })
  );

  const crumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Marketplace', url: '/marketplace' },
    { name: service.category, url: catPath },
    { name: service.name, url },
  ]);

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqs) }} />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
    </>
  );
}
