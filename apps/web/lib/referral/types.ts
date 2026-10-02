// == KALKI B1 SPINE ==
// Referral domain types. Engine implemented in Batch 2.
// -----------------------------------------------------------------------------

export type ReferralStatus =
  | 'pending'
  | 'converted'
  | 'rewarded'
  | 'expired'
  | 'fraud';

export interface ReferralEvent {
  id: string;
  referrer_id: string;
  referee_id: string | null;
  referral_code: string;
  status: ReferralStatus;
  converted_order_id: string | null;
  referrer_reward_amount: number | null;
  referrer_reward_type: string | null;
  referee_discount_amount: number | null;
  created_at: string;
  converted_at: string | null;
  rewarded_at: string | null;
}

export interface ReferralReward {
  id: string;
  user_id: string;
  amount: number;
  reward_type: 'credit' | 'coupon' | 'cash' | 'points' | 'tier';
  status: 'pending' | 'available' | 'redeemed' | 'paid' | 'expired';
  expires_at: string | null;
  created_at: string;
}

export interface ReferralConfig {
  referrerRewardType: 'credit' | 'coupon' | 'cash' | 'points' | 'tier';
  referrerRewardValue: number;
  refereeDiscountType: 'percentage' | 'fixed';
  refereeDiscountValue: number;
  minPurchase: number;
  attributionWindowDays: number;
  rewardExpiryDays: number;
  maxReferralsPerUser: number | null;
}
