'use client';

import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useUser } from '@/hooks/useAuth';

function AnimatedBrandLabel() {
  return (
    <Link href="/" aria-label="KALKI Intelligence home" className="group">
      <div className="relative flex items-center overflow-hidden rounded-full px-4 py-1.5 sm:px-5">
        {/* Breathing gradient glow */}
        <motion.div
          className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 blur-lg"
          animate={{ opacity: [0.3, 0.7, 0.3], scale: [0.95, 1.08, 0.95] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Hue-cycling border */}
        <motion.div
          className="absolute inset-0 rounded-full border"
          animate={{
            borderColor: [
              'rgba(6, 182, 212, 0.35)',
              'rgba(168, 85, 247, 0.35)',
              'rgba(236, 72, 153, 0.35)',
              'rgba(6, 182, 212, 0.35)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Shimmer sweep */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent"
          initial={{ x: '-120%' }}
          animate={{ x: '120%' }}
          transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 3.5, ease: 'linear' }}
        />

        <div className="relative flex items-baseline gap-1.5 sm:gap-2 whitespace-nowrap">
          <motion.span
            className="text-[13px] sm:text-sm font-bold tracking-[0.18em] bg-gradient-to-r from-cyan-300 via-blue-300 to-purple-400 bg-clip-text text-transparent"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            KALKI
          </motion.span>

          <motion.span
            className="w-1 h-1 rounded-full bg-cyan-400 self-center"
            animate={{ scale: [1, 1.6, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          <motion.span
            className="text-[10px] sm:text-xs font-medium tracking-[0.28em] text-white/70 group-hover:text-white/90 transition-colors"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            INTELLIGENCE
          </motion.span>
        </div>
      </div>
    </Link>
  );
}

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { user, loading } = useUser();
  const [displayName, setDisplayName] = useState('Guest');

  useEffect(() => {
    if (!loading && user) {
      const name = ((user.user_metadata?.full_name as string | undefined) || user.email?.split('@')[0] || 'User');
      setDisplayName(name);
    } else if (!loading) {
      setDisplayName('Guest');
    }
  }, [user, loading]);

  if (!mounted) {
    return <div className="h-14 bg-black/80" />;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-black/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-end px-4 md:px-6">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-full hover:bg-white/5 transition group md:hidden absolute left-3 top-1/2 -translate-y-1/2"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-white/70 group-hover:text-white transition" />
      </button>

      {/* Centered animated brand label — mobile + desktop */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <AnimatedBrandLabel />
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <Link href="/profile">
          <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white hover:bg-white/20 transition cursor-pointer shadow-glow">
            {displayName.charAt(0).toUpperCase()}
          </div>
        </Link>
      </div>
    </header>
  );
}
