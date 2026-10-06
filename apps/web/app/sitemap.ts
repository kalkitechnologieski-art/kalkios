// == KALKI B6 ENTERPRISE SEO ==
// Dynamic sitemap generator with changefreq and priority
// -----------------------------------------------------------------------------

import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  // Fetch services for dynamic routes
  const { data: services } = await supabase
    .from('services')
    .select('slug, category, updated_at')
    .eq('is_active', true);

  interface ServiceRow {
    slug: string;
    category: string;
    updated_at: string | null;
  }

  // Fetch blog posts (if you have them)
  // const { data: posts } = await supabase
  //   .from('blog_posts')
  //   .select('slug, published_at, updated_at')
  //   .eq('published', true);

  const now = new Date().toISOString();

  return [
    // Core pages - highest priority
    {
      url: SITE,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE}/explore`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE}/marketplace`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${SITE}/chat`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE}/about`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE}/careers`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE}/support`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },

    // Service category pages
    ...getServiceCategoryPages(),

    // Individual service pages
    ...((services as ServiceRow[])?.map((service) => ({
      url: `${SITE}/marketplace/${encodeURIComponent(service.category)}/${encodeURIComponent(service.slug)}`,
      lastModified: service.updated_at || now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) || []),

    // Static pages
    {
      url: `${SITE}/terms`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${SITE}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];
}

/**
 * Get service category pages with counts
 */
function getServiceCategoryPages() {
  const categories = [
    'Web Development',
    'Digital Marketing',
    'SEO Services',
    'AI Chatbots',
    'Mobile Apps',
    'Cloud Solutions',
    'Data Analytics',
    'Automation',
  ];

  return categories.map((category) => ({
    url: `${SITE}/marketplace?category=${encodeURIComponent(category)}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.8,
  }));
}
