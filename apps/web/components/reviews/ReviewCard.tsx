// == KALKI B4 EXPERIENCE ==
'use client';

import { Star, CheckCircle } from 'lucide-react';

interface Props {
  rating: number;
  title?: string | null;
  text: string;
  author: string;
  createdAt: string;
  verified?: boolean;
}

export function ReviewCard({ rating, title, text, author, createdAt, verified = true }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-3.5 h-3.5 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`}
            />
          ))}
        </div>
        {verified && (
          <span className="text-[10px] text-green-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Verified
          </span>
        )}
      </div>
      {title && <h4 className="text-white font-medium text-sm">{title}</h4>}
      <p className="text-white/70 text-sm mt-1 whitespace-pre-wrap">{text}</p>
      <div className="mt-3 flex items-center justify-between text-[11px] text-white/40 font-mono">
        <span>{author}</span>
        <span>{new Date(createdAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}
