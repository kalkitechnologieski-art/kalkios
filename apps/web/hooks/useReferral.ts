// == KALKI B2 ENGINES ==
// Client hook: referral code, share link, earnings.
// -----------------------------------------------------------------------------

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser } from '@/hooks/useAuth';

export interface ReferralStats {
  code: string | null;
  shareLink: string;
  totalReferrals: number;
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
}

export function useReferral() {
  const { user } = useUser();
  const [code, setCode] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, earned: 0, available: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const run = async () => {
      try {
        const response = await fetch('/api/referral/stats');
        if (response.ok) {
          const data = (await response.json()) as {
            code?: string;
            total?: number;
            earned?: number;
            available?: number;
            pending?: number;
          };
          if (data.code) setCode(data.code);
          setStats({
            total: data.total ?? 0,
            earned: data.earned ?? 0,
            available: data.available ?? 0,
            pending: data.pending ?? 0,
          });
        }
      } catch { /* silent */ } finally {
        setLoading(false);
      }
    };
    void run();
  }, [user]);

  const shareLink = useMemo(() => {
    if (typeof window === 'undefined') return '';
    if (!code) return '';
    return `${window.location.origin}/?ref=${code}`;
  }, [code]);

  const copy = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
  }, []);

  return {
    code,
    shareLink,
    totalReferrals: stats.total,
    totalEarnings: stats.earned,
    availableBalance: stats.available,
    pendingBalance: stats.pending,
    loading,
    copy,
  };
}
