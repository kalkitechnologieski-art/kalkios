import { Suspense } from 'react'
import { createPublicClient } from '@/lib/supabase/public-client'
import MarketplaceFilters from './MarketplaceFilters'
import { ShoppingBag, Award, TrendingUp, Clock, Star } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

async function getServices(): Promise<Service[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }
  return data || []
}

function LoadingServices() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-80 bg-white/5 rounded-xl animate-pulse" />
      ))}
    </div>
  )
}

export default async function MarketplacePage() {
  const services = await getServices()

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-cyan-400" />
            Marketplace
          </h1>
          <p className="text-cyan-400/40 text-sm font-mono">
            {services.length} premium services available
          </p>
        </div>
        <Suspense fallback={<div className="w-full md:w-80 h-12 bg-white/5 rounded-xl animate-pulse" />}>
          <MarketplaceFilters />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length === 0 ? (
          <LoadingServices />
        ) : (
          services.map((service: Service) => (
            <Link
              key={service.id}
              href={`/services/${service.category}/${service.slug}`}
              className="group bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 rounded-xl overflow-hidden transition hover:bg-white/10"
            >
              <div className="aspect-video bg-gradient-to-br from-cyan-900/20 to-purple-900/20 flex items-center justify-center relative">
                <span className="text-6xl opacity-30">{service.icon || '📦'}</span>
                {service.price && (
                  <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    {Math.floor(Math.random() * 35) + 15}% off
                  </span>
                )}
                {service.rating && (
                  <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white/90 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {service.rating}
                    <span className="text-white/40 ml-1">({service.review_count || 0})</span>
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="text-xs text-cyan-400/60 uppercase tracking-wider">{service.category}</p>
                <h3 className="text-white font-medium text-sm mt-1 line-clamp-2 group-hover:text-cyan-300 transition">
                  {service.name}
                </h3>
                <p className="text-cyan-400/40 text-xs mt-1 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-white font-bold">₹{service.price?.toLocaleString()}</span>
                  <span className="text-xs text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">In Stock</span>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-cyan-400/30">
                  <Clock className="w-3 h-3" />
                  <span>30-60 days</span>
                  <Award className="w-3 h-3 ml-2" />
                  <span>Verified</span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <div className="mt-12 pt-8 border-t border-cyan-500/10 flex flex-wrap justify-center gap-8 text-sm text-cyan-400/30">
        <span className="flex items-center gap-2"><Award className="w-4 h-4 text-cyan-400" /> Curated by experts</span>
        <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400" /> 30-60 day delivery</span>
        <span className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-400" /> 500+ satisfied clients</span>
      </div>
    </div>
  )
}
