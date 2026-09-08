'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, Compass, MessageCircle, User, ShoppingBag } from 'lucide-react';

const TABS = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Explore', icon: Compass, href: '/explore' },
  { label: 'Chat', icon: MessageCircle, href: '/chat', isSpecial: true },
  { label: 'Cart', icon: ShoppingBag, href: '/cart' },
  { label: 'Profile', icon: User, href: '/profile' },
];

export function BottomTabBar() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="h-16" />;

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-black/90 backdrop-blur-2xl border-t border-white/5 flex items-center justify-around px-2 safe-area-bottom">
      {TABS.map((tab) => {
        const active = isActive(tab.href);

        if (tab.isSpecial) {
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-col items-center justify-center w-14 h-full transition-transform duration-300 hover:scale-110 active:scale-95 group"
            >
              <motion.span
                className="text-xs font-black tracking-widest bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer"
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
                  layoutId="bottom-tab-indicator"
                  className="absolute -top-px w-8 h-0.5 rounded-full bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400"
                />
              )}
            </Link>
          );
        }

        const Icon = tab.icon;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="relative flex flex-col items-center justify-center w-12 h-full transition-all duration-300 hover:translate-y-[-2px] active:translate-y-[1px] group"
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 transition-all duration-300 ${
                  active
                    ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                    : 'text-white/30 group-hover:text-white/70'
                }`}
                strokeWidth={active ? 2.5 : 1.5}
              />
              {active && (
                <motion.div
                  layoutId="bottom-tab-glow"
                  className="absolute inset-[-8px] rounded-full bg-white/5 blur-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
            </div>
            <span className={`text-[8px] font-medium tracking-wider transition-all duration-300 ${
              active ? 'text-white' : 'text-white/25 group-hover:text-white/50'
            }`}>
              {tab.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
