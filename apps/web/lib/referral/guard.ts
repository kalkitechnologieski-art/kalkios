// == KALKI B2 ENGINES ==
// Fraud guard: self-referral, same-IP, velocity, disposable email.
// Shadowbanning: allow signup but invalidate bonus silently.
// -----------------------------------------------------------------------------

const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com', 'guerrillamail.com', '10minutemail.com', 'throwaway.email',
  'mailinator.com', 'trashmail.com', 'yopmail.com', 'getnada.com',
  'sharklasers.com', 'temp-mail.org', 'fakeinbox.com', 'dispostable.com',
]);

export type FraudReason =
  | 'self_referral'
  | 'same_email'
  | 'same_ip'
  | 'velocity_exceeded'
  | 'disposable_email'
  | 'reward_cycling';

export interface FraudCheckInput {
  referrerId: string;
  refereeId: string;
  refereeEmail: string;
  refereeIp: string | null;
  recentEventsFromIp: number;
  userTotalReferrals: number;
  maxPerDay: number;
  alreadyConvertedBefore: boolean;
}

export interface FraudCheckResult {
  fraud: boolean;
  reason?: FraudReason;
  severity: 'low' | 'medium' | 'high';
  action: 'allow' | 'flag' | 'shadowban' | 'block';
}

export function runFraudCheck(input: FraudCheckInput): FraudCheckResult {
  // Hard block: self-referral
  if (input.referrerId === input.refereeId) {
    return { fraud: true, reason: 'self_referral', severity: 'high', action: 'block' };
  }

  // Hard block: disposable email
  const domain = input.refereeEmail.split('@')[1]?.toLowerCase() ?? '';
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return { fraud: true, reason: 'disposable_email', severity: 'medium', action: 'shadowban' };
  }

  // Flag: high IP velocity
  if (input.refereeIp && input.recentEventsFromIp >= input.maxPerDay) {
    return { fraud: true, reason: 'velocity_exceeded', severity: 'high', action: 'block' };
  }

  // Flag: same IP within 24h (soft signal)
  if (input.recentEventsFromIp > 0 && input.recentEventsFromIp < input.maxPerDay) {
    return { fraud: true, reason: 'same_ip', severity: 'low', action: 'flag' };
  }

  // Flag: reward cycling (user has many referrals, low conversion rate)
  if (input.userTotalReferrals > 20 && input.alreadyConvertedBefore) {
    return { fraud: true, reason: 'reward_cycling', severity: 'medium', action: 'flag' };
  }

  return { fraud: false, severity: 'low', action: 'allow' };
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return DISPOSABLE_DOMAINS.has(domain);
}

export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  // Non-cryptographic hash for grouping; not for security
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    hash = (hash << 5) - hash + ip.charCodeAt(i);
    hash &= hash;
  }
  return Math.abs(hash).toString(36);
}
