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
    <nav className="fixed bottom-0 left-0 right-0 z-40 h-20 bg-black/95 backdrop-blur-2xl border-t border-cyan-500/20 flex items-center justify-around px-2 safe-area-bottom">
      {/* Left side items */}
      <div className="flex items-center justify-around flex-1 max-w-[200px]">
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 w-14 h-full rounded-2xl transition relative group"
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-indicator-left"
                  className="absolute -top-0.5 w-6 h-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 shadow-lg shadow-cyan-500/50"
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
      </div>

      {/* Center 3D SIDDHI Button — Enterprise Grade with Depth Effect */}
      <Link href="/chat" className="relative -mt-8 z-50">
        <motion.div
          className="relative w-20 h-20 rounded-full bg-gradient-to-br from-cyan-600 via-purple-600 to-pink-600
                     shadow-[0_0_60px_rgba(0,255,255,0.4)] border-2 border-cyan-400/40
                     flex items-center justify-center cursor-pointer
                     transition-all duration-300 hover:shadow-[0_0_80px_rgba(0,255,255,0.6)] hover:scale-110
                     perspective-800"
          animate={{
            y: [0, -6, 0],
            boxShadow: [
              '0 0 40px rgba(0,255,255,0.3)',
              '0 0 70px rgba(0,255,255,0.5)',
              '0 0 40px rgba(0,255,255,0.3)',
            ],
          }}
          transition={{
            y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
            boxShadow: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
          }}
          whileHover={{ scale: 1.15, rotateY: 5 }}
          whileTap={{ scale: 0.92 }}
        >
          {/* 3D Depth Layers — Multi-layer shadow for depth effect */}
          {/* Layer 1: Deep shadow (bottom-right offset) */}
          <div className="absolute inset-0 rounded-full bg-black/30 blur-xl translate-y-3 translate-x-1 -z-10" />
          
          {/* Layer 2: Mid shadow */}
          <div className="absolute inset-0 rounded-full bg-black/20 blur-md translate-y-2 translate-x-0.5 -z-5" />

          {/* Layer 3: Inner glow ring */}
          <div className="absolute inset-1 rounded-full bg-gradient-to-br from-cyan-500/20 to-purple-500/20" />
          
          {/* Layer 4: Outer pulse ring */}
          <div className="absolute inset-[-6px] rounded-full border-2 border-cyan-400/20 animate-ping" />

          {/* 3D Text with perspective and depth — SIDDHI letters with extruded effect */}
          <div className="relative z-10 text-center leading-none perspective-500">
            <motion.span
              className="text-sm font-black tracking-widest text-transparent bg-clip-text 
                         bg-gradient-to-r from-cyan-300 via-purple-300 to-pink-300
                         block"
              style={{
                textShadow: `
                  0 0 20px rgba(0,255,255,0.6),
                  0 0 40px rgba(0,255,255,0.3),
                  2px 2px 0 rgba(0,0,0,0.5),
                  4px 4px 0 rgba(0,0,0,0.3),
                  6px 6px 0 rgba(0,0,0,0.1)
                `,
                transform: 'perspective(400px) rotateX(8deg) rotateY(-4deg) translateZ(10px)',
              }}
              animate={{
                textShadow: [
                  '0 0 20px rgba(0,255,255,0.6), 0 0 40px rgba(0,255,255,0.3), 2px 2px 0 rgba(0,0,0,0.5), 4px 4px 0 rgba(0,0,0,0.3), 6px 6px 0 rgba(0,0,0,0.1)',
                  '0 0 30px rgba(0,255,255,0.8), 0 0 60px rgba(0,255,255,0.4), 2px 2px 0 rgba(0,0,0,0.5), 4px 4px 0 rgba(0,0,0,0.3), 6px 6px 0 rgba(0,0,0,0.1)',
                  '0 0 20px rgba(0,255,255,0.6), 0 0 40px rgba(0,255,255,0.3), 2px 2px 0 rgba(0,0,0,0.5), 4px 4px 0 rgba(0,0,0,0.3), 6px 6px 0 rgba(0,0,0,0.1)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              SIDDHI
            </motion.span>
            {/* Subtle letter-by-letter depth highlight */}
            <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
              <span className="text-sm font-black tracking-widest text-white blur-[2px]">
                SIDDHI
              </span>
            </div>
          </div>

          {/* Scanline overlay */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/5 to-transparent animate-shimmer" />
          </div>

          {/* Active indicator dot */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-400 rounded-full
                         shadow-[0_0_20px_rgba(0,255,0,0.5)] border-2 border-black animate-pulse" />

          {/* Cyberpunk corner glints */}
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400/30 rounded-tl-lg" />
          <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400/30 rounded-tr-lg" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400/30 rounded-bl-lg" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400/30 rounded-br-lg" />
        </motion.div>
      </Link>

      {/* Right side items */}
      <div className="flex items-center justify-around flex-1 max-w-[200px]">
        {NAV_ITEMS.slice(2, 4).map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-0.5 w-14 h-full rounded-2xl transition relative group"
            >
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-indicator-right"
                  className="absolute -top-0.5 w-6 h-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg shadow-pink-500/50"
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
      </div>
    </nav>
  )
}
