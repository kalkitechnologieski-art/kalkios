'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useAuth'
import { LayoutDashboard, Users, Settings, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export function AdminSidebar() {
  const { user } = useUser()
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  if (!user) return null

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ]

  const toggleCollapse = () => setIsCollapsed(!isCollapsed)

  return (
    <aside
      className={cn(
        "bg-black/90 backdrop-blur-2xl border-r border-white/5 h-screen sticky top-0 transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Toggle button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-6 p-1 rounded-full bg-cyan-600/20 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-600/30 transition"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-4 h-4" />
      </button>

      {/* User profile */}
      <div className={cn(
        "flex items-center gap-3 p-4 border-b border-white/5",
        isCollapsed && "justify-center"
      )}>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
          {user.email?.[0]?.toUpperCase() || 'A'}
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <p className="text-white text-sm font-medium truncate">{user.email}</p>
            <p className="text-cyan-400/40 text-xs">Admin</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive
                  ? "bg-cyan-600/20 text-cyan-400 border border-cyan-500/20"
                  : "text-white/60 hover:bg-white/5 hover:text-white",
                isCollapsed && "justify-center px-0"
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-mono whitespace-nowrap">{item.label}</span>
              )}
              {isActive && !isCollapsed && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout button */}
      <div className="absolute bottom-4 left-0 right-0 px-3">
        <button
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition w-full",
            isCollapsed && "justify-center"
          )}
          title={isCollapsed ? "Logout" : undefined}
          onClick={() => {
            // import { createClient } from '@/lib/supabase/client'
            // const supabase = createClient()
            // supabase.auth.signOut()
            // window.location.href = '/login'
          }}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && <span className="text-sm font-mono">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
