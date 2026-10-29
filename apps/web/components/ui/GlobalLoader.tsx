'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// A non-blocking route indicator. The previous version covered the whole
// viewport for 2.7s on every navigation, which is exactly the "the site is
// slow" feeling it was meant to hide.
export function GlobalLoader() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clear = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = null;
  };

  const start = useCallback(() => {
    clear();
    setActive(true);
    // Safety net: a navigation that never lands must not strand the bar.
    hideTimer.current = setTimeout(() => setActive(false), 5000);
  }, []);

  const finish = useCallback(() => {
    clear();
    setActive(false);
  }, []);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest('a');
      if (!link) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || link.dataset.noProgress !== undefined) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;
      if (/^(mailto|tel):/.test(href)) return;
      if (/^https?:\/\//.test(href)) {
        try {
          if (new URL(href).origin !== window.location.origin) return;
        } catch {
          return;
        }
      }
      start();
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      clear();
    };
  }, [start]);

  useEffect(() => {
    finish();
  }, [pathname, finish]);

  if (!active) return null;
  return <div className="route-progress" role="progressbar" aria-label="Loading page" />;
}
