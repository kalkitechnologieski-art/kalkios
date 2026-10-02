// == KALKI B2 ENGINES ==
// Code state machine: draft -> active -> paused -> expired/exhausted.
// -----------------------------------------------------------------------------

import type { Code, CodeStatus } from './types';

const VALID_TRANSITIONS: Record<CodeStatus, CodeStatus[]> = {
  draft: ['active', 'paused'],
  active: ['paused', 'expired', 'exhausted'],
  paused: ['active', 'expired'],
  expired: [],
  exhausted: [],
};

export function canTransition(from: CodeStatus, to: CodeStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatus(code: Code): CodeStatus {
  // Auto-transition if exhausted or expired
  if (
    code.rules?.max_total_uses != null &&
    code.total_uses >= code.rules.max_total_uses
  ) {
    return 'exhausted';
  }
  if (code.rules?.valid_until && Date.now() > new Date(code.rules.valid_until).getTime()) {
    return 'expired';
  }
  return code.status;
}

export function isRedeemable(code: Code): boolean {
  const status = nextStatus(code);
  return status === 'active';
}

export function summarizeUsage(code: Code): {
  uses: string;
  revenue: string;
  discount: string;
  status: CodeStatus;
} {
  const uses = code.rules?.max_total_uses
    ? `${code.total_uses} / ${code.rules.max_total_uses}`
    : `${code.total_uses}`;
  return {
    uses,
    revenue: `₹${code.total_revenue_generated.toLocaleString('en-IN')}`,
    discount: `₹${code.total_discount_given.toLocaleString('en-IN')}`,
    status: nextStatus(code),
  };
}
