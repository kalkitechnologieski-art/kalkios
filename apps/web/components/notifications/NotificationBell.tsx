'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { NotificationDropdown } from './NotificationDropdown'
import { motion, AnimatePresence } from 'framer-motion'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const { unreadCount, loading } = useNotifications()
  const containerRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-white/5 transition group"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <>
            <Bell className="w-5 h-5 text-white/70 group-hover:text-white transition" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center shadow-lg shadow-red-500/30">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <BellOff className="w-5 h-5 text-white/30 group-hover:text-white/50 transition" />
        )}
        {loading && (
          <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute top-full right-0 mt-2 w-96 max-h-[500px] z-50"
          >
            <NotificationDropdown isOpen={isOpen} onClose={() => setIsOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
