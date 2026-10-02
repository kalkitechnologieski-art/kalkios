// == KALKI B2 ENGINES ==
// Apply discount to cart. Accepts a MINIMAL line-item shape so the API
// route can pass just { id, price, quantity, category? } without needing
// the full CartLineItem interface.
// -----------------------------------------------------------------------------

import type { Discount } from '@/lib/commerce/types';
import { computeDiscount } from './validate';
import type { Code } from './types';

/** The subset of line-item fields that discount math actually needs. */
export interface DiscountableLine {
  id: string;
  price: number;
  quantity: number;
  category?: string;
}

export interface ApplyResult {
  lineItems: DiscountableLine[];
  discountTotal: number;
  appliedCodes: string[];
}

export function applyDiscount(
  lineItems: DiscountableLine[],
  codes: Code[]
): ApplyResult {
  const subtotal = lineItems.reduce((s, i) => s + (i.price ?? 0) * (i.quantity ?? 0), 0);

  // Sort: percentage first, then tiered, bundle, bogo, fixed, shipping.
  const ordered = [...codes].sort((a, b) => {
    const order: Record<string, number> = {
      percentage: 0,
      tiered: 1,
      bundle: 2,
      bogo: 3,
      fixed: 4,
      shipping: 5,
    };
    return (order[a.discount_type] ?? 9) - (order[b.discount_type] ?? 9);
  });

  let discountTotal = 0;
  for (const code of ordered) {
    const amount = computeDiscount(code, Math.max(subtotal - discountTotal, 0));
    discountTotal += amount;
  }

  discountTotal = Math.min(discountTotal, subtotal);

  return {
    lineItems,
    discountTotal: Math.round(discountTotal * 100) / 100,
    appliedCodes: codes.map((c) => c.code),
  };
}

export function toDiscount(code: Code, amount: number): Discount {
  return {
    code: code.code,
    type: code.discount_type,
    value: code.discount_value,
    amount,
  };
}
