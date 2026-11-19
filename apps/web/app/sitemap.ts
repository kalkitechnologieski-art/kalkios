import { MetadataRoute } from 'next';
import { fetchAllCategories, fetchServices } from '@/lib/services';
import { categoryHref, serviceHref } from '@/lib/services/href';
import { getServiceImageUrl, getCategoryImageUrl } from '@/lib/services/service-image';
import { siteOrigin } from '@/lib/seo/site-url';
import { INSIGHTS } from '@/lib/content/insights';
import { CONTENT_UPDATED } from '@/lib/seo/content-date';

const SITE = siteOrigin();
const UPDATED = new Date(CONTENT_UPDATED);

function absImage(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `${SITE}${url}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, categories] = await Promise.all([fetchServices(), fetchAllCategories()]);

  const corePages: MetadataRoute.Sitemap = [
    { url: SITE, lastModified: UPDATED, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE}/marketplace`, lastModified: UPDATED, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/insights`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE}/request`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${SITE}/explore`, lastModified: UPDATED, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE}/about`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/contact`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE}/careers`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${SITE}/support`, lastModified: UPDATED, changeFrequency: 'weekly', priority: 0.4 },
    { url: `${SITE}/terms`, lastModified: UPDATED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE}/privacy`, lastModified: UPDATED, changeFrequency: 'yearly', priority: 0.3 },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${SITE}${categoryHref(category)}`,
    lastModified: UPDATED,
    changeFrequency: 'daily' as const,
    priority: 0.8,
    images: [absImage(getCategoryImageUrl(category))],
  }));

  const articlePages: MetadataRoute.Sitemap = INSIGHTS.map((article) => ({
    url: `${SITE}/insights/${article.slug}`,
    lastModified: article.dateModified,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${SITE}${serviceHref(service)}`,
    lastModified: service.updated_at || UPDATED,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
    images: [absImage(getServiceImageUrl(service))],
  }));

  return [...corePages, ...categoryPages, ...articlePages, ...servicePages];
}
