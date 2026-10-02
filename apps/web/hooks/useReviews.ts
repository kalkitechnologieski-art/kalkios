// == KALKI B4 EXPERIENCE ==
'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Review {
  id: string;
  order_id: string | null;
  service_id: string;
  user_id: string;
  rating: number;
  title: string | null;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  helpful_count: number;
  verified: boolean;
  created_at: string;
}

export interface ReviewStats {
  average: number;
  count: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

export function useServiceReviews(serviceId: string | null) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({ average: 0, count: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!serviceId) { setLoading(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .eq('service_id', serviceId)
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    const list = (data ?? []) as Review[];
    setReviews(list);

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as ReviewStats['breakdown'];
    let sum = 0;
    for (const r of list) {
      const k = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
      breakdown[k] += 1;
      sum += r.rating;
    }
    setStats({
      average: list.length > 0 ? sum / list.length : 0,
      count: list.length,
      breakdown,
    });
    setLoading(false);
  }, [serviceId]);

  useEffect(() => { void fetch(); }, [fetch]);
  return { reviews, stats, loading, refetch: fetch };
}

export async function submitReview(input: {
  orderId: string;
  serviceId: string;
  rating: number;
  title?: string;
  text: string;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error ?? 'Failed' };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
