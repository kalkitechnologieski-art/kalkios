'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home, Compass, ShoppingBag, Bot, FolderKanban,
  Settings, LogOut, User as UserIcon, HelpCircle,
  LayoutDashboard, Users, FileText, Briefcase, UserPlus,
  CheckSquare, Clock, GraduationCap, Sparkles,
  Mail, Building
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string }>
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Explore', icon: Compass, href: '/explore' },
  { label: 'Marketplace', icon: ShoppingBag, href: '/marketplace' },
  { label: 'SIDDHI', icon: Bot, href: '/chat' },
  { label: 'Dashboard', icon: FolderKanban, href: '/dashboard' },
  { label: 'Profile', icon: UserIcon, href: '/profile' },
  { label: 'Settings', icon: Settings, href: '/settings' },
  { label: 'Contact', icon: Mail, href: '/contact' },
  { label: 'About', icon: Building, href: '/about' },
  { label: 'Support', icon: HelpCircle, href: '/support' },
]

const ADMIN_ITEMS: NavItem[] = [
  { label: 'Admin Panel', icon: LayoutDashboard, href: '/admin' },
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'Leads', icon: FileText, href: '/admin/leads' },
  { label: 'Hiring', icon: Briefcase, href: '/admin/hiring' },
]

const EMPLOYEE_ITEMS: NavItem[] = [
  { label: 'My Tasks', icon: CheckSquare, href: '/employee/tasks' },
  { label: 'Timesheet', icon: Clock, href: '/employee/timesheet' },
]

const HR_ITEMS: NavItem[] = [
  { label: 'Hiring', icon: UserPlus, href: '/employee/hiring' },
]

export function Sidebar() {
  // Mount guard – prevents hydration mismatch
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  const [isHovered, setIsHovered] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<{ role: string; full_name?: string } | null>(null)

  useEffect(() => {
    if (!mounted) return
    if (!supabase.auth || typeof supabase.auth.getUser !== 'function') return
    supabase.auth.getUser()
      .then(({ data }: { data: { user: SupabaseUser | null } }) => {
        if (data?.user) {
          setUser(data.user)
          supabase.from('profiles').select('role, full_name').eq('id', data.user.id).single()
            .then(({ data }: { data: { role: string; full_name: string } | null }) => setProfile(data))
        }
      })
      .catch(() => {})
  }, [mounted, supabase])

  const role = profile?.role || 'client'
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Guest'

  const items = (() => {
    const base = [...NAV_ITEMS]
    if (['ceo', 'admin', 'manager'].includes(role)) base.push(...ADMIN_ITEMS)
    if (['employee', 'developer', 'support'].includes(role)) base.push(...EMPLOYEE_ITEMS)
    if (role === 'hr') base.push(...HR_ITEMS)
    const seen = new Set()
    return base.filter(item => {
      if (seen.has(item.href)) return false
      seen.add(item.href)
      return true
    })
  })()

  const collapsedWidth = 64
  const expandedWidth = 240

  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/')

  if (!mounted) {
    return <div className="w-16" />
  }

  return (
    <motion.aside
      className="fixed top-14 left-0 bottom-0 z-40 bg-black/80 backdrop-blur-xl border-r border-white/5 flex flex-col"
      initial={false}
      animate={{ width: isHovered ? expandedWidth : collapsedWidth }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center h-14 px-3 border-b border-white/5 flex-shrink-0 overflow-hidden">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-400 to-purple-600 flex items-center justify-center text-xs font-bold text-white shrink-0 shadow-glow">
            {displayName.charAt(0).toUpperCase()}
          </div>
          {isHovered && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-mono text-white/80 truncate"
            >
              {displayName}
            </motion.span>
          )}
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-4 scrollbar-hide">
        <ul className="space-y-1">
          {items.map((item) => {
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex items-center rounded-xl px-3 py-2.5 transition-all duration-200',
                    'hover:bg-white/5 group',
                    active ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white',
                    'rgb-border-hover',
                    active && 'active'
                  )}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {isHovered && (
                    <motion.span
                      initial={{ opacity: 0, x: -4 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="ml-3 text-sm font-mono whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                  {isHovered && active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-glow" />
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-white/5 p-2 flex-shrink-0">
        <button
          onClick={async () => {
            if (supabase.auth && typeof supabase.auth.signOut === 'function') {
              await supabase.auth.signOut()
            }
            window.location.href = '/login'
          }}
          className="flex items-center w-full rounded-xl px-3 py-2.5 text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition group rgb-border-hover"
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {isHovered && (
            <motion.span
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              className="ml-3 text-sm font-mono whitespace-nowrap"
            >
              Logout
            </motion.span>
          )}
        </button>
      </div>
    </motion.aside>
  )
}
