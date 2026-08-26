'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setIsCollapsed(saved === 'true')
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('*').maybeSingle()
      setProfile(data)
    }
    fetchProfile()
  }, [supabase])

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  useEffect(() => setIsOpen(false), [pathname])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobile && isOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMobile, isOpen])

  const role = profile?.role || 'client'
  const visibleGroups = getVisibleItems(role)
  const allItems = visibleGroups.flatMap(g => g.items)

  // Mobile
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-black/80 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-600/20 transition"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <AnimatePresence>
          {isOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />
              <motion.div
                ref={menuRef}
                initial={{ x: -320 }}
                animate={{ x: 0 }}
                exit={{ x: -320 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 z-50 w-80 bg-black/95 backdrop-blur-2xl border-r border-cyan-500/10 p-4 overflow-y-auto scrollbar-hide"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Image src="/images/logo.svg" alt="KALKI OS" width={32} height={32} />
                    <span className="text-white font-mono text-sm tracking-wider">KALKI OS</span>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="text-cyan-400/60 hover:text-cyan-400">✕</button>
                </div>
                {renderNavItems(allItems, pathname, false, setHoveredIndex, null)}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    )
  }

  // Desktop
  return (
    <aside
      ref={menuRef}
      className={`
        fixed top-16 left-0 bottom-0 z-30
        bg-black/95 backdrop-blur-2xl border-r border-cyan-500/10
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-16' : 'w-64'}
        flex flex-col
        h-[calc(100vh-64px)]
      `}
      style={{ transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}
    >
      {/* Brand */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'px-4'} h-16 border-b border-cyan-500/10 flex-shrink-0`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <Image src="/images/logo.svg" alt="KALKI OS" width={28} height={28} />
            <span className="text-white font-mono text-sm tracking-wider">KALKI OS</span>
          </div>
        ) : (
          <Image src="/images/logo.svg" alt="KALKI OS" width={28} height={28} />
        )}
      </div>

      {/* Navigation — SCROLLABLE */}
      <nav
        className="
          flex-1 py-4 space-y-6
          overflow-y-auto scrollbar-hide
          hover:scrollbar-thin hover:scrollbar-thumb-cyan-500/20
        "
        style={{ minHeight: 0, height: '100%' }}
      >
        {visibleGroups.map((group) => (
          <div key={group.category}>
            {!isCollapsed && (
              <div className="px-4 mb-2">
                <span className="text-[10px] font-mono tracking-widest text-cyan-400/30 uppercase">
                  {group.category}
                </span>
              </div>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const globalIdx = allItems.indexOf(item)
                const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                const showTooltip = isCollapsed && hoveredIndex === globalIdx
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'}
                      h-11 mx-2 rounded-lg transition-all duration-200 cursor-pointer
                      ${isActive
                        ? 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 text-cyan-400 border border-cyan-500/20'
                        : 'text-white/60 hover:bg-white/10 hover:text-white hover:border hover:border-white/5'
                      }
                    `}
                    onMouseEnter={() => setHoveredIndex(globalIdx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
                    {!isCollapsed && <span className="text-sm font-mono truncate">{item.label}</span>}
                    {showTooltip && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-black/90 border border-cyan-500/20 rounded-lg text-white text-sm font-mono whitespace-nowrap shadow-xl z-50 pointer-events-none">
                        {item.label}
                        <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-black/90 border-l border-b border-cyan-500/20 rotate-45" />
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className={`border-t border-cyan-500/10 p-3 flex-shrink-0 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <div className="flex items-center justify-between w-full">
          {!isCollapsed ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white">
                  {profile?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-xs">
                  <p className="text-white font-mono truncate max-w-[100px]">{profile?.full_name || 'User'}</p>
                  <p className="text-cyan-400/30 text-[10px] font-mono truncate max-w-[100px]">{profile?.role || 'client'}</p>
                </div>
              </div>
              <button onClick={toggleCollapse} className="p-1.5 rounded-lg hover:bg-white/5 text-cyan-400/40 hover:text-cyan-400 transition">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            </>
          ) : (
            <button onClick={toggleCollapse} className="p-1.5 rounded-lg hover:bg-white/5 text-cyan-400/40 hover:text-cyan-400 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}

function renderNavItems(items: any[], pathname: string, collapsed: boolean, setHoveredIndex: any, hoveredIndex: any) {
  return items.map((item, idx) => {
    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
    const showTooltip = collapsed && hoveredIndex === idx
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`
          relative flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'}
          h-11 mx-2 rounded-lg transition-all duration-200 cursor-pointer
          ${isActive
            ? 'bg-gradient-to-r from-cyan-600/20 to-purple-600/20 text-cyan-400 border border-cyan-500/20'
            : 'text-white/60 hover:bg-white/10 hover:text-white hover:border hover:border-white/5'
          }
        `}
        onMouseEnter={() => setHoveredIndex(idx)}
        onMouseLeave={() => setHoveredIndex(null)}
      >
        <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-cyan-400' : ''}`} />
        {!collapsed && <span className="text-sm font-mono truncate">{item.label}</span>}
        {showTooltip && (
          <div className="absolute left-full ml-3 px-3 py-1.5 bg-black/90 border border-cyan-500/20 rounded-lg text-white text-sm font-mono whitespace-nowrap shadow-xl z-50 pointer-events-none">
            {item.label}
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-2 bg-black/90 border-l border-b border-cyan-500/20 rotate-45" />
          </div>
        )}
      </Link>
    )
  })
}
