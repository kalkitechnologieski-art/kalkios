// == KALKI CATEGORY LANDING ==
// Server-rendered, indexable landing page per service category. Canonical home
// for category-level queries, with CollectionPage + Breadcrumb JSON-LD, a
// category hero image, the full service grid, and cross-category internal links.
// -----------------------------------------------------------------------------

import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { fetchAllCategories, fetchServicesByCategory } from '@/lib/services';
import { getCategoryImageUrl, getServiceImageUrl } from '@/lib/services/service-image';
import { decodeSegment } from '@/lib/services/href';
import { buildCategoryMetadata } from '@/lib/seo/enhanced-metadata';
import { breadcrumbSchema, organizationSchema } from '@/lib/seo/schema';
import ServiceCard from '@/components/ui/ServiceCard';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { AnimatedHeadline } from '@/components/motion/AnimatedHeadline';
import { AnimatedEyebrow } from '@/components/motion/AnimatedEyebrow';
import { siteOrigin } from '@/lib/seo/site-url';

const SITE = siteOrigin();

type Params = { params: Promise<{ category: string }> };

interface Row {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  price: number | null;
  rating: number | null;
  review_count: number | null;
  image_url: string | null;
  target_industries?: string[] | null;
  long_description?: string | null;
}

async function getServicesInCategory(category: string): Promise<Row[]> {
  // Single catalog source shared with the homepage and the detail pages, so a
  // card that renders can never link to a page that 404s.
  return (await fetchServicesByCategory(category)) as unknown as Row[];
}

async function getAllCategories(): Promise<string[]> {
  return fetchAllCategories();
}

export async function generateStaticParams() {
  const categories = await getAllCategories();
  // Next.js encodes path segments itself — returning pre-encoded values turns
  // "AI Chatbots" into "AI%2520Chatbots" and the page never matches.
  return categories.map((category) => ({ category }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const category = decodeSegment((await params).category);
  const services = await getServicesInCategory(category);
  return buildCategoryMetadata(category, services.length, undefined);
}

export default async function CategoryPage({ params }: Params) {
  const category = decodeSegment((await params).category);
  const services = await getServicesInCategory(category);
  if (services.length === 0) notFound();

  const allCategories = await getAllCategories();
  const otherCategories = allCategories.filter((c) => c !== category).slice(0, 8);
  const heroImage = getCategoryImageUrl(category);
  const count = services.length;

  const abs = (url: string) => (/^https?:\/\//i.test(url) ? url : `${SITE}${url}`);

  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${SITE}/marketplace/${encodeURIComponent(category)}#collection`,
    name: `${category} Services — KALKI OS`,
    description: `${count} AI-powered ${category.toLowerCase()} services by KALKI Intelligence, serving businesses across India from Indore.`,
    url: `${SITE}/marketplace/${encodeURIComponent(category)}`,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: count,
      itemListElement: services.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        url: `${SITE}/marketplace/${encodeURIComponent(category)}/${encodeURIComponent(s.slug)}`,
        name: s.name,
        image: abs(getServiceImageUrl(s)),
      })),
    },
  };

  const crumbs = breadcrumbSchema([
    { name: 'Home', url: `${SITE}/` },
    { name: 'Marketplace', url: `${SITE}/marketplace` },
    { name: category, url: `${SITE}/marketplace/${encodeURIComponent(category)}` },
  ]);

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-white/60 mb-4 flex items-center gap-2">
          <Link href="/" className="hover:text-cyan-300 transition">Home</Link>
          <span>/</span>
          <Link href="/marketplace" className="hover:text-cyan-300 transition">Marketplace</Link>
          <span>/</span>
          <span className="text-cyan-300">{category}</span>
        </nav>

        {/* Hero */}
        <header className="relative overflow-hidden rounded-2xl border border-cyan-500/10 mb-8">
          <div className="absolute inset-0">
            <Image src={heroImage} alt={`${category} services by KALKI OS`} width={1200} height={480} priority className="w-full h-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          </div>
          <div className="relative z-10 px-6 py-10 md:px-10 md:py-14 max-w-2xl">
            <div className="mb-3">
              <AnimatedEyebrow label={`${count} ${count === 1 ? 'service' : 'services'}`} icon={<Sparkles className="w-3.5 h-3.5" />} />
            </div>
            <AnimatedHeadline
              as="h1"
              text={`${category} Services in India`}
              className="text-2xl md:text-4xl font-bold text-white leading-tight"
              stagger={0.04}
            />
            <p className="text-white/75 mt-3 text-sm md:text-base leading-relaxed">
              AI-powered {category.toLowerCase()} delivered by KALKI Intelligence for businesses across India.
              Written scope, fixed price and a delivery date — quoted within 24 hours, nothing to pay to start.
            </p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link href="/request" className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 rounded-xl text-white font-semibold text-sm transition shadow-lg shadow-cyan-500/25">
                Request a free quote <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/chat" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-cyan-200 font-medium text-sm transition">
                Ask Siddhi AI
              </Link>
            </div>
          </div>
        </header>

        {/* Service grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {services.map((s, idx) => (
            <div
              key={s.id}
              className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${Math.min(idx, 11) * 45}ms`, animationFillMode: 'backwards' }}
            >
              <ServiceCard
                service={{
                  id: s.id,
                  name: s.name,
                  slug: s.slug,
                  category: s.category,
                  description: s.description,
                  price: s.price,
                  rating: s.rating,
                  review_count: s.review_count,
                  image_url: s.image_url,
                  target_industries: s.target_industries ?? [],
                  long_description: s.long_description ?? null,
                } as never}
              />
            </div>
          ))}
        </div>

        {/* Cross-category internal links */}
        {otherCategories.length > 0 && (
          <section className="mt-12">
            <AnimatedHeadline as="h2" text="Explore other categories" className="text-white font-semibold text-lg mb-4" inView />
            <div className="flex flex-wrap gap-2">
              {otherCategories.map((c) => (
                <Link
                  key={c}
                  href={`/marketplace/${encodeURIComponent(c)}`}
                  className="px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-cyan-500/10 hover:border-cyan-500/30 text-sm text-white/70 hover:text-cyan-300 transition"
                >
                  {c} Services
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      <SiteFooter />
    </>
  );
}
