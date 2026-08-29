'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface LuxuryMessageProps {
  children: ReactNode
  role: 'user' | 'assistant'
  timestamp?: Date
  className?: string
  isStreaming?: boolean
}

export function LuxuryMessage({
  children,
  role,
  timestamp,
  className = '',
  isStreaming = false,
}: LuxuryMessageProps) {
  return (
    <motion.div
      className={cn(
        `max-w-[85%] rounded-2xl px-4 py-3 relative`,
        role === 'user'
          ? 'ml-auto bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/20 text-white shadow-[0_0_30px_rgba(0,255,255,0.05)]'
          : 'bg-white/5 border border-white/10 text-white/90 backdrop-blur-sm',
        isStreaming && 'border-cyan-500/40',
        className
      )}
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      {children}
      {timestamp && (
        <div className="text-[10px] text-white/30 mt-1 text-right">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
    </motion.div>
  )
}
