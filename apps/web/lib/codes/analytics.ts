// == KALKI B2 ENGINES ==
// Code analytics: ROI, top performers, abuse signals.
// -----------------------------------------------------------------------------

import type { Code } from './types';

export interface CodePerformance {
  code: string;
  uses: number;
  revenue: number;
  discount: number;
  roi: number;
  status: string;
}

export function computePerformance(code: Code): CodePerformance {
  const discount = code.total_discount_given || 0;
  const revenue = code.total_revenue_generated || 0;
  const roi = discount > 0 ? Math.round((revenue / discount) * 100) / 100 : 0;
  return {
    code: code.code,
    uses: code.total_uses,
    revenue,
    discount,
    roi,
    status: code.status,
  };
}

export function rankByRevenue(codes: Code[]): CodePerformance[] {
  return codes.map(computePerformance).sort((a, b) => b.revenue - a.revenue);
}

export function detectAbuse(codes: Code[]): CodePerformance[] {
  // Signals: high usage but low ROI
  return codes
    .map(computePerformance)
    .filter((c) => c.uses > 10 && c.roi < 1.5);
}

export function summarize(codes: Code[]): {
  totalCodes: number;
  activeCodes: number;
  totalUses: number;
  totalRevenue: number;
  totalDiscount: number;
  averageROI: number;
} {
  const totalCodes = codes.length;
  const activeCodes = codes.filter((c) => c.status === 'active').length;
  const totalUses = codes.reduce((s, c) => s + c.total_uses, 0);
  const totalRevenue = codes.reduce((s, c) => s + (c.total_revenue_generated || 0), 0);
  const totalDiscount = codes.reduce((s, c) => s + (c.total_discount_given || 0), 0);
  const averageROI = totalDiscount > 0
    ? Math.round((totalRevenue / totalDiscount) * 100) / 100
    : 0;
  return { totalCodes, activeCodes, totalUses, totalRevenue, totalDiscount, averageROI };
}
