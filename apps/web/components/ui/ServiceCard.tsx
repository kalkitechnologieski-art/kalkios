'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

interface ServiceCardProps {
  service: Service
}

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <Link
      href={`/services/${service.category}/${service.slug}`}
      className="group bg-white/5 border border-white/5 hover:border-cyan-500/30 rounded-xl overflow-hidden transition hover:bg-white/5"
    >
      <div className="aspect-square bg-gradient-to-br from-cyan-500/10 to-purple-500/10 flex items-center justify-center relative">
        <span className="text-6xl opacity-30">{service.icon || '📦'}</span>
        <span className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-xs px-2 py-1 rounded flex items-center gap-1">
          <Star className="w-3 h-3 fill-cyan-400 text-cyan-400" />
          {service.rating || '4.5'}
        </span>
      </div>
      <div className="p-4">
        <p className="text-xs text-white/40 uppercase tracking-wider">{service.category}</p>
        <h3 className="text-white font-medium text-sm mt-1 line-clamp-2 group-hover:text-cyan-400 transition">
          {service.name}
        </h3>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-white font-bold">₹{service.price?.toLocaleString()}</span>
          <span className="text-xs text-green-400 ml-auto">In Stock</span>
        </div>
      </div>
    </Link>
  )
}
