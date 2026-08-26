'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderKanban, CheckSquare, Calendar, User, LogOut, Sparkles, Briefcase } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/employee' },
  { label: 'Projects', icon: FolderKanban, href: '/employee/projects' },
  { label: 'Tasks', icon: CheckSquare, href: '/employee/tasks' },
  { label: 'Timesheet', icon: Calendar, href: '/employee/timesheet' },
  { label: 'Profile', icon: User, href: '/employee/profile' },
]

export function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  const { user } = useUser()
  const [profile, setProfile] = useState<any>(null)

  // Simple profile fetch
  useState(() => {
    if (user) {
      supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => setProfile(data))
    }
  })

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  const isHR = profile?.role === 'hr'
  const navItems = isHR ? [...NAV_ITEMS, { label: 'Hiring', icon: Briefcase, href: '/employee/hiring' }] : NAV_ITEMS

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-[#0A0A0F]">
      <aside className={`relative bg-black/80 backdrop-blur-xl border-r border-cyan-500/10 transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'} flex-shrink-0`}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-4 w-6 h-6 bg-cyan-600/20 rounded-full border border-cyan-500/20 flex items-center justify-center text-cyan-400/60 hover:text-cyan-400 transition"
        >
          {collapsed ? '→' : '←'}
        </button>
        <div className="p-4 border-b border-cyan-500/10">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-2'}`}>
            <Sparkles className="w-5 h-5 text-cyan-400" />
            {!collapsed && <span className="text-white font-mono text-xs tracking-wider">EMPLOYEE</span>}
          </div>
        </div>
        <nav className="p-2 space-y-1">
          {navItems.map((item) => {
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
      <main className="flex-1 p-6 overflow-y-auto">{children}</main>
    </div>
  )
}
