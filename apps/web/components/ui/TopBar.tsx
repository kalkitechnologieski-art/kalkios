'use client'
import { Menu, Bell } from 'lucide-react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

export function TopBar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-black/90 backdrop-blur-2xl border-b border-cyan-500/20 flex items-center justify-between px-4 md:px-6">
      {/* Left: Menu with cyberpunk bracket */}
      <button
        onClick={onMenuClick}
        className="relative p-2 -ml-2 rounded-full hover:bg-white/5 transition group"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-cyan-400/60 group-hover:text-cyan-400 transition" />
        <span className="absolute -top-1 -left-1 w-2 h-2 border-t border-l border-cyan-400/30 opacity-0 group-hover:opacity-100 transition" />
        <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b border-r border-cyan-400/30 opacity-0 group-hover:opacity-100 transition" />
      </button>

      {/* Center: Logo + Brand with cyberpunk styling */}
      <Link href="/" className="flex items-center gap-3 group">
        {/* Logo Image */}
        <div className="relative w-10 h-10 flex-shrink-0">
          <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-xl group-hover:blur-2xl transition" />
          <Image
            src="/images/logo.svg"
            alt="KALKI OS"
            width={40}
            height={40}
            className="object-contain drop-shadow-[0_0_20px_rgba(0,255,255,0.3)]"
            priority
          />
        </div>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="flex flex-col leading-tight"
        >
          <span className="text-sm font-bold tracking-widest bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
            KALKI INTELLIGENCE
          </span>
          <span className="text-[8px] text-cyan-400/30 tracking-[0.3em] uppercase font-mono">
            ● TEMPLE OF TECHNOLOGY
          </span>
        </motion.div>
      </Link>

      {/* Right: Notifications */}
      <button className="relative p-2 rounded-full hover:bg-white/5 transition group">
        <Bell className="w-5 h-5 text-cyan-400/50 group-hover:text-cyan-400 transition" />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full border border-black animate-pulse" />
        <span className="absolute -top-1 -right-1 w-2 h-2 border-t border-r border-cyan-400/30 opacity-0 group-hover:opacity-100 transition" />
        <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b border-l border-cyan-400/30 opacity-0 group-hover:opacity-100 transition" />
      </button>
    </header>
  )
}
