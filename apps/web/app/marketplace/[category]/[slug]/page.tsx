import { fetchServiceBySlug, getSupabaseStatus, checkSupabaseConnection } from '@/lib/services'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { Star, ShoppingCart, Heart, Share2, CheckCircle, Clock, Award, Users, TrendingUp, ChevronRight } from 'lucide-react'
import AddToCartButton from '@/components/AddToCartButton'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row'] & {
  target_industries?: string[]
  long_description?: string | null
}

type PageProps = { params: Promise<{ category: string; slug: string }> }

export async function generateStaticParams() {
  // We'll rely on dynamic routes; no static generation needed to avoid errors.
  return []
}

async function getService(category: string, slug: string): Promise<Service | null> {
  return fetchServiceBySlug(category, slug)
}

export default async function ServiceDetailPage({ params }: PageProps) {
  const { category, slug } = await params
  const decodedCategory = decodeURIComponent(category)
  const decodedSlug = decodeURIComponent(slug)

  const service = await getService(decodedCategory, decodedSlug)
  if (!service) notFound()

  const online = await checkSupabaseConnection()
  const features = Array.isArray(service.features) ? service.features : []
  const industries = service.target_industries || []

  // Prepare service object for AddToCartButton
  const cartService = {
    id: service.id,
    name: service.name,
    price: service.price ?? 0,
    category: service.category,
    slug: service.slug,
    icon: service.icon,
    image_url: service.image_url,
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-white/40 mb-6">
        <Link href="/" className="hover:text-white transition">Home</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/marketplace" className="hover:text-white transition">Marketplace</Link>
        <ChevronRight className="w-4 h-4" />
        <Link href={`/marketplace?category=${encodeURIComponent(service.category)}`} className="hover:text-white transition">{service.category}</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white/80">{service.name}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Image / Icon */}
        <div className="aspect-square bg-gradient-to-br from-cyan-900/20 to-purple-900/20 rounded-2xl flex items-center justify-center relative border border-cyan-500/10">
          {service.image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={service.image_url}
              alt={service.name}
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <span className="text-8xl opacity-40">{service.icon || '📦'}</span>
          )}
          <div className="absolute top-4 right-4 flex gap-2">
            <button className="p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-white/10 transition">
              <Heart className="w-5 h-5 text-white/60" />
            </button>
            <button className="p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-white/10 transition">
              <Share2 className="w-5 h-5 text-white/60" />
            </button>
          </div>
          {service.rating && (
            <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-white text-sm font-medium">{service.rating}</span>
              <span className="text-white/40 text-xs">({service.review_count || 0} reviews)</span>
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-cyan-400/60 uppercase tracking-wider">{service.category}</span>
            <span className="text-white/20">•</span>
            <span className="text-xs text-green-400">In Stock</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{service.name}</h1>
          <div className="flex flex-wrap gap-2">
            {industries.map((ind: string) => (
              <span key={ind} className="text-[10px] bg-cyan-600/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/10">
                {ind}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-white font-medium">{service.rating || '4.5'}</span>
              <span className="text-white/40 text-sm">({service.review_count || 0} reviews)</span>
            </div>
            <div className="text-white/20">|</div>
            <div className="flex items-center gap-1 text-sm text-white/40">
              <Users className="w-4 h-4" />400+ bought
            </div>
          </div>
          <div className="flex items-end gap-3">
            <span className="text-3xl font-bold text-white">₹{(service.price ?? 0).toLocaleString()}</span>
            <span className="text-white/40 text-sm line-through">₹{Math.round((service.price ?? 0) * 1.35).toLocaleString()}</span>
            <span className="text-green-400 text-sm font-medium">35% off</span>
          </div>
          <p className="text-white/60 text-sm">{service.long_description || service.description}</p>

          {features.length > 0 && (
            <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 space-y-2">
              <h3 className="text-white font-medium text-sm">Key Features</h3>
              <ul className="space-y-1.5">
                {features.map((f: any, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    {String(f)}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {/* Buy Now – adds to cart and redirects to checkout */}
            <Link href={`/checkout?service=${service.id}`} className="flex-1">
              <LuxuryButton variant="primary" size="lg" label="Buy Now" icon={<ShoppingCart className="w-4 h-4" />} fullWidth />
            </Link>
            {/* Add to Cart – silenty adds via client component */}
            <div className="flex-1">
              <AddToCartButton service={cartService} />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2 text-xs text-white/40">
            <span className="flex items-center gap-1"><Award className="w-4 h-4 text-cyan-400" /> Trusted service</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-cyan-400" /> 30-60 day delivery</span>
            <span className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-cyan-400" /> AI-powered</span>
          </div>
        </div>
      </div>

      {/* FAQ section */}
      <div className="mt-12 bg-white/5 border border-cyan-500/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <details className="border-b border-white/5 pb-3">
            <summary className="text-white font-medium cursor-pointer hover:text-cyan-400 transition">How long does delivery take?</summary>
            <p className="text-white/60 mt-2 text-sm">Typical delivery is 30-60 days depending on project complexity. We provide regular updates via your client dashboard.</p>
          </details>
          <details className="border-b border-white/5 pb-3">
            <summary className="text-white font-medium cursor-pointer hover:text-cyan-400 transition">What happens after I purchase?</summary>
            <p className="text-white/60 mt-2 text-sm">You will be redirected to your client panel where you can track the project timeline, chat with your project manager, and view milestones.</p>
          </details>
          <details>
            <summary className="text-white font-medium cursor-pointer hover:text-cyan-400 transition">Can I customize this service?</summary>
            <p className="text-white/60 mt-2 text-sm">Absolutely! Contact our sales team for custom quotes and tailored solutions.</p>
          </details>
        </div>
      </div>
    </div>
  )
}
