#!/usr/bin/env bash
# KALKI OS — Fix all remaining issues: DOM error, side menu scroll, SIDDHI button,
# login page, hiring link, favicon, service fetching, admin management.

set -euo pipefail

cd /d/kalkicore/apps/web || exit 1

# ================================================================
# 1. FIX DOM insertBefore error — single Suspense root
# ================================================================
cat > app/layout.tsx << 'EOF'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import { ScrollProvider } from '@/components/providers/ScrollProvider'
import { GSAPProvider } from '@/components/providers/GSAPProvider'
import { AppLayout } from '@/components/ui/AppLayout'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.kalki-intelligence.in'),
  title: { template: '%s | KALKI OS', default: 'KALKI OS — Temple of Technology' },
  description: 'Premium AI-powered digital services marketplace.',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="google" content="notranslate" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        {/* SINGLE SUSPENSE BOUNDARY — fixes insertBefore error */}
        <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F]" />}>
          <div className="app-root min-h-screen bg-[#0A0A0F]">
            <ScrollProvider>
              <GSAPProvider>
                <AppLayout>{children}</AppLayout>
              </GSAPProvider>
            </ScrollProvider>
          </div>
        </Suspense>
      </body>
    </html>
  )
}
EOF

# ================================================================
# 2. FIX SIDE MENU: scroll + hiring link
# ================================================================
cat > components/layout/SideMenu.tsx << 'EOF'
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
EOF

# ================================================================
# 3. SIMPLIFY BOTTOM NAV — SIDDHI as simple letters, no background
# ================================================================
cat > components/ui/BottomNav.tsx << 'EOF'
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Compass, ShoppingBag, User } from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Home', icon: Home, href: '/' },
  { label: 'Explore', icon: Compass, href: '/explore' },
  { label: 'Cart', icon: ShoppingBag, href: '/cart' },
  { label: 'Profile', icon: User, href: '/profile' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-black/90 backdrop-blur-2xl border-t border-cyan-500/10 flex items-center justify-around px-2 safe-area-bottom">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 w-12 h-full rounded-2xl transition relative group"
          >
            {isActive && (
              <motion.span
                layoutId="bottom-nav-indicator"
                className="absolute -top-px w-6 h-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-lg shadow-cyan-500/50"
              />
            )}
            <item.icon
              className={`w-5 h-5 transition ${
                isActive ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]' : 'text-white/30 group-hover:text-white/60'
              }`}
              strokeWidth={isActive ? 2.5 : 1.5}
            />
            <span className={`text-[8px] font-medium tracking-wider transition ${
              isActive ? 'text-cyan-400' : 'text-white/25'
            }`}>
              {item.label}
            </span>
          </Link>
        )
      })}

      {/* Simple SIDDHI text — no background, just letters */}
      <Link href="/chat" className="flex items-center justify-center w-16 h-full relative group">
        <motion.span
          className="text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.3)]"
          animate={{
            textShadow: [
              '0 0 15px rgba(0,255,255,0.3)',
              '0 0 30px rgba(0,255,255,0.5)',
              '0 0 15px rgba(0,255,255,0.3)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          whileHover={{ scale: 1.1 }}
        >
          SIDDHI
        </motion.span>
        <span className="absolute -top-1 right-0 w-2 h-2 bg-green-400 rounded-full shadow-[0_0_20px_rgba(0,255,0,0.5)] border border-black animate-pulse" />
      </Link>
    </nav>
  )
}
EOF

# ================================================================
# 4. ADD FAVICON — infinity symbol neon
# ================================================================
mkdir -p public
cat > public/favicon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <filter id="neon-glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <!-- Infinity symbol with neon cyan glow -->
  <text x="50" y="72" font-family="Arial, sans-serif" font-size="80" font-weight="bold" 
        text-anchor="middle" fill="none" stroke="#00FFFF" stroke-width="4" 
        filter="url(#neon-glow)">
    ∞
  </text>
</svg>
EOF

# Convert SVG to ICO if possible, else just use SVG
cat > public/favicon.ico << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <text x="50" y="72" font-family="Arial, sans-serif" font-size="80" font-weight="bold" text-anchor="middle" fill="none" stroke="#00FFFF" stroke-width="4">∞</text>
</svg>
EOF

# ================================================================
# 5. ADD SCROLLBAR-HIDE UTILITY TO GLOBALS.CSS
# ================================================================
if ! grep -q "scrollbar-hide" styles/globals.css; then
  echo "
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
.hover\\:scrollbar-thin:hover::-webkit-scrollbar { display: block; width: 4px; }
.hover\\:scrollbar-thumb-cyan-500\\/20:hover::-webkit-scrollbar-thumb { background: rgba(0,255,255,0.2); border-radius: 2px; }
" >> styles/globals.css
fi

# ================================================================
# 6. ENSURE LOGIN PAGE EXISTS
# ================================================================
# If login page is missing, create it
if [ ! -f app/login/page.tsx ]; then
  mkdir -p app/login
  cat > app/login/page.tsx << 'EOF'
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        const role = profile?.role || 'client'
        const routes: Record<string, string> = {
          ceo: '/admin', admin: '/admin', manager: '/admin',
          developer: '/employee', support: '/employee', hr: '/employee',
          employee: '/employee', client: '/dashboard',
        }
        router.push(routes[role] || '/')
      }
    }
    checkSession()
  }, [supabase, router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        const role = profile?.role || 'client'
        const routes: Record<string, string> = {
          ceo: '/admin', admin: '/admin', manager: '/admin',
          developer: '/employee', support: '/employee', hr: '/employee',
          employee: '/employee', client: '/dashboard',
        }
        router.push(routes[role] || '/')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-2xl animate-pulse" />
            <Image src="/images/logo.svg" alt="KALKI OS" width={96} height={96} className="object-contain relative z-10" priority />
          </div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
          KALKI OS
        </h1>
        <p className="text-cyan-400/40 text-sm font-mono tracking-wider">● SECURE ACCESS ●</p>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="text-left">
            <label className="text-cyan-400/60 text-xs font-mono tracking-wider">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="text-left">
            <label className="text-cyan-400/60 text-xs font-mono tracking-wider">PASSWORD</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/40 hover:text-cyan-400 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

          <LuxuryButton
            type="submit"
            variant="primary"
            size="lg"
            label={loading ? 'Signing in...' : 'Sign In'}
            icon={<LogIn className="w-4 h-4" />}
            iconPosition="right"
            fullWidth
            disabled={loading}
          />
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cyan-500/10" /></div>
          <div className="relative flex justify-center text-xs"><span className="px-2 bg-[#0A0A0F] text-cyan-400/30 font-mono">or</span></div>
        </div>

        <LuxuryButton
          variant="secondary"
          size="lg"
          label="Sign in with Google"
          icon={<Sparkles className="w-4 h-4" />}
          iconPosition="left"
          fullWidth
          onClick={handleGoogleLogin}
        />
      </div>
    </div>
  )
}
EOF
fi

