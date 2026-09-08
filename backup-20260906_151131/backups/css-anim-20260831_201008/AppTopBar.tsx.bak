'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Bell, User } from 'lucide-react';
import Image from 'next/image';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { useUser } from '@/hooks/useAuth';

interface AppTopBarProps {
  onMenuClick: () => void;
}

export function AppTopBar({ onMenuClick }: AppTopBarProps) {
  const pathname = usePathname();
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

  const getPageTitle = () => {
    const path = pathname?.split('/')[1] || 'Home';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-black/90 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-1.5 rounded-full hover:bg-white/5 transition"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-white/70" />
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="relative w-7 h-7">
            <Image
              src="/images/logo.svg"
              alt="KALKI"
              width={28}
              height={28}
              className="object-contain"
              priority
            />
          </div>
          <span className="text-sm font-semibold text-white/90 hidden sm:block">
            KALKI
          </span>
        </Link>
      </div>

      <span className="text-sm font-mono text-white/60 tracking-wider hidden md:block">
        {getPageTitle()}
      </span>

      <div className="flex items-center gap-2">
        <NotificationBell />
        <Link href="/profile" className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-bold text-white hover:bg-white/20 transition">
          {displayName.charAt(0).toUpperCase()}
        </Link>
      </div>
    </header>
  );
}
