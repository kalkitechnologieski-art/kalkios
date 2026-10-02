// == KALKI B1 SPINE ==
// INR formatting and rounding helpers.
// -----------------------------------------------------------------------------

export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatINRCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000) return `₹${(value / 100_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(value / 1_000).toFixed(1)}K`;
  return `₹${value}`;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
