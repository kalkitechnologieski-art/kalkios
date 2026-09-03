'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { AppTopBar } from './AppTopBar';
import { BottomTabBar } from './BottomTabBar';
import { EnterpriseSidebar } from './EnterpriseSidebar';
import { cn } from '@/lib/utils';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();
  const isChatPage = pathname === '/chat';

  return (
    <div className="flex flex-col min-h-screen bg-black overflow-hidden">
      <AppTopBar onMenuClick={() => setIsDrawerOpen(!isDrawerOpen)} />

      <main className={cn(
        'flex-1 overflow-y-auto pt-14',
        isChatPage ? 'pb-0' : 'pb-20'
      )}>
        {children}
      </main>

      {!isChatPage && <BottomTabBar />}
      <EnterpriseSidebar isMobileOpen={isDrawerOpen} setMobileOpen={setIsDrawerOpen} />
    </div>
  );
}
