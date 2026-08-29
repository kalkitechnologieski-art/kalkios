'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home,
  Compass,
  ShoppingBag,
  Bot,
  FolderKanban,
  Settings,
  LogOut,
  User as UserIcon,
  HelpCircle,
  Shield,
  Star,
  Briefcase,
  Users,
  LayoutDashboard,
  FileText,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Bell,
  BarChart3,
  CheckSquare,
  MessageSquare,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

// ── Types ──
interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
}

// ── Main Sidebar Component ──
export function Sidebar() {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)
  const supabase = createClient()

  // ── Fetch user and profile, and subscribe to real‑time changes ──
  useEffect(() => {
    let channel: any = null

    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, role')
            .eq('id', user.id)
            .single()
          setProfile(profile)
          // Subscribe to profile changes
          channel = supabase
            .channel(`profile:${user.id}`)
            .on('postgres_changes', {
              event: 'UPDATE',
              schema: 'public',
              table: 'profiles',
              filter: `id=eq.${user.id}`,
            }, (payload: { new: UserProfile }) => {
              setProfile(payload.new)
            })
            .subscribe()
        }
      } catch (e) {
        console.warn('Could not fetch user:', e)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    return () => {
      if (channel) channel.unsubscribe()
    }
  }, [])

  // ── Navigation Items (dynamically built based on role) ──
  const mainItems = [
    { label: 'Home', icon: Home, href: '/' },
    { label: 'Explore', icon: Compass, href: '/explore' },
    { label: 'Marketplace', icon: ShoppingBag, href: '/marketplace' },
    { label: 'Chat', icon: Bot, href: '/chat' },
  ]

  const clientItems = [
    { label: 'Client Dashboard', icon: LayoutDashboard, href: '/client' },
    { label: 'My Projects', icon: FolderKanban, href: '/client/projects' },
    { label: 'My Orders', icon: ShoppingBag, href: '/client/orders' },
    { label: 'Support', icon: MessageSquare, href: '/client/support' },
  ]

  const employeeItems = [
    { label: 'Employee Dashboard', icon: LayoutDashboard, href: '/employee' },
    { label: 'My Tasks', icon: CheckSquare, href: '/employee/tasks' },
    { label: 'Timesheet', icon: FileText, href: '/employee/timesheet' },
    { label: 'Team Chat', icon: MessageSquare, href: '/employee/chat' },
  ]

  const adminItems = [
    { label: 'Admin Dashboard', icon: LayoutDashboard, href: '/admin' },
    { label: 'Users', icon: Users, href: '/admin/users' },
    { label: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
    { label: 'Leads', icon: FileText, href: '/admin/leads' },
    { label: 'Projects', icon: FolderKanban, href: '/admin/projects' },
    { label: 'Services', icon: Sparkles, href: '/admin/services' },
    { label: 'Notifications', icon: Bell, href: '/admin/notifications' },
    { label: 'Analytics', icon: BarChart3, href: '/admin/analytics' },
  ]

  const bottomItems = [
    { label: 'Hiring', icon: Briefcase, href: '/careers' },
    { label: 'Settings', icon: Settings, href: '/settings' },
    { label: 'Support', icon: HelpCircle, href: '/support' },
    { label: 'Privacy', icon: Shield, href: '/privacy' },
  ]

  // ── Compute visible items based on role (reactive) ──
  const visibleItems = useMemo(() => {
    const role = profile?.role || 'client'
    const items = [...mainItems]

    if (user) {
      items.push(...clientItems)
    }

    if (['ceo', 'admin', 'manager', 'developer', 'support', 'hr', 'employee'].includes(role)) {
      items.push(...employeeItems)
    }

    if (['ceo', 'admin', 'manager'].includes(role)) {
      items.push(...adminItems)
    }

    return items
  }, [user, profile])

  // ── Check if a route is active ──
  const isActive = useCallback((href: string) => {
    if (href === '/') return pathname === '/'
    return pathname?.startsWith(href) ?? false
  }, [pathname])

  // ── Logout ──
  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  // ── Render Navigation Item ──
  const renderItem = (item: { label: string; icon: any; href: string }) => {
    const active = isActive(item.href)
    const Icon = item.icon

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200',
          'hover:bg-white/5 group',
          active
            ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-500/20 shadow-glow'
            : 'text-white/40 hover:text-white/70'
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={active ? 2 : 1.5} />
        <span className={cn(
          'text-sm font-mono transition-all duration-200 whitespace-nowrap',
          isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
        )}>
          {item.label}
        </span>
        {active && isExpanded && (
          <motion.span
            layoutId="sidebar-active-indicator"
            className="absolute left-0 w-0.5 h-6 bg-cyan-400 rounded-full"
          />
        )}
      </Link>
    )
  }

  // ── User Profile Section ──
  const renderProfile = () => {
    const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Guest'
    const avatar = profile?.avatar_url || null
    const isLoggedIn = !!user

    const profileLink = isLoggedIn ? '/profile' : '/login'

    return (
      <div className="flex items-center gap-3 px-3 py-2.5 border-b border-white/5 mb-2">
        <Link href={profileLink} className="flex items-center gap-3 flex-1 min-w-0 group">
          <div className="relative flex-shrink-0">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatar}
                alt={displayName}
                className="w-8 h-8 rounded-full border border-cyan-500/30 shadow-glow group-hover:border-cyan-400 transition"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-glow group-hover:shadow-glow-strong transition">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            {isLoggedIn && (
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border border-black" />
            )}
          </div>
          <div className={cn(
            'flex-1 min-w-0 transition-all duration-200',
            isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
          )}>
            <p className="text-white text-sm font-medium truncate group-hover:text-cyan-300 transition">
              {displayName}
            </p>
            <p className="text-[10px] text-cyan-400/50 font-mono truncate">
              {isLoggedIn ? (profile?.role || 'Client') : 'Guest'}
            </p>
          </div>
        </Link>
        {isLoggedIn && isExpanded && (
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/30 hover:text-red-400 transition"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  // ── Expand/Collapse ──
  const toggleExpand = () => setIsExpanded(!isExpanded)

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40 hidden md:flex flex-col',
        'bg-black/95 backdrop-blur-2xl border-r border-white/5',
        'transition-all duration-300 ease-in-out',
        isExpanded ? 'w-60' : 'w-16'
      )}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Brand / Logo */}
      <div className="flex items-center h-14 px-3 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-glow">
            KI
          </div>
          <span className={cn(
            'text-white font-mono text-sm font-semibold transition-all duration-200 whitespace-nowrap',
            isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden'
          )}>
            KALKI OS
          </span>
        </Link>
      </div>

      {/* User Profile */}
      {renderProfile()}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1 scrollbar-hide">
        {visibleItems.map(renderItem)}
      </nav>

      {/* Bottom Items */}
      <div className="border-t border-white/5 pt-2 px-2 space-y-1">
        {bottomItems.map(renderItem)}
      </div>

      {/* Footer */}
      <div className={cn(
        'px-3 py-2 text-[8px] text-white/20 font-mono tracking-widest transition-all duration-200 border-t border-white/5',
        isExpanded ? 'opacity-100' : 'opacity-0'
      )}>
        KALKI OS v3.0
      </div>
    </aside>
  )
}

export default Sidebar
