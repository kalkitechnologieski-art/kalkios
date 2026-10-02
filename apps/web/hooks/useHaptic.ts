// == KALKI B5 LAUNCH ==
'use client';

import { useCallback } from 'react';

type Pattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'select';

const PATTERNS: Record<Pattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 50, 20],
  error: [30, 30, 30],
  select: 5,
};

export function useHaptic() {
  return useCallback((pattern: Pattern = 'light') => {
    if (typeof navigator === 'undefined') return;
    const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
    if (typeof nav.vibrate !== 'function') return;
    // Only on touch devices
    if (!('ontouchstart' in window)) return;
    try { nav.vibrate(PATTERNS[pattern]); } catch { /* ignore */ }
  }, []);
}
