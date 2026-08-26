'use client'
import { useState } from 'react'
import { TopBar } from './TopBar'
import { BottomNav } from './BottomNav'
import { SideDrawer } from './SideDrawer'
import { usePathname } from 'next/navigation'

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const pathname = usePathname()
  const isAuthPage = pathname?.startsWith('/login') || pathname?.startsWith('/callback')

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      {/* Full-width layout — no max-width constraint */}
      <div className="relative w-full min-h-screen bg-[#0A0A0F] overflow-hidden flex flex-col">
        {!isAuthPage && <TopBar onMenuClick={() => setIsDrawerOpen(true)} />}
        <main
          className={`flex-1 overflow-y-auto scroll-smooth ${
            !isAuthPage ? 'pt-16 pb-20' : ''
          }`}
        >
          <div className="px-4 md:px-8 lg:px-12 py-4 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
        {!isAuthPage && <BottomNav />}
        <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      </div>
    </div>
  )
}
