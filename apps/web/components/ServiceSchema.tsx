import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

export function ServiceSchema({ service }: { service: Service }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description: service.description,
    provider: {
      '@type': 'Organization',
      name: 'KALKI OS',
      url: 'https://kalkios.com',
    },
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
    },
    aggregateRating: service.rating ? {
      '@type': 'AggregateRating',
      ratingValue: service.rating,
      reviewCount: service.review_count || 0,
    } : undefined,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}
