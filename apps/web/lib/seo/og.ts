// == KALKI B5 LAUNCH ==
// OG image URL builder + color palette for dynamic OG rendering.
// -----------------------------------------------------------------------------

const SITE = process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com';

export const OG_PALETTE = {
  bg: '#0a0a0f',
  accentCyan: '#00ffff',
  accentPurple: '#8b5cf6',
  accentPink: '#ff0066',
  textPrimary: '#ffffff',
  textSecondary: '#a1a1aa',
  border: 'rgba(0,255,255,0.15)',
} as const;

export function ogImageUrl(slug: string): string {
  return `${SITE}/api/og/${encodeURIComponent(slug)}`;
}

export function truncateForOg(text: string, maxLen = 120): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  return clean.slice(0, maxLen - 1).trimEnd() + '…';
}

export function formatPriceINR(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
}