# ================================================================
# 7. ENSURE SERVICES ARE FETCHED FROM SUPABASE (with fallback)
# ================================================================
# Already handled in lib/supabase/client.ts with demo data fallback.
# Admin management: we'll add a simple admin service management page.

mkdir -p app/admin/services
cat > app/admin/services/page.tsx << 'EOF'
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { Plus, Edit, Trash2, Check, X } from 'lucide-react'

export default function AdminServicesPage() {
  const { user, loading: authLoading } = useUser()
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const supabase = createClient()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchServices()
  }, [user, supabase])

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false })
    setServices(data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return
    await supabase.from('services').delete().eq('id', id)
    fetchServices()
  }

  const handleUpdate = async (id: string) => {
    await supabase.from('services').update(editData).eq('id', id)
    setEditingId(null)
    fetchServices()
  }

  if (authLoading || loading) return <div className="text-cyan-400/40 text-center py-20 font-mono">Loading...</div>
  if (!user) return <div className="text-center py-20"><a href="/login" className="text-cyan-400 hover:text-cyan-300">Sign in required</a></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white font-mono">Manage Services</h1>
        <LuxuryButton variant="primary" size="sm" label="Add Service" icon={<Plus className="w-4 h-4" />} />
      </div>
      <div className="bg-white/5 border border-cyan-500/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-cyan-500/10 text-cyan-400/60 text-xs font-mono uppercase tracking-wider">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price (₹)</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-t border-cyan-500/5 hover:bg-white/5">
                <td className="p-3">
                  {editingId === s.id ? (
                    <input value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="bg-black/40 border border-cyan-500/20 rounded px-2 py-1 text-white text-sm" />
                  ) : (
                    <span className="text-white text-sm font-mono">{s.name}</span>
                  )}
                </td>
                <td className="p-3 text-white/60 text-sm font-mono">{s.category}</td>
                <td className="p-3 text-white/60 text-sm font-mono">₹{s.price?.toLocaleString()}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  {editingId === s.id ? (
                    <>
                      <button onClick={() => handleUpdate(s.id)} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(s.id); setEditData(s) }} className="text-cyan-400/60 hover:text-cyan-400"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-400/60 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
EOF

# ================================================================
# 8. RUN TYPE CHECK AND BUILD
# ================================================================
npm run type-check
npm run build

echo "✅ All issues fixed! Start server: npm run dev"