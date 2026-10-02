// == KALKI B2 ENGINES ==
// Referral engine: convert pending -> converted, credit rewards, expire.
// Reward triggers on CONVERSION (first qualifying purchase), not click.
// -----------------------------------------------------------------------------

import type { ReferralConfig } from './types';
import { generateReferralCode } from './codegen';

export const DEFAULT_REFERRAL_CONFIG: ReferralConfig = {
  referrerRewardType: 'credit',
  referrerRewardValue: 500,
  refereeDiscountType: 'percentage',
  refereeDiscountValue: 20,
  minPurchase: 1000,
  attributionWindowDays: 30,
  rewardExpiryDays: 90,
  maxReferralsPerUser: null,
};

export interface ReferralConversionInput {
  referrerId: string;
  refereeId: string;
  code: string;
  orderAmount: number;
  config: ReferralConfig;
}

export interface ReferralConversionResult {
  eligible: boolean;
  reason?: string;
  referrerReward: number;
  refereeDiscount: number;
  expiresAt: string;
}

export function evaluateConversion(input: ReferralConversionInput): ReferralConversionResult {
  const { orderAmount, config } = input;

  if (orderAmount < config.minPurchase) {
    return {
      eligible: false,
      reason: `Minimum purchase ₹${config.minPurchase} required`,
      referrerReward: 0,
      refereeDiscount: 0,
      expiresAt: new Date().toISOString(),
    };
  }

  const referrerReward = computeReward(config, orderAmount);
  const refereeDiscount = computeRefereeDiscount(config, orderAmount);
  const expiresAt = new Date(Date.now() + config.rewardExpiryDays * 86_400_000).toISOString();

  return {
    eligible: true,
    referrerReward,
    refereeDiscount,
    expiresAt,
  };
}

export function computeReward(config: ReferralConfig, orderAmount: number): number {
  void orderAmount;
  if (config.referrerRewardType === 'percentage' as string) {
    return Math.round((config.referrerRewardValue / 100) * orderAmount * 100) / 100;
  }
  return config.referrerRewardValue;
}

export function computeRefereeDiscount(config: ReferralConfig, orderAmount: number): number {
  if (config.refereeDiscountType === 'percentage') {
    return Math.round((config.refereeDiscountValue / 100) * orderAmount * 100) / 100;
  }
  return Math.min(config.refereeDiscountValue, orderAmount);
}

export function isExpired(createdAt: string, windowDays: number): boolean {
  const ageDays = (Date.now() - new Date(createdAt).getTime()) / 86_400_000;
  return ageDays > windowDays;
}

export function generateUniqueCode(existingCodes: Set<string>): string {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateReferralCode();
    if (!existingCodes.has(code)) return code;
  }
  return `KALKI-${Date.now().toString(36).toUpperCase()}`;
}
