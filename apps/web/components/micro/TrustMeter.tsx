// == KALKI B5 LAUNCH ==
'use client';

import { cn } from '@/lib/utils';

interface Props {
  confidence?: number;
  sourcesCount?: number;
  provider?: string;
}

export function TrustMeter({ confidence = 0.75, sourcesCount = 0, provider }: Props) {
  const pct = Math.round(confidence * 100);
  const tone =
    confidence > 0.8 ? 'text-green-400 border-green-500/20 bg-green-500/5'
    : confidence > 0.5 ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5'
    : 'text-red-400 border-red-500/20 bg-red-500/5';

  return (
    <div className={cn('inline-flex items-center gap-2 px-2 py-0.5 rounded-full border text-[10px] font-mono', tone)}>
      <span>{pct}% confidence</span>
      {sourcesCount > 0 && (
        <>
          <span className="opacity-30">·</span>
          <span>{sourcesCount} source{sourcesCount === 1 ? '' : 's'}</span>
        </>
      )}
      {provider && (
        <>
          <span className="opacity-30">·</span>
          <span className="opacity-60">{provider}</span>
        </>
      )}
    </div>
  );
}
