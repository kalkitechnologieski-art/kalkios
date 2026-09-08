// lib/hooks/usePresence.ts
'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'

export function usePresence() {
  const { user } = useUser()
  const supabase = createClient()
  const [status, setStatus] = useState<'online' | 'away' | 'offline'>('offline')
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const updatePresence = async (newStatus: 'online' | 'away' | 'offline') => {
    if (!user) return
    try {
      // @ts-ignore
      await supabase.from('user_presence').upsert({
        // @ts-ignore
        user_id: user.id,
        status: newStatus,
        last_seen: new Date().toISOString(),
        current_page: window.location.pathname,
        updated_at: new Date().toISOString(),
      })
      setStatus(newStatus)
    } catch (e) {
      console.warn('Presence update failed:', e)
    }
  }

  useEffect(() => {
    if (!user) return

    updatePresence('online')

    const channel = supabase
      .channel('presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, () => {
        const fetchPresence = async () => {
          // @ts-ignore
          const { data } = await supabase
            .from('user_presence')
            .select('user_id, status, last_seen')
            .eq('status', 'online')
          if (data) {
            const online = new Set(data.map((p: any) => p.user_id) as string[])
            setOnlineUsers(online)
          }
        }
        fetchPresence()
      })
      .subscribe()

    const fetchPresence = async () => {
      // @ts-ignore
      const { data } = await supabase
        .from('user_presence')
        .select('user_id, status, last_seen')
        .eq('status', 'online')
      if (data) {
        const online = new Set(data.map((p: any) => p.user_id) as string[])
        setOnlineUsers(online)
      }
    }
    fetchPresence()

    intervalRef.current = setInterval(() => {
      if (user && document.visibilityState === 'visible') {
        updatePresence('online')
      }
    }, 30000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence('online')
      } else {
        updatePresence('away')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const handleUnload = () => {
      updatePresence('offline')
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleUnload)
      channel.unsubscribe()
    }
  }, [user])

  return { status, onlineUsers }
}
