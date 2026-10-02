// == KALKI B2 ENGINES ==
// Attribution: cookie + localStorage backup, 30-day default window.
// First-touch wins — once set, referral code is locked for the window.
// -----------------------------------------------------------------------------

const COOKIE_NAME = 'siddhi_ref';
const STORAGE_KEY = 'siddhi_ref_code';
const ATTRIBUTION_DAYS = 30;

export interface AttributedRef {
  code: string;
  capturedAt: number;
  source: 'query' | 'cookie' | 'storage';
}

export function captureReferralFromUrl(): AttributedRef | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const code = params.get('ref')?.trim().toUpperCase();
  if (!code || !/^[A-Z0-9-]{3,32}$/.test(code)) return null;

  const now = Date.now();

  // First-touch: if cookie already exists, don't overwrite
  const existing = getAttributedRef();
  if (existing) return existing;

  // Set both cookie + localStorage
  try {
    document.cookie = `${COOKIE_NAME}=${encodeURIComponent(code)}; max-age=${ATTRIBUTION_DAYS * 86400}; path=/; SameSite=Lax`;
  } catch { /* ignore */ }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code, capturedAt: now }));
  } catch { /* ignore */ }

  return { code, capturedAt: now, source: 'query' };
}

export function getAttributedRef(): AttributedRef | null {
  if (typeof window === 'undefined') return null;

  // Try cookie first
  const cookieMatch = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]*)`));
  if (cookieMatch?.[1]) {
    const code = decodeURIComponent(cookieMatch[1]).toUpperCase();
    return { code, capturedAt: Date.now(), source: 'cookie' };
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { code: string; capturedAt: number };
      const ageDays = (Date.now() - parsed.capturedAt) / 86_400_000;
      if (ageDays <= ATTRIBUTION_DAYS) {
        return { code: parsed.code, capturedAt: parsed.capturedAt, source: 'storage' };
      }
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch { /* ignore */ }

  return null;
}

export function clearAttribution(): void {
  if (typeof window === 'undefined') return;
  try { document.cookie = `${COOKIE_NAME}=; max-age=0; path=/`; } catch { /* ignore */ }
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
}

export function getAttributionDays(): number {
  return ATTRIBUTION_DAYS;
}
