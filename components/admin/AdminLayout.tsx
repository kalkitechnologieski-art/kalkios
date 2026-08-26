'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, FolderKanban, UserPlus, FileText, Settings, BarChart3,
  Briefcase, LogOut, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Projects', icon: FolderKanban, href: '/admin/projects' },
  { label: 'Employees', icon: UserPlus, href: '/admin/employees' },
  { label: 'Hiring', icon: Briefcase, href: '/admin/hiring' },
  { label: 'Leads', icon: FileText, href: '/admin/leads' },
  { label: 'Reports', icon: BarChart3, href: '/admin/reports' },
  { label: 'Settings', icon: Settings, href: '/admin/settings' },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#0A0A0F]">
      <aside className={`relative bg-black/80 backdrop-blur-xl border-r border-cyan-500/10 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'} flex-shrink-0`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-4 w-6 h-6 bg-cyan-600/20 rounded-full border border-cyan-500/20 flex items-center justify-center text-cyan-400/60 hover:text-cyan-400 transition"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
        <div className="p-4 border-b border-cyan-500/10">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
            <Sparkles className="w-5 h-5 text-cyan-400" />
            {!collapsed && <span className="text-white font-mono text-xs tracking-wider">ADMIN</span>}
          </div>
        </div>
        <nav className="p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg transition ${active ? 'bg-cyan-600/20 text-cyan-400' : 'text-white/60 hover:bg-white/5 hover:text-white'}`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-mono">{item.label}</span>}
              </Link>
            )
          })}
          <button
            onClick={handleLogout}
            className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} w-full px-3 py-2 rounded-lg text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition mt-4`}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="text-sm font-mono">Logout</span>}
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
