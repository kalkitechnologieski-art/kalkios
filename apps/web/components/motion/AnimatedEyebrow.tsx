'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#$%&*+<>/';

// Decodes left-to-right: every glyph is random until its slot resolves, so the
// label looks like it is being computed rather than painted.
function useScramble(target: string, start: boolean, enabled: boolean): string {
  const [out, setOut] = useState(enabled && !start ? target : target);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled || !start) {
      setOut(target);
      return;
    }
    const total = target.length;
    const perChar = 34;
    let tick = 0;
    const step = () => {
      tick += 1;
      const resolved = Math.floor(tick / 2);
      if (resolved >= total) {
        setOut(target);
        return;
      }
      const next = target
        .split('')
        .map((ch, i) => {
          if (ch === ' ') return ' ';
          if (i < resolved) return ch;
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join('');
      setOut(next);
      frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, start, enabled]);

  return out;
}

interface AnimatedEyebrowProps {
  label: string;
  className?: string;
  scramble?: boolean;
  icon?: React.ReactNode;
}

export function AnimatedEyebrow({ label, className = '', scramble = true, icon }: AnimatedEyebrowProps) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const text = useScramble(label.toUpperCase(), inView, scramble && !reduce);

  const HUES = [
    'color-mix(in oklab, var(--kalki-brand-a) 45%, transparent)',
    'color-mix(in oklab, var(--kalki-brand-b) 45%, transparent)',
    'color-mix(in oklab, var(--kalki-brand-c) 45%, transparent)',
  ];
  const restingBorder = HUES[0];

  return (
    <motion.span
      ref={ref}
      className={`relative inline-flex items-center gap-2 overflow-hidden rounded-full border bg-white/5 px-3.5 py-1.5 backdrop-blur-sm ${className}`}
      initial={reduce ? { opacity: 1, y: 0, borderColor: restingBorder } : { opacity: 0, y: 8, borderColor: restingBorder }}
      animate={
        reduce
          ? { opacity: 1, y: 0, borderColor: restingBorder }
          : { opacity: 1, y: 0, borderColor: [HUES[0], HUES[1], HUES[2], HUES[0]] }
      }
      transition={
        reduce
          ? { duration: 0 }
          : {
              default: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
              borderColor: { duration: 6, repeat: Infinity, ease: 'linear' },
            }
      }
    >
      {icon ? <span className="relative z-10 flex text-[var(--kalki-brand-a)]">{icon}</span> : null}
      {!reduce ? (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 w-1/3"
          style={{
            backgroundImage:
              'linear-gradient(90deg, transparent, color-mix(in oklab, var(--kalki-brand-a) 38%, transparent), transparent)',
          }}
          initial={{ x: '-140%' }}
          animate={{ x: '320%' }}
          transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 4, ease: 'easeInOut' }}
        />
      ) : null}
      <span className="relative z-10 font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-white/80 sm:text-[11px]">
        {text}
      </span>
    </motion.span>
  );
}
