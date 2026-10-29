'use client';

interface CapabilityMarqueeProps {
  items: string[];
  className?: string;
  durationSec?: number;
}

// A slow rail of what we actually do. Duplicated once so the loop is seamless,
// and hidden from assistive tech because the same words appear elsewhere.
export function CapabilityMarquee({ items, className = '', durationSec = 34 }: CapabilityMarqueeProps) {
  if (items.length === 0) return null;

  return (
    <div className={`kalki-marquee-mask relative overflow-hidden ${className}`} aria-hidden="true">
      <div className="kalki-marquee-track flex w-max items-center" style={{ animationDuration: `${durationSec}s` }}>
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center gap-2.5 pr-2.5">
            {items.map((label) => (
              <span
                key={`${copy}-${label}`}
                className="whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/70 sm:text-[11px]"
              >
                {label}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
