'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, Clock, ShoppingBag, Sparkles, Wifi, WifiOff } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'
import { getServiceImageUrl } from '@/lib/services/service-image'
import { serviceHref } from '@/lib/services/href'
import { AnimatedHeadline } from '@/components/motion/AnimatedHeadline'
import { AnimatedEyebrow } from '@/components/motion/AnimatedEyebrow'

type Service = Database['public']['Tables']['services']['Row'] & {
  target_industries?: string[]
  long_description?: string | null
}

interface Props {
  services: Service[]
  online: boolean
}

export function MarketplaceBrowser({ services, online }: Props) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  const categories = useMemo(() => {
    const set = new Set(services.map((s) => String(s.category).trim()).filter(Boolean))
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))]
  }, [services])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return services.filter((s) => {
      if (category !== 'All' && String(s.category).trim() !== category) return false
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        String(s.category).toLowerCase().includes(q) ||
        (s.description?.toLowerCase() || '').includes(q)
      )
    })
  }, [services, category, search])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-end justify-between gap-4 flex-wrap mb-6">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap mb-3">
            <AnimatedEyebrow label="Service catalog" icon={<ShoppingBag className="w-3.5 h-3.5" />} />
            {online ? (
              <span className="flex items-center gap-1 text-xs text-green-400 border border-green-500/25 px-2.5 py-1 rounded-full">
                <Wifi className="w-3 h-3" /> Live catalog
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-yellow-400 border border-yellow-500/25 px-2.5 py-1 rounded-full">
                <WifiOff className="w-3 h-3" /> Reference catalog
              </span>
            )}
          </div>
          <AnimatedHeadline
            as="h1"
            text="AI Services Marketplace"
            className="text-3xl md:text-4xl font-bold text-white font-mono"
          />
          <p className="text-white/55 text-sm mt-2">
            <span className="text-cyan-400/90 font-semibold tabular-nums">{filtered.length}</span>
            <span className="text-white/35"> / {services.length}</span> services shown — every one quoted in writing within 24 hours.
          </p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            aria-label="Search services"
            className="w-full bg-white/5 border border-cyan-500/15 rounded-xl pl-10 pr-4 py-2 text-white placeholder-cyan-400/55 outline-none focus:border-cyan-500/50 transition"
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
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
          <Link href="/request" className="inline-block mt-3 text-cyan-300 hover:text-cyan-200 underline">
            Describe what you need instead — we'll quote it
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((service, idx) => (
            <Link
              key={service.id}
              href={serviceHref(service)}
              className="kalki-panel kalki-card-hover group rounded-xl overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-3 duration-500"
              style={{ animationDelay: `${Math.min(idx, 11) * 45}ms`, animationFillMode: 'backwards' }}
            >
              <div className="aspect-square bg-gradient-to-br from-cyan-500/10 to-purple-500/10 flex items-center justify-center relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getServiceImageUrl(service)}
                  alt={`${service.name} — ${service.category} service by KALKI Intelligence`}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover opacity-95 group-hover:opacity-100 group-hover:scale-[1.03] transition-all duration-500"
                />
                {service.price ? (
                  <span className="absolute top-3 left-3 backdrop-blur-md bg-black/70 text-white text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full border border-white/15">
                    {service.price < 1000 ? 'Starter' : service.price < 100000 ? 'Pro' : 'Enterprise'}
                  </span>
                ) : null}
                {service.duration_days ? (
                  <span className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-sm text-white/90 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 border border-white/10">
                    <Clock className="w-3 h-3 text-cyan-300" />
                    {service.duration_days} days
                  </span>
                ) : null}
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-xs text-cyan-500 uppercase tracking-wider font-medium">{service.category}</p>
                <h3 className="text-white font-semibold text-sm mt-1 line-clamp-2 group-hover:text-cyan-500 transition">
                  {service.name}
                </h3>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {(service.target_industries || []).slice(0, 2).map((ind) => (
                    <span key={ind} className="text-[9px] bg-cyan-500/10 text-cyan-500 px-1.5 py-0.5 rounded-full border border-cyan-500/15">{ind}</span>
                  ))}
                  {(service.target_industries || []).length > 2 && (
                    <span className="text-[9px] text-white/35">+{(service.target_industries || []).length - 2}</span>
                  )}
                </div>
                <p className="text-white/55 text-xs mt-2 line-clamp-2 flex-1">{service.description}</p>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
                  <span className="text-white font-bold">₹{(service.price ?? 0).toLocaleString('en-IN')}</span>
                  <span className="text-xs text-cyan-500 border border-cyan-500/25 px-2.5 py-1 rounded-full group-hover:bg-cyan-500 group-hover:text-primary-foreground transition">
                    View
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
