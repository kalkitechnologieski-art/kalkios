// == KALKI B2 ENGINES ==
// Referral code generation. Unambiguous alphanumeric (no 0/O, 1/I).
// -----------------------------------------------------------------------------

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomBytes(len: number): string {
  const arr = new Uint8Array(len);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < len; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => ALPHABET[b % ALPHABET.length]).join('');
}

export function generateReferralCode(): string {
  return `KALKI-${randomBytes(6)}`;
}

export function generateCampaignCode(prefix: string): string {
  const clean = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  return `${clean || 'CAMP'}-${randomBytes(4)}`;
}

export function generateGiftCode(amount: number): string {
  const suffix = Math.floor(amount).toString(36).toUpperCase();
  return `GIFT-${suffix}-${randomBytes(4)}`;
}

export function generateVanityCode(name: string): string {
  const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
  return clean.length >= 3 ? `KALKI-${clean}` : generateReferralCode();
}

export function isValidCodeFormat(code: string): boolean {
  return /^[A-Z0-9-]{3,32}$/.test(code.trim().toUpperCase());
}

export function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}
