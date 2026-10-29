'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'framer-motion';

interface AnimatedNumberProps {
  to: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
}

const nf = new Intl.NumberFormat('en-IN');

// Counts up once, when the figure scrolls into view. Only used for numbers we
// actually commit to (quote turnaround, ₹0 to start) — never for invented proof.
export function AnimatedNumber({ to, prefix = '', suffix = '', duration = 1.1, className = '' }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [value, setValue] = useState(reduce ? to : 0);

  useEffect(() => {
    if (!inView || reduce) {
      if (reduce) setValue(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduce, to, duration]);

  return (
    <span ref={ref} className={className} suppressHydrationWarning>
      {prefix}
      {nf.format(value)}
      {suffix}
    </span>
  );
}
