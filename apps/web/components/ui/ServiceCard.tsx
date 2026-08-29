'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row'] & {
  target_industries?: string[]
  long_description?: string | null
}

interface ServiceCardProps {
  service: Service
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Link
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
  )
}
