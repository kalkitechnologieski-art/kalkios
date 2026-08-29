'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  Compass,
  ShoppingBag,
  MessageSquare,
  Users,
  FolderKanban,
  Settings,
  HelpCircle,
  User,
  Briefcase,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

const NAV_ITEMS = [
  {
    category: 'Main',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
      { label: 'Explore', icon: Compass, href: '/explore' },
      { label: 'Marketplace', icon: ShoppingBag, href: '/marketplace' },
      { label: 'Chat', icon: MessageSquare, href: '/chat' },
    ],
  },
  {
    category: 'Workspace',
    items: [
      { label: 'Projects', icon: FolderKanban, href: '/dashboard' },
      { label: 'Team', icon: Users, href: '/team' },
      { label: 'Clients', icon: User, href: '/clients' },
    ],
  },
  {
    category: 'System',
    items: [
      { label: 'Hiring', icon: Briefcase, href: '/careers' },
      { label: 'Settings', icon: Settings, href: '/settings' },
      { label: 'Support', icon: HelpCircle, href: '/support' },
    ],
  },
]

const getVisibleItems = (role: string) => {
  const adminRoles = ['ceo', 'admin', 'manager', 'hr']
  if (adminRoles.includes(role)) return NAV_ITEMS
  return NAV_ITEMS.filter(group => group.category !== 'System')
}

export function SideMenu() {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (!mounted) return
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setIsCollapsed(saved === 'true')
  }, [mounted])

  useEffect(() => {
    if (!mounted) return
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').maybeSingle()
      setProfile(data)
    }
    fetchProfile()
  }, [supabase, mounted])

  const role = profile?.role || 'client'
  const visibleGroups = getVisibleItems(role)

  if (!mounted) return <div className="w-16 flex-shrink-0" />

  return (
    <motion.aside
      className="fixed top-16 left-0 bottom-0 z-30 bg-black/95 backdrop-blur-2xl border-r border-cyan-500/10 flex flex-col h-[calc(100vh-64px)]"
      animate={{
        width: isCollapsed || !hovered ? 56 : 200,
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Brand */}
      <div className={`flex items-center ${(isCollapsed && !hovered) ? 'justify-center' : 'px-3'} h-14 border-b border-cyan-500/10 flex-shrink-0`}>
        {(isCollapsed && !hovered) ? (
          <Image src="/images/logo.svg" alt="KALKI" width={28} height={28} />
        ) : (
          <div className="flex items-center gap-2">
            <Image src="/images/logo.svg" alt="KALKI" width={28} height={28} />
            <span className="text-white font-mono text-sm tracking-wider">KALKI OS</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 space-y-4 overflow-y-auto scrollbar-hide">
        {visibleGroups.map((group) => (
          <div key={group.category}>
            {!isCollapsed || hovered ? (
              <div className="px-3 mb-1">
                <span className="text-[10px] font-mono tracking-widest text-cyan-400/30 uppercase">
                  {group.category}
                </span>
              </div>
            ) : null}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 mx-1 h-10 rounded-lg transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 text-cyan-400 border border-cyan-500/20'
                        : 'text-white/60 hover:bg-white/10 hover:text-white'
                    } ${(isCollapsed && !hovered) ? 'justify-center' : 'px-3'}`}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    {(!isCollapsed || hovered) && (
                      <span className="text-sm font-mono truncate">{item.label}</span>
                    )}
                    {isActive && (!isCollapsed || hovered) && (
                      <span className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className={`border-t border-cyan-500/10 p-3 flex-shrink-0 ${(isCollapsed && !hovered) ? 'flex justify-center' : ''}`}>
        {(isCollapsed && !hovered) ? (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
              {profile?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="text-xs">
              <p className="text-white font-mono truncate max-w-[100px]">{profile?.full_name || 'User'}</p>
              <p className="text-cyan-400/30 text-[10px] font-mono truncate max-w-[100px]">{profile?.role || 'client'}</p>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  )
}
