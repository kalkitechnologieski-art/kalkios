'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, BellOff, CheckCheck, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '@/lib/hooks/useNotifications'
import { usePresence } from '@/lib/hooks/usePresence'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
  priority: 'low' | 'normal' | 'high' | 'critical'
  link?: string
  type: string
  metadata?: any
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch } = useNotifications()
  const { onlineUsers } = usePresence()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-400 border-red-500/30 bg-red-500/10'
      case 'high': return 'text-orange-400 border-orange-500/30 bg-orange-500/10'
      case 'normal': return 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10'
      default: return 'text-white/40 border-white/10 bg-white/5'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative p-2 rounded-full hover:bg-white/5 transition group"
      >
        {unreadCount > 0 ? (
          <>
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 blur-xl opacity-50 animate-pulse" />
            <Bell className="w-5 h-5 text-white/70 group-hover:text-white transition relative" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-r from-pink-500 to-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center shadow-lg shadow-red-500/30 animate-bounce">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <BellOff className="w-5 h-5 text-white/30 group-hover:text-white/50 transition relative" />
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
                  <div
                    key={notif.id}
                    className={cn(
                      'group relative flex items-start gap-3 p-4 border-b border-cyan-500/5 hover:bg-white/5 transition cursor-pointer',
                      !notif.read && 'bg-cyan-500/5'
                    )}
                    onClick={() => {
                      markAsRead(notif.id)
                      if (notif.link) window.location.href = notif.link
                    }}
                  >
                    <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border', getPriorityColor(notif.priority || 'normal'))}>
                      {/* Icon based on type */}
                      <span className="text-xs">
                        {notif.type === 'task' ? '📋' : notif.type === 'chat' ? '💬' : notif.type === 'project' ? '📁' : notif.type === 'meeting' ? '📅' : '📨'}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white text-sm font-mono font-medium truncate">
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-1.5 animate-pulse" />
                        )}
                      </div>
                      <p className="text-cyan-400/60 text-xs font-mono mt-0.5 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-cyan-400/20 text-[10px] font-mono mt-1">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
