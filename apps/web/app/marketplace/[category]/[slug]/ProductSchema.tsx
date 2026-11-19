import type { Database } from '@/lib/supabase/types';
import { getServiceImageUrl } from '@/lib/services/service-image';
import { faqSchema, breadcrumbSchema, howToSchema } from '@/lib/seo/schema';
import { categoryHref, serviceHref } from '@/lib/services/href';
import { siteOrigin } from '@/lib/seo/site-url';

type Service = Database['public']['Tables']['services']['Row'] & {
  aeo_summary?: string | null;
  target_industries?: string[] | null;
};

const SITE = siteOrigin();

function absoluteImage(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${SITE}${url}`;
}

export function ProductSchema({
  service,
  faqs,
  process,
}: {
  service: Service;
  faqs: { question: string; answer: string }[];
  process: { name: string; text: string }[];
}) {
  const image = absoluteImage(getServiceImageUrl(service));
  const path = serviceHref(service);
  const url = `${SITE}${path}`;
  const description = service.aeo_summary ?? service.description ?? '';

  const product = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: service.name,
    description,
    image: [image],
    sku: service.slug,
    url,
    brand: { '@type': 'Brand', name: 'KALKI Intelligence' },
    category: service.category,
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: service.price ?? 0,
      availability: 'https://schema.org/InStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'KALKI Intelligence', url: SITE },
    },
  };

  const serviceLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.name,
    description,
    url,
    provider: { '@id': `${SITE}/#organization` },
    areaServed: { '@type': 'Place', name: 'Worldwide' },
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'INR',
      price: service.price ?? 0,
      availability: 'https://schema.org/InStock',
    },
  };

  const crumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Marketplace', url: '/marketplace' },
    { name: service.category, url: categoryHref(service.category) },
    { name: service.name, url: path },
  ]);

  const howTo = howToSchema({
    name: `How ${service.name} is scoped`,
    description: `The written-quote process for ${service.name}.`,
    steps: process,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
    </>
  );
}
