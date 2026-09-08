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
            className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-black/95 backdrop-blur-2xl border-r border-border p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-6">
              <span className="text-xs font-bold tracking-widest text-text-muted">MENU</span>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-secondary transition hover:rotate-90 duration-300">
                <X className="w-5 h-5 text-text-tertiary" />
              </button>
            </div>

            <div className="flex items-center gap-3 mb-8 p-3 rounded-xl glass border-border">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-lg font-bold text-white shadow-glow">
                U
              </div>
              <div>
                <p className="text-text font-medium text-sm">Guest User</p>
                <p className="text-xs text-text-muted">Tap to sign in</p>
              </div>
            </div>

            <nav className="space-y-1.5 flex-1">
              <SideMenuItem icon={Home} label="Home" href="/" onClose={onClose} />
              <SideMenuItem icon={Compass} label="Explore Services" href="/explore" onClose={onClose} />
              <SideMenuItem icon={ShoppingBag} label="Marketplace" href="/marketplace" onClose={onClose} />
              <SideMenuItem icon={FolderKanban} label="Client Panel" href="/client" onClose={onClose} />
              <SideMenuItem icon={Bot} label="Siddhi AI" href="/chat" onClose={onClose} />
              <div className="h-px bg-border my-3" />
              <SideMenuItem icon={Settings} label="Settings" href="/settings" onClose={onClose} />
              <SideMenuItem icon={HelpCircle} label="Help & Support" href="/support" onClose={onClose} />
              <SideMenuItem icon={Shield} label="Privacy" href="/privacy" onClose={onClose} />
              <SideMenuItem icon={Star} label="Rate Us" href="#" onClose={onClose} />
              <div className="h-px bg-border my-3" />
              <SideMenuItem icon={LogOut} label="Logout" className="text-red-400" href="#" onClose={onClose} />
            </nav>

            <p className="text-[10px] text-text-muted text-center mt-4 tracking-widest">KALKI OS v3.0 · Quantum Engine</p>
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
      className={`flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-secondary transition group hover:translate-x-1 duration-200 ${className}`}
    >
      <Icon className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary transition" />
      <span className="text-sm font-medium text-text-tertiary group-hover:text-text-secondary transition">{label}</span>
    </Link>
  )
}
