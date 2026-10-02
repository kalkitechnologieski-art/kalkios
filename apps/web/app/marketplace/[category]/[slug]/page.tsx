// == KALKI B4 EXPERIENCE ==
import { fetchServiceBySlug } from '@/lib/services';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { Star, ShoppingCart, CheckCircle, Clock, Award, Users, ChevronRight } from 'lucide-react';
import AddToCartButton from '@/components/AddToCartButton';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ProductReviewsMount } from './ProductReviewsMount';
import { ProductSchema } from './ProductSchema';
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

  const cartService = {
    id: service.id,
    name: service.name,
    price: service.price ?? 0,
    category: service.category,
    slug: service.slug,
    icon: service.icon,
    image_url: service.image_url,
  };

  const aeoSummary = service.aeo_summary ?? service.description ?? '';

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <ProductSchema service={service} />

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/marketplace" className="hover:text-white transition">Marketplace</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/marketplace?category=${encodeURIComponent(service.category)}`} className="hover:text-white transition">
          {service.category}
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white/80">{service.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Hero */}
        <div className="aspect-square bg-gradient-to-br from-cyan-900/20 to-purple-900/20 rounded-2xl flex items-center justify-center relative border border-cyan-500/10">
          {service.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={service.image_url} alt={service.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <span className="text-8xl opacity-40">{service.icon || '📦'}</span>
          )}
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

          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white">
              ₹{(service.price ?? 0).toLocaleString('en-IN')}
            </span>
            {service.duration_days ? (
              <span className="text-white/40 text-sm">· {service.duration_days} day delivery</span>
            ) : null}
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

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href={`/checkout?service=${service.id}`} className="flex-1">
              <LuxuryButton
                variant="cyber"
                size="lg"
                label="Buy Now"
                icon={<ShoppingCart className="w-4 h-4" />}
                fullWidth
              />
            </Link>
            <div className="flex-1">
              <AddToCartButton service={cartService} />
            </div>
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
              What happens after I buy?
            </summary>
            <p className="text-white/60 mt-2 text-sm">
              You will see your project on your client dashboard immediately and can track progress in real time.
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
    </div>
  );
}
