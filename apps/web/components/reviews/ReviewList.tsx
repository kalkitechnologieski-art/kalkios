// == KALKI B4 EXPERIENCE ==
'use client';

import { Star } from 'lucide-react';
import { ReviewCard } from './ReviewCard';

interface ReviewItem {
  id: string;
  rating: number;
  title: string | null;
  text: string;
  user_id: string;
  created_at: string;
  verified: boolean;
}

interface Stats {
  average: number;
  count: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
}

interface Props {
  reviews: ReviewItem[];
  stats: Stats;
  loading?: boolean;
}

export function ReviewList({ reviews, stats, loading }: Props) {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/5 rounded-xl h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-white/40 text-sm">
        No reviews yet. Be the first to share your experience.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 text-center">
          <div className="text-4xl font-bold text-white">{stats.average.toFixed(1)}</div>
          <div className="flex justify-center gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-4 h-4 ${s <= Math.round(stats.average) ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
              />
            ))}
          </div>
          <div className="text-white/40 text-xs mt-1">{stats.count} review{stats.count === 1 ? '' : 's'}</div>
        </div>

        <div className="md:col-span-2 bg-white/5 border border-cyan-500/10 rounded-xl p-4">
          {[5, 4, 3, 2, 1].map((r) => {
            const count = stats.breakdown[r as 1 | 2 | 3 | 4 | 5] ?? 0;
            const pct = stats.count > 0 ? (count / stats.count) * 100 : 0;
            return (
              <div key={r} className="flex items-center gap-3 text-xs font-mono text-white/60">
                <span className="w-3">{r}</span>
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500/50 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-8 text-right">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <ReviewCard
            key={r.id}
            rating={r.rating}
            title={r.title}
            text={r.text}
            author={`User ${r.user_id.slice(0, 6)}`}
            createdAt={r.created_at}
            verified={r.verified}
          />
        ))}
      </div>
    </div>
  );
}
