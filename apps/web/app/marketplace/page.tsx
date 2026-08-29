'use client'

import { useState, useEffect } from 'react'
import { fetchServices, checkSupabaseConnection } from '@/lib/services'
import Link from 'next/link'
import { Search, Filter, Star, ShoppingBag, Sparkles, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row'] & {
  target_industries?: string[]
  long_description?: string | null
}

const CATEGORIES = [
  'All', 'Web Development', 'App Development', 'Marketing',
  'Design', 'Media', 'AI Automation', 'AI Chatbots', 'Development'
]

export default function MarketplacePage() {
  const [services, setServices] = useState<Service[]>([])
  const [filtered, setFiltered] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')
  const [online, setOnline] = useState<boolean>(true)

  useEffect(() => {
    const loadServices = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchServices()
        setServices(data)
        setFiltered(data)
        const status = await checkSupabaseConnection()
        setOnline(status)
      } catch (err) {
        setError(String(err))
      } finally {
        setLoading(false)
      }
    }
    loadServices()
  }, [])

  useEffect(() => {
    let result = services
    if (category !== 'All') {
      result = result.filter(s => s.category === category)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.description?.toLowerCase() || '').includes(q)
      )
    }
    setFiltered(result)
  }, [category, search, services])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-red-400 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="font-bold">Error loading services</h3>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-cyan-400" />
            Marketplace
          </h1>
          <span className="text-sm text-cyan-400/40 font-mono">{filtered.length} services</span>
          {online ? (
            <span className="flex items-center gap-1 text-xs text-green-400 border border-green-500/20 px-2 py-1 rounded-full">
              <Wifi className="w-3 h-3" /> Live
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-yellow-400 border border-yellow-500/20 px-2 py-1 rounded-full">
              <WifiOff className="w-3 h-3" /> Offline (Mock)
            </span>
          )}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full bg-white/5 border border-cyan-500/10 rounded-xl pl-10 pr-4 py-2 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {CATEGORIES.map(c => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`px-3 py-1.5 rounded-full text-sm font-mono transition ${
              category === c
                ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/30'
                : 'bg-white/5 text-white/50 hover:text-white hover:bg-white/10'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No services match your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(service => (
            <Link
              key={service.id}
              href={`/marketplace/${encodeURIComponent(service.category)}/${encodeURIComponent(service.slug)}`}
              className="group bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 rounded-xl overflow-hidden transition hover:bg-white/10 flex flex-col"
            >
              <div className="aspect-square bg-gradient-to-br from-cyan-900/20 to-purple-900/20 flex items-center justify-center relative overflow-hidden">
                {service.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition"
                  />
                ) : (
                  <span className="text-6xl opacity-30">{service.icon || '📦'}</span>
                )}
                {service.price && (
                  <span className="absolute top-3 left-3 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                    {service.price < 1000 ? 'Starter' : service.price < 100000 ? 'Pro' : 'Enterprise'}
                  </span>
                )}
                {service.rating && (
                  <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white/90 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {service.rating}
                  </span>
                )}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-xs text-cyan-400/60 uppercase tracking-wider">{service.category}</p>
                <h3 className="text-white font-medium text-sm mt-1 line-clamp-2 group-hover:text-cyan-300 transition">
                  {service.name}
                </h3>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(service.target_industries || []).slice(0, 2).map((ind: string) => (
                    <span key={ind} className="text-[8px] bg-cyan-600/20 text-cyan-400 px-1.5 py-0.5 rounded-full">{ind}</span>
                  ))}
                  {(service.target_industries || []).length > 2 && <span className="text-[8px] text-cyan-400/30">+{(service.target_industries || []).length-2}</span>}
                </div>
                <p className="text-cyan-400/40 text-xs mt-1 line-clamp-2 flex-1">{service.description}</p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-cyan-500/10">
                  <span className="text-white font-bold">₹{(service.price ?? 0).toLocaleString()}</span>
                  <span className="text-xs text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">View</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
