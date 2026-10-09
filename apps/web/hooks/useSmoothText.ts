// ═══ SIDDHI B7 ═══
// Smooth, letter-by-letter reveal for streamed assistant text.
// SSE frames arrive in bursts; this decouples arrival (target) from paint
// (what we show), using an adaptive rAF so long backlog catches up without
// jumping. Grapheme-safe so emoji/CJK never render as broken surrogates.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

/** Split into user-perceived characters; falls back to code-point spread. */
function segment(input: string): string[] {
  if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
    try {
      const seg = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
      const out: string[] = [];
      for (const s of seg.segment(input)) out.push(s.segment);
      return out;
    } catch { /* fall through */ }
  }
  return Array.from(input);
}

/**
 * @param target   the full text known so far (grows as tokens stream in)
 * @param streaming whether the message is still streaming
 * @returns the currently-visible substring to render
 */
export function useSmoothText(target: string, streaming: boolean): string {
  const graphemes = useMemo(() => segment(target), [target]);
  const total = graphemes.length;

  const [shownCount, setShownCount] = useState(0);
  const shownRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);

  useEffect(() => {
    // Never let the pointer run past the current length.
    if (shownRef.current > total) {
      shownRef.current = total;
      setShownCount(total);
    }

    // Snap instantly when not streaming (final 'content' frame or history load).
    if (!streaming) {
      if (shownRef.current !== total) {
        shownRef.current = total;
        setShownCount(total);
      }
      return;
    }

    lastRef.current = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastRef.current) / 1000);
      lastRef.current = now;

      const backlog = total - shownRef.current;
      if (backlog > 0) {
        // Floor ~55 chars/s, plus proportional catch-up so bursts drain smoothly.
        const step = Math.max(1, Math.ceil(55 * dt + backlog * 0.18));
        shownRef.current = Math.min(total, shownRef.current + step);
        setShownCount(shownRef.current);
      }

      if (streaming && shownRef.current < total) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    if (shownRef.current < total && rafRef.current === null) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, streaming, total]);

  if (!streaming) return target;
  return graphemes.slice(0, shownCount).join('');
}
