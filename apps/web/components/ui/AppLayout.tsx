'use client';

import { useState } from 'react';
import { EnterpriseSidebar } from '@/components/layout/EnterpriseSidebar';
import { TopBar } from '@/components/layout/top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const isChatPage = pathname === '/chat';

  return (
    <div className="min-h-screen bg-black">
      {/* Sidebar – fixed, highest z-index */}
      <EnterpriseSidebar isMobileOpen={isMobileOpen} setMobileOpen={setIsMobileOpen} />

      {/* Top Bar – fixed, below sidebar */}
      <TopBar onMenuClick={() => setIsMobileOpen(!isMobileOpen)} />

      {/* Main content – offset by top bar and sidebar */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300",
          // Top bar offset (56px = h-14)
          "pt-14",
          // Sidebar offset on desktop (64px)
          "md:ml-[64px]",
          // Bottom nav offset (72px) – only if not chat page
          !isChatPage && "pb-[72px]"
        )}
      >
        {children}
      </main>

      {/* Bottom Navigation – fixed at bottom, only on non-chat pages */}
      {!isChatPage && <BottomNav />}
    </div>
  );
}
