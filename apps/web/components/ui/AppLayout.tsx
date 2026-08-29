'use client'

import { useState, Suspense } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'
import { SideDrawer } from '@/components/ui/SideDrawer'
import { GlobalErrorHandler } from './GlobalErrorHandler'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  return (
    <GlobalErrorHandler>
      <div className="min-h-screen bg-black flex flex-col">
        <TopBar onMenuClick={() => setIsDrawerOpen(true)} />

        <div className="flex flex-1">
          <div className="hidden md:block">
            <Suspense fallback={<div className="w-16" />}>
              <Sidebar />
            </Suspense>
          </div>

          <main className="flex-1 min-h-screen ml-0 md:ml-16 transition-all duration-300 p-4 md:p-6 lg:p-8 overflow-y-auto pb-20 md:pb-6">
            <Suspense fallback={<div className="text-white/40 text-center py-20">Loading...</div>}>
              {children}
            </Suspense>
          </main>
        </div>

        <Suspense fallback={null}>
          <BottomNav />
        </Suspense>

        <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      </div>
    </GlobalErrorHandler>
  )
}
