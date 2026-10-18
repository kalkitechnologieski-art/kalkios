// == KALKI B4 EXPERIENCE ==
import { fetchServiceBySlug } from '@/lib/services';
import { getServiceImageUrl } from '@/lib/services/service-image';
import { createPublicClient } from '@/lib/supabase/public-client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { Star, CheckCircle, Clock, Award, Users, ChevronRight, ArrowRight, FileText } from 'lucide-react';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ProductReviewsMount } from './ProductReviewsMount';
import { ProductSchema } from './ProductSchema';
import { SiteFooter } from '@/components/layout/SiteFooter';
import type { Database } from '@/lib/supabase/types';

type Service = Database['public']['Tables']['services']['Row'] & {
  target_industries?: string[];
  long_description?: string | null;
  aeo_summary?: string | null;
};

type PageProps = { params: Promise<{ category: string; slug: string }> };

export const revalidate = 3600;

async function getService(category: string, slug: string): Promise<Service | null> {
  try {
    const svc = await fetchServiceBySlug(category, slug);
    return svc as Service | null;
  } catch {
    return null;
  }
}

interface Related {
  id: string; name: string; slug: string; category: string; price: number | null; image_url: string | null;
}

async function getRelatedServices(category: string, excludeId: string): Promise<Related[]> {
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('services')
      // @ts-ignore - runtime table
      .select('id, name, slug, category, price, image_url')
      .eq('category', category as any)
      .eq('is_active', true as any)
      .neq('id', excludeId as any)
      .limit(4);
    return (data ?? []) as Related[];
  } catch {
    return [];
  }
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { category, slug } = await params;
  const decodedCategory = decodeURIComponent(category);
  const decodedSlug = decodeURIComponent(slug);

  const service = await getService(decodedCategory, decodedSlug);
  if (!service) notFound();

  const features = Array.isArray(service.features)
    ? (service.features as unknown[]).filter((f): f is string => typeof f === 'string')
    : [];
  const industries = service.target_industries ?? [];

  const aeoSummary = service.aeo_summary ?? service.description ?? '';

  const related = await getRelatedServices(decodedCategory, service.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ProductSchema service={service} />

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/marketplace" className="hover:text-white transition">Marketplace</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/marketplace/${encodeURIComponent(service.category)}`} className="hover:text-white transition">
          {service.category}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white/80">{service.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hero */}
        <div className="aspect-square bg-gradient-to-br from-cyan-900/20 to-purple-900/20 rounded-2xl flex items-center justify-center relative border border-cyan-500/10 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={getServiceImageUrl(service)} alt={service.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
          {service.rating ? (
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-white text-sm font-medium">{service.rating}</span>
              <span className="text-white/40 text-xs">({service.review_count || 0})</span>
            </div>
          ) : null}
        </div>

        {/* Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-cyan-400/60 uppercase tracking-wider">{service.category}</span>
            <span className="text-white/20">•</span>
            <span className="text-xs text-green-400">In stock</span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{service.name}</h1>

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
            <p className="text-white/70 text-sm leading-relaxed border-l-2 border-cyan-500/30 pl-3">
              {aeoSummary}
            </p>
          )}

          <div className="space-y-1">
            <div className="flex items-end gap-3">
              <span className="text-sm text-white/40">Starting from</span>
              <span className="text-3xl font-bold text-white">
                ₹{(service.price ?? 0).toLocaleString('en-IN')}
              </span>
              {service.duration_days ? (
                <span className="text-white/40 text-sm">· {service.duration_days} day delivery</span>
              ) : null}
            </div>
            <p className="text-xs text-white/30">No payment now — a tailored quote is shared after your brief.</p>
          </div>

          {features.length > 0 && (
            <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 space-y-2">
              <h3 className="text-white font-medium text-sm">What you get</h3>
              <ul className="space-y-1.5">
                {features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
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
            <Link href="/chat" className="text-center text-sm text-cyan-400/70 hover:text-cyan-300 transition flex items-center justify-center gap-1">
              Not sure? Ask Siddhi AI first <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 pt-2 text-xs text-white/40">
            <span className="flex items-center gap-1"><Award className="w-4 h-4 text-cyan-400" /> Trusted service</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-cyan-400" /> Fast delivery</span>
            <span className="flex items-center gap-1"><Users className="w-4 h-4 text-cyan-400" /> 500+ clients</span>
          </div>
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold text-white mb-4">Customer reviews</h2>
        <ProductReviewsMount serviceId={service.id} />
      </section>

      {/* FAQ */}
      <div className="mt-12 bg-white/5 border border-cyan-500/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Frequently asked</h2>
        <div className="space-y-4">
          <details className="border-b border-white/5 pb-3">
            <summary className="text-white font-medium cursor-pointer hover:text-cyan-400 transition">
              How long does delivery take?
            </summary>
            <p className="text-white/60 mt-2 text-sm">
              Typically {service.duration_days ?? 30} days depending on complexity.
            </p>
          </details>
          <details className="border-b border-white/5 pb-3">
            <summary className="text-white font-medium cursor-pointer hover:text-cyan-400 transition">
              What happens after I request?
            </summary>
            <p className="text-white/60 mt-2 text-sm">
              No payment is taken now. We review your brief, share a tailored quote, and once approved your project appears live on your client dashboard for real-time tracking.
            </p>
          </details>
          <details>
            <summary className="text-white font-medium cursor-pointer hover:text-cyan-400 transition">
              Can I customise this?
            </summary>
            <p className="text-white/60 mt-2 text-sm">
              Absolutely. Reach out via support and we can tailor the service.
            </p>
          </details>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">More {service.category} services</h2>
            <Link href={`/marketplace/${encodeURIComponent(service.category)}`} className="text-sm text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/marketplace/${encodeURIComponent(r.category)}/${encodeURIComponent(r.slug)}`}
                className="group bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 rounded-xl overflow-hidden transition hover:bg-white/10"
              >
                <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-cyan-900/20 to-purple-900/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={getServiceImageUrl(r)} alt={`${r.name} — ${r.category} service by KALKI OS`} loading="lazy" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
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
