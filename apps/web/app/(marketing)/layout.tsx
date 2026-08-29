import { TopBar } from '@/components/layout/top-bar'
import { BottomNav } from '@/components/layout/bottom-nav'

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      <TopBar onMenuClick={() => {}} />
      <main className="flex-1">{children}</main>
      <BottomNav />
    </div>
  )
}
