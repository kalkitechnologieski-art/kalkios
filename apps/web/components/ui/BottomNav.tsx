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
