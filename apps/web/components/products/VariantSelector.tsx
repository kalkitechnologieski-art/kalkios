// == KALKI B4 EXPERIENCE ==
'use client';

import { cn } from '@/lib/utils';

export interface Variant {
  id: string;
  name: string;
  price: number;
  features?: string[];
  duration_days?: number | null;
}

interface Props {
  variants: Variant[];
  value: string | null;
  onChange: (id: string) => void;
}

export function VariantSelector({ variants, value, onChange }: Props) {
  if (variants.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="text-white/60 text-xs font-mono uppercase tracking-wider block">Choose a tier</label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {variants.map((v) => {
          const selected = value === v.id;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => onChange(v.id)}
              className={cn(
                'text-left p-3 rounded-xl border transition',
                selected
                  ? 'border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_20px_rgba(0,255,255,0.08)]'
                  : 'border-white/10 bg-white/5 hover:border-white/20'
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn('font-medium text-sm', selected ? 'text-cyan-300' : 'text-white')}>{v.name}</span>
                <span className="text-white font-bold">₹{v.price.toLocaleString('en-IN')}</span>
              </div>
              {v.duration_days && (
                <p className="text-[11px] text-white/40 mt-1">{v.duration_days} day delivery</p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
