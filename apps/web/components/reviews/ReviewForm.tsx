// == KALKI B4 EXPERIENCE ==
'use client';

import { useState } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { submitReview } from '@/hooks/useReviews';

interface Props {
  orderId: string;
  serviceId: string;
  onSubmitted?: () => void;
}

export function ReviewForm({ orderId, serviceId, onSubmitted }: Props) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (text.length < 20) { setError('Please write at least 20 characters.'); return; }
    setLoading(true);
    const result = await submitReview({ orderId, serviceId, rating, title, text });
    setLoading(false);
    if (!result.ok) { setError(result.error ?? 'Failed'); return; }
    onSubmitted?.();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white/5 border border-cyan-500/10 rounded-xl p-5 space-y-4">
      <div>
        <label className="text-white/60 text-xs font-mono block mb-2">Your rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setRating(s)}
              className="p-1"
              aria-label={`${s} star`}
            >
              <Star className={`w-6 h-6 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`} />
            </button>
          ))}
        </div>
      </div>

      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-500/50 transition text-sm"
      />

      <textarea
        placeholder="Share your experience (min 20 chars)"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2 text-white outline-none focus:border-cyan-500/50 transition text-sm resize-none"
      />

      {error && <div className="text-red-400 text-xs">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-cyan-600 hover:bg-cyan-700 text-black font-medium rounded-lg py-2.5 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        Submit review
      </button>
    </form>
  );
}
