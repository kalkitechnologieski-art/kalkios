'use client'

import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications, Notification } from '@/lib/hooks/useNotifications'  // ✅ import type from our hook
import { NotificationItem } from './NotificationItem'
import { CheckCheck, BellOff } from 'lucide-react'

export function NotificationDropdown({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { notifications, unreadCount, markAllAsRead, loading } = useNotifications()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute top-full right-0 mt-2 w-96 max-h-[500px] bg-black/95 backdrop-blur-2xl border border-cyan-500/10 rounded-2xl shadow-2xl shadow-cyan-500/10 overflow-hidden z-50"
        >
          <div className="flex items-center justify-between p-4 border-b border-cyan-500/10">
            <div className="flex items-center gap-2">
              <span className="text-white font-mono text-sm font-bold">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-gradient-to-r from-pink-500 to-purple-500 text-white px-2 py-0.5 rounded-full font-mono">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-cyan-400/60 hover:text-cyan-400 flex items-center gap-1 transition font-mono"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto max-h-[400px] scrollbar-hide">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-cyan-400/30">
                <BellOff className="w-10 h-10 mb-2" />
                <p className="text-sm font-mono">No notifications</p>
              </div>
            ) : (
              notifications.map((notif: Notification) => (
                <NotificationItem key={notif.id} notification={notif} />
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
