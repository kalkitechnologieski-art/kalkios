// == KALKI B6 ENTERPRISE SEO ==
// Dynamic sitemap: real categories (clean landing URLs), every service detail
// page, and image entries for Google Image Search indexing.
// -----------------------------------------------------------------------------

import { MetadataRoute } from 'next';
import { createPublicClient } from '@/lib/supabase/public-client';
import { getServiceImageUrl, getCategoryImageUrl } from '@/lib/services/service-image';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com';

interface ServiceRow {
  slug: string;
  category: string;
  name: string;
  updated_at: string | null;
}

function absImage(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${SITE}${url}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();

  // @ts-ignore - runtime table
  const { data } = await supabase
    .from('services')
    .select('slug, category, name, updated_at')
    .eq('is_active', true as any)
    .order('category');

  const services = (data ?? []) as ServiceRow[];
  const categories = Array.from(new Set(services.map((s) => s.category))).sort();

  const now = new Date().toISOString();

  const corePages: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE}/marketplace`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/request`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${SITE}/explore`, lastModified: now, changeFrequency: 'daily', priority: 0.85 },
    { url: `${SITE}/chat`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/careers`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE}/support`, lastModified: now, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE}/marketplace/${encodeURIComponent(category)}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.8,
    images: [absImage(getCategoryImageUrl(category))],
  }));

  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${SITE}/marketplace/${encodeURIComponent(service.category)}/${encodeURIComponent(service.slug)}`,
    lastModified: service.updated_at || now,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
    images: [absImage(getServiceImageUrl(service))],
  }));

  return [...corePages, ...categoryPages, ...servicePages];
}
