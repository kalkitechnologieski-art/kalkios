// == KALKI B5 LAUNCH ==
// Dynamic OG image generation using Next.js ImageResponse (built-in).
// Renders 1200x630 cyberpunk card per product slug.
// -----------------------------------------------------------------------------

import { ImageResponse } from 'next/og';
import { createClient } from '@/lib/supabase/server';
import { OG_PALETTE, truncateForOg, formatPriceINR } from '@/lib/seo/og';

export const runtime = 'edge';
export const revalidate = 3600;

interface ServiceRow {
  name: string;
  category: string;
  description: string | null;
  price: number | null;
  rating: number | null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const decoded = decodeURIComponent(slug);

  let service: ServiceRow | null = null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data } = await supabase
      .from('services')
      .select('name, category, description, price, rating')
      .eq('slug', decoded)
      .single();
    service = (data as ServiceRow) ?? null;
  } catch {
    service = null;
  }

  const name = service?.name ?? 'KALKI OS';
  const category = service?.category ?? 'AI Services';
  const description = truncateForOg(service?.description ?? 'Enterprise AI-powered digital services from KALKI Intelligence', 110);
  const price = service?.price ? formatPriceINR(service.price) : 'From ₹499';
  const rating = service?.rating ?? 4.8;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: OG_PALETTE.bg,
          backgroundImage: `radial-gradient(circle at 20% 20%, rgba(0,255,255,0.15), transparent 45%), radial-gradient(circle at 80% 80%, rgba(139,92,246,0.12), transparent 50%)`,
          padding: '60px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: OG_PALETTE.textPrimary,
          position: 'relative',
        }}
      >
        {/* Top bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `linear-gradient(135deg, ${OG_PALETTE.accentCyan} 0%, ${OG_PALETTE.accentPurple} 60%, ${OG_PALETTE.accentPink} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 900,
              color: '#000',
            }}
          >
            K
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: '14px', letterSpacing: '4px', color: OG_PALETTE.accentCyan, opacity: 0.7, fontWeight: 600 }}>
              KALKI OS
            </div>
            <div style={{ fontSize: '11px', letterSpacing: '2px', color: OG_PALETTE.textSecondary }}>
              TEMPLE OF TECHNOLOGY
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center', marginTop: '20px' }}>
          <div style={{ fontSize: '16px', color: OG_PALETTE.accentCyan, marginBottom: '12px', letterSpacing: '2px' }}>
            {category.toUpperCase()}
          </div>
          <div style={{ fontSize: '56px', fontWeight: 800, lineHeight: 1.1, marginBottom: '20px', letterSpacing: '-1px' }}>
            {name}
          </div>
          <div style={{ fontSize: '22px', color: OG_PALETTE.textSecondary, lineHeight: 1.4 }}>
            {description}
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' }}>
          <div style={{ display: 'flex', gap: '32px' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '11px', color: OG_PALETTE.textSecondary, letterSpacing: '2px' }}>STARTING AT</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: OG_PALETTE.accentCyan }}>{price}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '11px', color: OG_PALETTE.textSecondary, letterSpacing: '2px' }}>RATING</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: OG_PALETTE.accentPurple }}>
                ★ {rating.toFixed(1)}
              </div>
            </div>
          </div>
          <div style={{ fontSize: '13px', color: OG_PALETTE.textSecondary, letterSpacing: '1px' }}>
            kalkios.com
          </div>
        </div>

        {/* Corner accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '240px',
            height: '240px',
            background: `radial-gradient(circle at top right, ${OG_PALETTE.accentPink}, transparent 70%)`,
            opacity: 0.15,
          }}
        />
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
