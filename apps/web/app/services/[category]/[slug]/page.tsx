import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ServiceSchema } from '@/components/ServiceSchema'
import { ServiceFAQ } from '@/components/ServiceFAQ'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { logger } from '@/lib/utils/logger'
import Image from 'next/image'
import Link from 'next/link'
import { Star, ShoppingCart, Heart, Share2, CheckCircle, Clock, Award, Users, TrendingUp, ChevronRight } from 'lucide-react'
import { AddToCartButton } from '@/components/AddToCartButton'

type PageProps = { params: Promise<{ category: string; slug: string }> }


export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params
  const supabase = await createClient()
  const { data: service } = await supabase.from('services').select('*').eq('slug', slug).eq('category', category).single()
  if (!service) return { title: 'Service Not Found' }
  const s = service as any
  return {
    title: `${s.name} — KALKI OS`,
    description: s.meta_description || s.description,
    alternates: { canonical: `https://kalkios.com/services/${category}/${slug}` },
    openGraph: { title: s.name, description: s.description || undefined, images: [{ url: s.image_url || '/og-image.jpg' }] }
  }
}

export default async function ServicePage({ params }: PageProps) {
  const { category, slug } = await params
  const supabase = await createClient()
  const { data: service, error } = await supabase.from('services').select('*').eq('slug', slug).eq('category', category).single()
  if (error || !service) { logger.error('Service not found', error); notFound() }

  const s = service as any
  const { data: related } = await supabase
    .from('services')
    .select('id, name, slug, category, image_url, price, rating')
    .eq('category', category)
    .neq('id', s.id)
    .limit(4)

  const features = Array.isArray(s.features) ? (s.features as string[]) : []

  return (
    <>
      <ServiceSchema service={s} />
      <Breadcrumbs items={[{ label: 'Services', href: '/services' }, { label: category, href: `/services/${category}` }, { label: s.name, href: '#' }]} />
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="aspect-square bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl overflow-hidden border border-white/5 flex items-center justify-center relative">
              {s.image_url ? <Image src={s.image_url} alt={s.name} width={600} height={600} className="object-cover w-full h-full" /> : <span className="text-8xl opacity-30">{s.icon || '📦'}</span>}
              <button className="absolute top-4 right-4 p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-white/10 transition"><Heart className="w-5 h-5 text-white/60" /></button>
              <button className="absolute top-4 right-16 p-2 bg-black/60 backdrop-blur-sm rounded-full hover:bg-white/10 transition"><Share2 className="w-5 h-5 text-white/60" /></button>
              {s.rating && <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur-sm px-3 py-1.5 rounded-full"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="text-white text-sm font-medium">{s.rating}</span><span className="text-white/40 text-xs">({s.review_count || 0} reviews)</span></div>}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2">{[...Array(4)].map((_, i) => <div key={i} className="w-20 h-20 flex-shrink-0 bg-white/5 rounded-lg border border-white/5 flex items-center justify-center text-2xl opacity-50">{s.icon || '📦'}</div>)}</div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2"><span className="text-xs text-white/40 uppercase tracking-wider">{s.category}</span><span className="text-white/20">•</span><span className="text-xs text-green-400">In Stock</span></div>
            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{s.name}</h1>
            <div className="flex items-center gap-4"><div className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /><span className="text-white font-medium">{s.rating || '4.5'}</span><span className="text-white/40 text-sm">({s.review_count || 0} reviews)</span></div><div className="text-white/20">|</div><div className="flex items-center gap-1 text-sm text-white/40"><Users className="w-4 h-4" />400+ bought</div></div>
            <div className="flex items-end gap-3"><span className="text-3xl font-bold text-white">₹{s.price?.toLocaleString()}</span><span className="text-white/40 text-sm line-through">₹{(s.price ? Math.round(s.price * 1.35) : 0).toLocaleString()}</span><span className="text-green-400 text-sm font-medium">35% off</span></div>
            <p className="text-xs text-white/30">Inclusive of all taxes • Free delivery</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2"><h3 className="text-white font-medium text-sm">About this service</h3>{features.length > 0 ? <ul className="space-y-1.5">{features.map((f: string, i: number) => <li key={i} className="flex items-start gap-2 text-sm text-white/70"><CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />{f}</li>)}</ul> : <p className="text-sm text-white/40">{s.description}</p>}</div>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href={`/checkout?service=${s.id}`} className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 rounded-xl text-white font-medium transition shadow-lg shadow-purple-500/25">
                <ShoppingCart className="w-5 h-5" />Buy Now
              </Link>
              <AddToCartButton service={{ id: s.id, name: s.name, price: s.price, category: s.category, slug: s.slug, icon: s.icon, image_url: s.image_url }} />
              <button className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 font-medium transition border border-white/5"><Heart className="w-5 h-5" />Wishlist</button>
            </div>
            <div className="flex flex-wrap gap-4 pt-2 text-xs text-white/40"><span className="flex items-center gap-1"><Award className="w-4 h-4 text-purple-400" /> Trusted service</span><span className="flex items-center gap-1"><Clock className="w-4 h-4 text-purple-400" /> 30-60 day delivery</span><span className="flex items-center gap-1"><TrendingUp className="w-4 h-4 text-purple-400" /> AI-powered</span></div>
          </div>
        </div>
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6"><h2 className="text-xl font-bold text-white mb-4">Service Description</h2><p className="text-white/70 leading-relaxed">{s.description || 'No description available.'}</p></div>
            <ServiceFAQ serviceId={s.id} />
          </div>
          <div className="space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4"><h4 className="text-white font-medium text-sm mb-3">Service Details</h4><dl className="space-y-2 text-sm"><div className="flex justify-between"><dt className="text-white/40">Category</dt><dd className="text-white/70">{s.category}</dd></div><div className="flex justify-between"><dt className="text-white/40">Duration</dt><dd className="text-white/70">{s.duration_days || '30'} days</dd></div><div className="flex justify-between"><dt className="text-white/40">Price</dt><dd className="text-white/70 font-medium">₹{s.price?.toLocaleString()}</dd></div><div className="flex justify-between"><dt className="text-white/40">Status</dt><dd className="text-green-400">Available</dd></div></dl></div>
            {related && related.length > 0 && <div className="bg-white/5 border border-white/10 rounded-xl p-4"><h4 className="text-white font-medium text-sm mb-3">Related Services</h4><div className="space-y-2">{(related as any[]).map((r: any) => <Link key={r.id} href={`/services/${r.category}/${r.slug}`} className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition group"><div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">📦</div><div className="flex-1 min-w-0"><p className="text-white text-sm truncate group-hover:text-purple-400 transition">{r.name}</p><p className="text-white/40 text-xs">₹{r.price?.toLocaleString()}</p></div><ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 transition" /></Link>)}</div></div>}
          </div>
        </div>
      </div>
    </>
  )
}
