// == KALKI B1 SPINE ==
// Code domain types. Engine implemented in Batch 2.
// -----------------------------------------------------------------------------

export type CodeType = 'promo' | 'referral' | 'gift' | 'tier' | 'trial';
export type CodeStatus = 'draft' | 'active' | 'paused' | 'expired' | 'exhausted';

export interface CodeRules {
  valid_from?: string;
  valid_until?: string;
  timezone?: string;
  max_total_uses?: number | null;
  max_uses_per_user?: number;
  max_uses_per_day?: number | null;
  min_order_value?: number | null;
  max_order_value?: number | null;
  applicable_categories?: string[] | null;
  applicable_services?: string[] | null;
  excluded_services?: string[] | null;
  first_order_only?: boolean;
  new_user_only?: boolean;
  role_required?: string[] | null;
  email_domains_allowed?: string[] | null;
  email_domains_blocked?: string[] | null;
  can_stack_with_other_codes?: boolean;
  can_stack_with_referral?: boolean;
  country_codes?: string[] | null;
  require_login?: boolean;
  require_verified_email?: boolean;
}

export interface Code {
  id: string;
  code: string;
  code_type: CodeType;
  name: string | null;
  description: string | null;
  owner_user_id: string | null;
  discount_type: 'percentage' | 'fixed' | 'tiered' | 'bogo' | 'shipping' | 'bundle';
  discount_value: number;
  discount_config: Record<string, unknown>;
  rules: CodeRules;
  status: CodeStatus;
  total_uses: number;
  total_discount_given: number;
  total_revenue_generated: number;
  created_at: string;
  updated_at: string;
}

export interface CodeValidationResult {
  valid: boolean;
  reason?: string;
  discount?: {
    type: string;
    value: number;
    amount: number;
  };
}

export interface CodeRedemption {
  id: string;
  code_id: string;
  user_id: string | null;
  order_id: string | null;
  discount_applied: number;
  created_at: string;
}
