// == KALKI B5 LAUNCH ==
// Emits full JSON-LD: Organization + LocalBusiness + Product + FAQ + Breadcrumb.
// Server component. No client JS.
// -----------------------------------------------------------------------------

import type { Database } from '@/lib/supabase/types';
import {
  productSchema,
  faqSchema,
  breadcrumbSchema,
  organizationSchema,
  localBusinessSchema,
} from '@/lib/seo/schema';
import { buildFaqs } from '@/lib/aeo/answer-blocks';

type Service = Database['public']['Tables']['services']['Row'] & {
  aeo_summary?: string | null;
  target_industries?: string[] | null;
};

export function ServiceSchema({ service }: { service: Service }) {
  const faqs = buildFaqs({
    name: service.name,
    category: service.category,
    description: service.description,
    long_description: null,
    price: service.price,
    duration_days: service.duration_days,
    features: Array.isArray(service.features)
      ? (service.features as unknown[]).filter((f): f is string => typeof f === 'string')
      : [],
    target_industries: service.target_industries ?? null,
  });

  const schemas = [
    organizationSchema(),
    localBusinessSchema(),
    productSchema({
      name: service.name,
      slug: service.slug,
      category: service.category,
      description: service.aeo_summary ?? service.description ?? '',
      image_url: service.image_url,
      price: service.price,
      rating: service.rating,
      review_count: service.review_count,
    }),
    faqSchema(faqs),
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Marketplace', url: '/marketplace' },
      { name: service.category, url: `/marketplace?category=${encodeURIComponent(service.category)}` },
      { name: service.name, url: `/marketplace/${encodeURIComponent(service.category)}/${encodeURIComponent(service.slug)}` },
    ]),
  ];

  return (
    <>
      {schemas.map((s, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(s) }}
        />
      ))}
    </>
  );
}
