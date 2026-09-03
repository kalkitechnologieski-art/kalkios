'use client';

import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useUser } from '@/hooks/useAuth';

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const { user, loading } = useUser();
  const [displayName, setDisplayName] = useState('Guest');

  useEffect(() => {
    if (!loading && user) {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
      setDisplayName(name);
    } else if (!loading) {
      setDisplayName('Guest');
    }
  }, [user, loading]);

  if (!mounted) {
    return <div className="h-14 bg-black/80" />;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 bg-black/80 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4 md:px-6">
      <button
        onClick={onMenuClick}
        className="p-2 -ml-2 rounded-full hover:bg-white/5 transition group md:hidden"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-white/70 group-hover:text-white transition" />
      </button>

      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative w-8 h-8">
          <Image
            src="/images/logo.svg"
            alt="KALKI OS"
            width={32}
            height={32}
            className="object-contain drop-shadow-glow group-hover:drop-shadow-glow-strong transition"
            priority
          />
        </div>
        <div className="flex flex-col leading-tight hidden sm:flex">
          <span className="text-sm font-semibold tracking-wider text-white/90 group-hover:text-white transition">
            KALKI INTELLIGENCE
          </span>
          <span className="text-[8px] text-white/30 tracking-[0.3em] uppercase font-mono">
            ● CYBERPUNK EDITION
          </span>
        </div>
      </Link>

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
