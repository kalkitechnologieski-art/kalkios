// == KALKI B1 SPINE ==
// GST calculation engine with per-category rates.
// -----------------------------------------------------------------------------

import type { CartLineItem, TaxLine } from './types';

const DEFAULT_GST = 18;

const CATEGORY_GST: Record<string, number> = {
  'Web Development': 18,
  'App Development': 18,
  'Marketing': 18,
  'Design': 18,
  'Media': 18,
  'AI Automation': 18,
  'AI Chatbots': 18,
  'Development': 18,
  'Consulting': 18,
  'AI': 18,
  'Education': 5,
  'Healthcare': 5,
};

export function getGstRate(category: string | undefined): number {
  if (!category) return DEFAULT_GST;
  return CATEGORY_GST[category] ?? DEFAULT_GST;
}

export interface TaxComputation {
  taxableAmount: number;
  taxBreakdown: TaxLine[];
  totalTax: number;
}

export function computeTax(lineItems: CartLineItem[]): TaxComputation {
  const byRate = new Map<number, number>();

  for (const item of lineItems) {
    const rate = item.gstRate ?? getGstRate(item.category);
    const lineTotal =
      (item.price ?? 0) * (item.quantity ?? 1) - (item.discountAmount ?? 0);
    byRate.set(rate, (byRate.get(rate) ?? 0) + lineTotal);
  }

  const breakdown: TaxLine[] = [];
  let totalTax = 0;
  let taxableAmount = 0;

  for (const [rate, amount] of byRate) {
    const tax = Math.round(amount * (rate / 100) * 100) / 100;
    breakdown.push({ rate, taxableAmount: amount, taxAmount: tax });
    totalTax += tax;
    taxableAmount += amount;
  }

  return { taxableAmount, taxBreakdown: breakdown, totalTax };
}
