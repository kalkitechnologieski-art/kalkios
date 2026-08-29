'use client'

import { motion } from 'framer-motion'

export interface ActivityEvent {
  id: string
  message: string
  time: string
  type?: 'info' | 'success' | 'warning'
}

export interface ActivityFeedProps {
  events: ActivityEvent[]
  loading?: boolean
}

export function ActivityFeed({ events, loading = false }: ActivityFeedProps) {
  if (loading) {
    return (
      <div className="space-y-2 animate-pulse">
        <div className="h-8 bg-white/5 rounded" />
        <div className="h-8 bg-white/5 rounded" />
        <div className="h-8 bg-white/5 rounded" />
      </div>
    )
  }

  if (!events || events.length === 0) {
    return <div className="text-white/30 text-center py-8">No recent activity</div>
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
      {events.map((event, i) => (
        <motion.div
          key={event.id || i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-start gap-3 p-2 border-b border-white/5 text-sm"
        >
          <span className="text-cyan-400">●</span>
          <div>
            <span className="text-white/70">{event.message}</span>
            <span className="text-white/30 text-xs block">{event.time}</span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
