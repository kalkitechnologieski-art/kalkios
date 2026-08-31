'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Compass, ShoppingBag, User, Bot } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Explore', icon: Compass, href: '/explore' },
  { label: 'SIDDHI', icon: Bot, href: '/chat', isSpecial: true },
  { label: 'Cart', icon: ShoppingBag, href: '/cart' },
  { label: 'Profile', icon: User, href: '/profile' },
];

function BottomNavContent() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-[72px]" />;
  }

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-[72px] bg-black/90 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-2 safe-area-bottom">
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);

        if (item.isSpecial) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-col items-center justify-center w-16 h-full transition-transform duration-300 hover:scale-110 active:scale-95 group"
            >
              <motion.span
                className="text-sm font-black tracking-widest bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer"
                animate={{
                  scale: active ? 1.1 : 1,
                  opacity: active ? 1 : 0.6,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                SIDDHI
              </motion.span>
              {active && (
                <motion.span
                  layoutId="bottom-nav-indicator"
                  className="absolute -top-px w-8 h-0.5 rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
                />
              )}
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="group relative flex flex-col items-center justify-center w-12 h-full transition-all duration-300 hover:translate-y-[-2px] active:translate-y-[1px]"
          >
            <div className="relative">
              <item.icon
                className={`w-5 h-5 transition-all duration-300 ${
                  active
                    ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                    : 'text-white/30 group-hover:text-white/70 group-hover:drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                }`}
                strokeWidth={active ? 2.5 : 1.5}
              />
              {active && (
                <motion.div
                  layoutId="bottom-nav-glow"
                  className="absolute inset-[-8px] rounded-full bg-white/5 blur-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
            </div>
            <span
              className={`text-[8px] font-medium tracking-wider transition-all duration-300 ${
                active ? 'text-white' : 'text-white/25 group-hover:text-white/50'
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

export function BottomNav() {
  return (
    <Suspense fallback={<div className="h-[72px]" />}>
      <BottomNavContent />
    </Suspense>
  );
}
