// == KALKI B4 EXPERIENCE ==
import type { Database } from '@/lib/supabase/types';

type Service = Database['public']['Tables']['services']['Row'] & {
  aeo_summary?: string | null;
};

export function ProductSchema({ service }: { service: Service }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: service.name,
    description: service.aeo_summary ?? service.description ?? '',
    image: service.image_url || undefined,
    sku: service.slug,
    brand: { '@type': 'Brand', name: 'KALKI OS' },
    offers: {
      '@type': 'Offer',
      url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://kalkios.com'}/marketplace/${service.category}/${service.slug}`,
      priceCurrency: 'INR',
      price: service.price ?? 0,
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: service.rating
      ? {
          '@type': 'AggregateRating',
          ratingValue: service.rating,
          reviewCount: service.review_count || 0,
        }
      : undefined,
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
