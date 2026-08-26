'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Settings, HelpCircle, LogOut, Shield, Star, ShoppingBag, Home, Compass, Bot, FolderKanban } from 'lucide-react'
import Link from 'next/link'

export function SideDrawer({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-80 bg-black/90 backdrop-blur-2xl border-r border-white/5 p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold tracking-widest text-white/40">MENU</span>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-white/5 transition">
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-8 p-3 rounded-xl bg-gradient-to-br from-white/5 to-white/2 border border-white/5">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-600 to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-cyan-500/20">
                U
              </div>
              <div>
                <p className="text-white font-medium text-sm">Guest User</p>
                <p className="text-xs text-white/30">Tap to sign in</p>
              </div>
            </div>

            <nav className="space-y-1.5 flex-1">
              <SideMenuItem icon={Home} label="Home" href="/" onClose={onClose} />
              <SideMenuItem icon={Compass} label="Explore Services" href="/explore" onClose={onClose} />
              <SideMenuItem icon={ShoppingBag} label="Marketplace" href="/marketplace" onClose={onClose} />
              <SideMenuItem icon={FolderKanban} label="Client Panel" href="/client" onClose={onClose} />
              <SideMenuItem icon={Bot} label="Siddhi AI" href="/chat" onClose={onClose} />
              <div className="h-px bg-white/5 my-3" />
              <SideMenuItem icon={Settings} label="Settings" href="#" onClose={onClose} />
              <SideMenuItem icon={HelpCircle} label="Help & Support" href="#" onClose={onClose} />
              <SideMenuItem icon={Shield} label="Privacy" href="/privacy" onClose={onClose} />
              <SideMenuItem icon={Star} label="Rate Us" href="#" onClose={onClose} />
              <div className="h-px bg-white/5 my-3" />
              <SideMenuItem icon={LogOut} label="Logout" className="text-red-400" href="#" onClose={onClose} />
            </nav>

            <p className="text-[10px] text-white/10 text-center mt-4 tracking-widest">KALKI OS v3.0 · Quantum Engine</p>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

function SideMenuItem({ icon: Icon, label, href, className = '', onClose }: any) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className={`flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/5 transition group ${className}`}
    >
      <Icon className="w-5 h-5 text-white/40 group-hover:text-white transition" />
      <span className="text-sm font-medium text-white/70 group-hover:text-white transition">{label}</span>
    </Link>
  )
}
