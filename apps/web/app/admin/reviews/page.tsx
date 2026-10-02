// == KALKI B5 LAUNCH ==
'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Star, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Review {
  id: string;
  rating: number;
  title: string | null;
  text: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  service_id: string;
  user_id: string;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

  const fetchReviews = useCallback(async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    const query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    const { data } = filter === 'all'
      ? await query
      : await query.eq('status', filter);

    setReviews((data ?? []) as Review[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { void fetchReviews(); }, [fetchReviews]);

  const updateStatus = async (id: string, status: 'approved' | 'rejected') => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    try {
      const { error } = await supabase.from('reviews').update({ status }).eq('id', id);
      if (error) throw error;
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
      toast.success(`Review ${status}`);
    } catch {
      toast.error('Failed to update');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-white font-mono">Reviews</h1>
        <div className="flex gap-2">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition capitalize ${
                filter === f
                  ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30'
                  : 'bg-white/5 text-white/50 border border-white/5 hover:bg-white/10'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-20 text-white/40">No reviews in this view.</div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-white/5 border border-cyan-500/10 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
                        />
                      ))}
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      r.status === 'approved' ? 'bg-green-500/20 text-green-400'
                      : r.status === 'rejected' ? 'bg-red-500/20 text-red-400'
                      : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {r.status}
                    </span>
                    <span className="text-white/30 text-[10px] font-mono">
                      {new Date(r.created_at).toLocaleString()}
                    </span>
                  </div>
                  {r.title && <p className="text-white font-medium text-sm">{r.title}</p>}
                  <p className="text-white/70 text-sm mt-1 whitespace-pre-wrap">{r.text}</p>
                </div>
                <div className="flex flex-col gap-1 flex-shrink-0">
                  {r.status !== 'approved' && (
                    <button
                      onClick={() => updateStatus(r.id, 'approved')}
                      className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 transition"
                      aria-label="Approve"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {r.status !== 'rejected' && (
                    <button
                      onClick={() => updateStatus(r.id, 'rejected')}
                      className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition"
                      aria-label="Reject"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
