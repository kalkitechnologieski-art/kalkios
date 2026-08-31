"use client";

import { EnterpriseSidebar } from "@/components/layout/EnterpriseSidebar";
import { TopBar } from "@/components/layout/top-bar";
import { BottomNav } from "@/components/layout/bottom-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* ─── Top Bar ─── */}
      <TopBar onMenuClick={() => {}} />

      {/* ─── Main Content Area with Sidebar ─── */}
      <div className="flex h-[calc(100vh-56px)] mt-14">
        {/* Only ONE sidebar – EnterpriseSidebar */}
        <EnterpriseSidebar />

        {/* Main content – scrollable, with bottom nav spacing */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-6 px-4 md:px-6 lg:px-8 pt-4">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* ─── Bottom Nav ─── */}
      <BottomNav />
    </div>
  );
}
