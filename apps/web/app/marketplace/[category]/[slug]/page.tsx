// == KALKI B4 EXPERIENCE ==
import type { Metadata } from 'next';
import { fetchServiceBySlug, fetchServices, fetchServicesByCategory } from '@/lib/services';
import { categoryHref, categorySlug, decodeSegment, normKey, serviceHref } from '@/lib/services/href';
import { getServiceImageUrl } from '@/lib/services/service-image';
import { buildServiceMetadata } from '@/lib/seo/enhanced-metadata';
import { serviceMeta } from '@/lib/seo/service-meta';
import { buildServicePageContent } from '@/lib/services/service-details';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { CheckCircle, Clock, Award, Users, ChevronRight, ArrowRight, FileText } from 'lucide-react';
import { ProductReviewsMount } from './ProductReviewsMount';
import { ProductSchema } from './ProductSchema';
import { ServiceDepth } from '@/components/services/ServiceDepth';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { fetchTestimonials } from '@/lib/testimonials';
import { Testimonials } from '@/components/trust/Testimonials';
import { AnimatedHeadline } from '@/components/motion/AnimatedHeadline';
import { AnimatedEyebrow } from '@/components/motion/AnimatedEyebrow';
import { AnimatedNumber } from '@/components/motion/AnimatedNumber';
import type { Database } from '@/lib/supabase/types';

type Service = Database['public']['Tables']['services']['Row'] & {
  target_industries?: string[];
  long_description?: string | null;
  aeo_summary?: string | null;
};

type PageProps = { params: Promise<{ category: string; slug: string }> };

// public.services row enterprise-seo supplies the lead, price, and schema
// description. These strings replace that copy on this page only.
const ENTERPRISE_SEO_SLUG = 'enterprise-seo';
const ENTERPRISE_SEO_LEAD =
  'Enterprise SEO support covering competitor analysis, on-page SEO, link building and monthly reporting. Your written quote confirms the fixed scope and price before any work begins.';
const ENTERPRISE_SEO_ADVANCE =
  '₹0 advance — no payment is needed to share your brief. This does not mean the work is free; listed prices are starting figures pending a written quote.';
const ENTERPRISE_SEO_META =
  'Enterprise SEO from KALKI Intelligence: competitor analysis, on-page SEO, link building and monthly reporting. Starting from ₹49,999, written quote.';

function isEnterpriseSeo(slug: string): boolean {
  return slug === ENTERPRISE_SEO_SLUG;
}

export const revalidate = 3600;

