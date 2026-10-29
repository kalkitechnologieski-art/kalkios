// == KALKI B4 EXPERIENCE ==
'use client';

import Link from 'next/link';
import { Clock } from 'lucide-react';
import type { Database } from '@/lib/supabase/types';
import { getServiceImageUrl } from '@/lib/services/service-image';
import { serviceHref } from '@/lib/services/href';

type Service = Database['public']['Tables']['services']['Row'] & {
  target_industries?: string[];
  long_description?: string | null;
};

interface Props {
  service: Service;
  variantMinPrice?: number | null;
  variantMaxPrice?: number | null;
}

export default function ServiceCard({ service, variantMinPrice, variantMaxPrice }: Props) {
  const hasVariantRange = variantMinPrice != null && variantMaxPrice != null && variantMinPrice !== variantMaxPrice;
  const displayPrice = hasVariantRange
    ? `₹${(variantMinPrice ?? 0).toLocaleString('en-IN')}+`
    : `₹${(service.price ?? 0).toLocaleString('en-IN')}`;

  return (
    <Link
      href={serviceHref(service)}
      className="kalki-panel kalki-card-hover group rounded-xl overflow-hidden flex flex-col"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        {service.price && (
          <span className="absolute top-3 left-3 backdrop-blur-md bg-black/70 text-white text-[10px] font-semibold uppercase tracking-[0.14em] px-2.5 py-1 rounded-full border border-white/15">
            {service.price < 1000 ? 'Starter' : service.price < 100000 ? 'Pro' : 'Enterprise'}
          </span>
        )}
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
          {(service.target_industries || []).slice(0, 2).map((ind: string) => (
            <span key={ind} className="text-[9px] bg-cyan-500/10 text-cyan-500 px-1.5 py-0.5 rounded-full border border-cyan-500/15">
              {ind}
            </span>
          ))}
        </div>
        <p className="text-white/55 text-xs mt-2 line-clamp-2 flex-1">{service.description}</p>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
          <span className="text-white font-bold">{displayPrice}</span>
          <span className="text-xs text-cyan-500 border border-cyan-500/25 px-2.5 py-1 rounded-full group-hover:bg-cyan-500 group-hover:text-primary-foreground transition">
            {hasVariantRange ? 'View tiers' : 'View'}
          </span>
        </div>
      </div>
    </Link>
  );
}
