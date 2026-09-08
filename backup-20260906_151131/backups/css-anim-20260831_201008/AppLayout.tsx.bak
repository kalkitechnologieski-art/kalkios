'use client';

import { useState } from 'react';
import { EnterpriseSidebar } from '@/components/layout/EnterpriseSidebar';
import { TopBar } from '@/components/layout/top-bar';
import { BottomNav } from '@/components/layout/bottom-nav';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-black">
      <EnterpriseSidebar isMobileOpen={isMobileOpen} setMobileOpen={setIsMobileOpen} />
      <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 ml-0 md:ml-[64px]">
        <TopBar onMenuClick={() => setIsMobileOpen(!isMobileOpen)} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto pb-20 md:pb-6">
          {children}
        </main>
        <BottomNav />
      </div>
    </div>
  );
}