// Prerender every catalog page at build so a product click resolves instantly
// instead of waiting on a cold, chained database lookup.
export async function generateStaticParams() {
  const services = await fetchServices();
  const seen = new Set<string>();
  const params: { category: string; slug: string }[] = [];
  for (const s of services) {
    const category = String(s.category ?? '').trim();
    const slug = String(s.slug ?? '').trim();
    if (!category || !slug) continue;
    const key = `${normKey(category)}/${normKey(slug)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    params.push({ category: categorySlug(category), slug });
  }
  return params;
}

async function getService(category: string, slug: string): Promise<Service | null> {
  return (await fetchServiceBySlug(category, slug)) as Service | null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const routeParams = await params;
  const service = await getService(
    decodeSegment(routeParams.category),
    decodeSegment(routeParams.slug),
  );
  if (!service) return {};
  const override = serviceMeta(service.slug);
  const price = isEnterpriseSeo(service.slug) ? 49999 : service.price ?? 0;
  const description = override?.description
    || (isEnterpriseSeo(service.slug) ? ENTERPRISE_SEO_META : null)
    || service.meta_description
    || service.aeo_summary
    || service.description
    || `${service.name} from KALKI Intelligence. Written scope, fixed price, ₹0 advance.`;
  return buildServiceMetadata({
    name: service.name,
    title: override?.title || service.meta_title || service.name,
    description,
    slug: service.slug,
    category: service.category,
    price,
  });
}

interface Related {
  id: string; name: string; slug: string; category: string; price: number | null; image_url: string | null;
}

async function getRelatedServices(category: string, excludeId: string): Promise<Related[]> {
  const rows = await fetchServicesByCategory(category);
  return rows
    .filter((r) => r.id !== excludeId)
    .slice(0, 4) as unknown as Related[];
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const routeParams = await params;
  const category = decodeSegment(routeParams.category);
  const slug = decodeSegment(routeParams.slug);

  const [service, testimonials] = await Promise.all([
    getService(category, slug),
    fetchTestimonials(4),
  ]);
  if (!service) notFound();

  const enterprise = isEnterpriseSeo(service.slug);
  const features = (Array.isArray(service.features)
    ? (service.features as unknown[]).filter((f): f is string => typeof f === 'string')
    : []
  ).filter((f) => !enterprise || !/rank #1|proven strategy/i.test(f));
  const industries = service.target_industries ?? [];
  const shown: Service = enterprise
    ? {
        ...service,
        aeo_summary: ENTERPRISE_SEO_LEAD,
        description: ENTERPRISE_SEO_LEAD,
        price: 49999,
        features: features as Service['features'],
      }
    : service;

  const aeoSummary = enterprise
    ? ENTERPRISE_SEO_LEAD
    : service.aeo_summary ?? service.description ?? '';

  const related = await getRelatedServices(service.category, service.id);
  const content = buildServicePageContent({
    name: shown.name,
    slug: shown.slug,
    category: shown.category,
    description: shown.description,
    price: shown.price,
    duration_days: shown.duration_days,
    features: shown.features,
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ProductSchema service={shown} faqs={content.faqs} process={content.process} />

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/marketplace" className="hover:text-white transition">Marketplace</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={categoryHref(service.category)} className="hover:text-white transition">
          {service.category}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white/80">{service.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hero */}
        <div className="aspect-square bg-gradient-to-br from-cyan-900/20 to-purple-900/20 rounded-2xl flex items-center justify-center relative border border-cyan-500/10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getServiceImageUrl(service)} alt={service.name} loading="eager" decoding="async" fetchPriority="high" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          {service.duration_days ? (
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Clock className="w-4 h-4 text-cyan-300" />
              <span className="text-white text-sm font-medium">Delivered in {service.duration_days} days</span>
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <AnimatedEyebrow label={service.category} />
            <span className="text-xs text-green-400/90">Taking new projects</span>
          </div>

          <AnimatedHeadline
            as="h1"
            text={service.name}
            className="text-3xl md:text-4xl font-bold text-white leading-tight"
            delay={0.05}
          />

          {industries.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {industries.map((ind: string) => (
                <span key={ind} className="text-[10px] bg-cyan-600/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/10">
                  {ind}
                </span>
              ))}
            </div>
          )}

          {aeoSummary && (
            <p className="text-white/75 text-sm leading-relaxed border-l-2 border-cyan-500/30 pl-3">
              {aeoSummary}
            </p>
          )}

          <div className="space-y-1">
            <div className="flex items-end gap-3">
              <span className="text-sm text-white/55">Starting from</span>
              <span className="text-3xl font-bold text-white tabular-nums">
                {enterprise ? (
                  '₹49,999'
                ) : (
                  <AnimatedNumber to={service.price ?? 0} prefix="₹" />
                )}
              </span>
              {service.duration_days ? (
                <span className="text-white/55 text-sm">· {service.duration_days} day delivery</span>
              ) : null}
            </div>
            <p className="text-xs text-white/50">
              {enterprise
                ? ENTERPRISE_SEO_ADVANCE
                : 'No payment now — a tailored quote is shared after your brief.'}
            </p>
          </div>

          {features.length > 0 && (
            <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 space-y-2">
              <h3 className="text-white font-medium text-sm">What you get</h3>
              <ul className="space-y-1.5">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/75">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Link href={`/request?service=${service.id}`} className="flex-1">
              <LuxuryButton
                variant="cyber"
                size="lg"
                label="Request this service"
                icon={<FileText className="w-4 h-4" />}
                fullWidth
              />
            </Link>
            <Link href="/chat" className="text-center text-sm text-cyan-400/85 hover:text-cyan-300 transition flex items-center justify-center gap-1">
              Not sure? Ask Siddhi AI first <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 pt-2 text-xs text-white/60">
            <span className="flex items-center gap-1"><Award className="w-4 h-4 text-cyan-400" /> Fixed-scope quote</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-cyan-400" /> Reply within 24 hours</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4 text-cyan-400" /> ₹0 to start</span>
          </div>
        </div>
      </div>

      <ServiceDepth content={content} />

      {/* Reviews + proof */}
      <section className="mt-12">
        <div className="mb-4">
          <AnimatedEyebrow label="Trust & proof" />
        </div>
        <AnimatedHeadline as="h2" text="Customer reviews" className="text-2xl font-bold text-white mb-4" inView />
        <ProductReviewsMount serviceId={service.id} />
        <div className="mt-6">
          <Testimonials items={testimonials} compact />
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <AnimatedHeadline as="h2" text={`More ${service.category} services`} className="text-2xl font-bold text-white" inView />
            <Link href={categoryHref(service.category)} className="text-sm text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                href={serviceHref(r)}
                className="group bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 rounded-xl overflow-hidden transition hover:bg-white/10"
              >
                <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-cyan-900/20 to-purple-900/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getServiceImageUrl(r)} alt={`${r.name} — ${r.category} service by KALKI Intelligence`} loading="lazy" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
                </div>
                <div className="p-3">
                  <h3 className="text-white text-sm font-medium line-clamp-1 group-hover:text-cyan-300 transition">{r.name}</h3>
                  <p className="text-white font-bold text-sm mt-1">₹{(r.price ?? 0).toLocaleString('en-IN')}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
