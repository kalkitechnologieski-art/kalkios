// == KALKI B1 ENGINES ==
// Code validation: rules engine checks every constraint before applying.
// -----------------------------------------------------------------------------

import type { Code, CodeRules, CodeValidationResult } from './types';
import { normalizeCode } from '@/lib/referral/codegen';

export interface ValidationContext {
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  orderAmount: number;
  serviceIds: string[];
  serviceCategories: string[];
  isFirstOrder: boolean;
  userCreatedAt: string | null;
  appliedCodeIds: string[];
}

export function validateCode(
  code: Code,
  ctx: ValidationContext
): CodeValidationResult {
  // Status check
  if (code.status !== 'active') {
    return { valid: false, reason: `Code is ${code.status}` };
  }

  // Code type sanity
  if (normalizeCode(code.code) !== normalizeCode(code.code)) {
    return { valid: false, reason: 'Invalid code' };
  }

  const rules: CodeRules = code.rules ?? {};

  // Time window
  const now = Date.now();
  if (rules.valid_from && now < new Date(rules.valid_from).getTime()) {
    return { valid: false, reason: 'Code not yet active' };
  }
  if (rules.valid_until && now > new Date(rules.valid_until).getTime()) {
    return { valid: false, reason: 'Code expired' };
  }

  // Global usage limit
  if (rules.max_total_uses != null && code.total_uses >= rules.max_total_uses) {
    return { valid: false, reason: 'Code usage limit reached' };
  }

  // Order amount
  if (rules.min_order_value != null && ctx.orderAmount < rules.min_order_value) {
    return { valid: false, reason: `Minimum order ₹${rules.min_order_value} required` };
  }
  if (rules.max_order_value != null && ctx.orderAmount > rules.max_order_value) {
    return { valid: false, reason: `Maximum order ₹${rules.max_order_value}` };
  }

  // First order only
  if (rules.first_order_only && !ctx.isFirstOrder) {
    return { valid: false, reason: 'Valid on first order only' };
  }

  // New user only (signed up < 30 days)
  if (rules.new_user_only && ctx.userCreatedAt) {
    const ageDays = (now - new Date(ctx.userCreatedAt).getTime()) / 86_400_000;
    if (ageDays > 30) {
      return { valid: false, reason: 'Valid for new users only' };
    }
  }

  // Role required
  if (rules.role_required && rules.role_required.length > 0) {
    if (!ctx.userRole || !rules.role_required.includes(ctx.userRole)) {
      return { valid: false, reason: 'Not eligible for your account type' };
    }
  }

  // Email domain checks
  if (ctx.userEmail) {
    const domain = ctx.userEmail.split('@')[1]?.toLowerCase() ?? '';
    if (rules.email_domains_allowed && rules.email_domains_allowed.length > 0) {
      if (!rules.email_domains_allowed.includes(domain)) {
        return { valid: false, reason: 'Email domain not eligible' };
      }
    }
    if (rules.email_domains_blocked && rules.email_domains_blocked.includes(domain)) {
      return { valid: false, reason: 'Email domain not eligible' };
    }
  }

  // Category/service applicability
  if (rules.applicable_categories && rules.applicable_categories.length > 0) {
    const hasMatch = ctx.serviceCategories.some((c) =>
      rules.applicable_categories!.includes(c)
    );
    if (!hasMatch) {
      return { valid: false, reason: 'Not applicable to items in cart' };
    }
  }
  if (rules.excluded_services && rules.excluded_services.length > 0) {
    const hasExcluded = ctx.serviceIds.some((id) =>
      rules.excluded_services!.includes(id)
    );
    if (hasExcluded) {
      return { valid: false, reason: 'Some items are excluded' };
    }
  }

  // Stacking
  if (!rules.can_stack_with_other_codes && ctx.appliedCodeIds.length > 0) {
    return { valid: false, reason: 'Cannot stack with other codes' };
  }

  // Login required
  if (rules.require_login && !ctx.userId) {
    return { valid: false, reason: 'Please sign in to use this code' };
  }

  // Compute discount amount
  const amount = computeDiscount(code, ctx.orderAmount);

  return {
    valid: true,
    discount: {
      type: code.discount_type,
      value: code.discount_value,
      amount,
    },
  };
}

export function computeDiscount(code: Code, orderAmount: number): number {
  switch (code.discount_type) {
    case 'percentage':
      return Math.round(orderAmount * (code.discount_value / 100) * 100) / 100;
    case 'fixed':
      return Math.min(code.discount_value, orderAmount);
    case 'tiered': {
      const config = code.discount_config as { tiers?: Array<{ min: number; pct: number }> };
      const tiers = config.tiers ?? [];
      const sorted = [...tiers].sort((a, b) => b.min - a.min);
      const match = sorted.find((t) => orderAmount >= t.min);
      return match ? Math.round(orderAmount * (match.pct / 100) * 100) / 100 : 0;
    }
    case 'bogo':
      // Best-effort: 50% off one item
      return Math.round((orderAmount / 2) * 100) / 100;
    case 'shipping':
      return 0;
    case 'bundle':
      return Math.round(orderAmount * (code.discount_value / 100) * 100) / 100;
    default:
      return 0;
  }
}
