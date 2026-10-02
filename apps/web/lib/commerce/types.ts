// == KALKI B1 SPINE ==
// Commerce type primitives for the entire storefront.
// -----------------------------------------------------------------------------

export interface CartLineItem {
  id: string;
  variantId?: string | null;
  variantName?: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  slug?: string;
  icon?: string;
  image_url?: string;
  gstRate?: number;
  discountAmount?: number;
}

export type DiscountType =
  | 'percentage'
  | 'fixed'
  | 'tiered'
  | 'bogo'
  | 'bundle'
  | 'shipping';

export interface Discount {
  code: string;
  type: DiscountType;
  value: number;
  amount: number;
  breakdown?: Record<string, unknown>;
}

export interface TaxLine {
  rate: number;
  taxableAmount: number;
  taxAmount: number;
}

export interface OrderSummary {
  subtotal: number;
  discountTotal: number;
  walletCredit: number;
  taxableAmount: number;
  taxBreakdown: TaxLine[];
  totalTax: number;
  grandTotal: number;
}

export interface IdempotencyKey {
  key: string;
  userId: string;
  serviceIds: string[];
  bucket: number;
}

export interface CreateOrderRequest {
  serviceIds: string[];
  variantIds?: Array<string | null>;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  code?: string;
  applyWallet?: boolean;
}

export interface CreateOrderResponse {
  paymentUrl: string;
  orderIds: string[];
  total: number;
  idempotent: boolean;
}
