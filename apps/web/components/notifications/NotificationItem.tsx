'use client'

import { useNotifications } from '@/lib/hooks/useNotifications'
import type { Notification } from '@/types/notification'
import { Circle } from 'lucide-react'

const TYPE_ICONS: Record<string, string> = {
  welcome: '👋',
  token_milestone: '🎯',
  chat: '💬',
  project_update: '📁',
  system: '⚡',
  task: '📋',
}

export function NotificationItem({ notification }: { notification: Notification }) {
  const { markAsRead } = useNotifications()
  const icon = TYPE_ICONS[notification.type] || '📨'

  return (
    <div
      className={`flex items-start gap-3 p-4 border-b border-cyan-500/5 hover:bg-white/5 transition cursor-pointer ${
        !notification.read ? 'bg-cyan-500/5' : ''
      }`}
      onClick={() => markAsRead(notification.id)}
    >
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-600/20 flex items-center justify-center text-lg">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className="text-white text-sm font-mono font-medium truncate">
            {notification.title}
          </p>
          {!notification.read && (
            <Circle className="w-2 h-2 text-cyan-400 fill-cyan-400 flex-shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-cyan-400/60 text-xs font-mono mt-0.5">{notification.message}</p>
        <p className="text-cyan-400/20 text-[10px] font-mono mt-1">
          {new Date(notification.created_at).toLocaleDateString()} •{' '}
          {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  )
}
