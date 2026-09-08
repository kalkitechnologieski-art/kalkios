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
      await supabase.from('user_presence').upsert({
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

    // Initial status
    updatePresence('online')

    // ✅ Correct order: .on() before .subscribe()
    const channel = supabase
      .channel('presence')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, () => {
        // Refetch all presence to update the list
        const fetchPresence = async () => {
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
      .subscribe((status: 'SUBSCRIBED' | 'CHANNEL_ERROR' | 'TIMED_OUT' | 'CLOSED') => {
        if (status === 'SUBSCRIBED') {
          console.log('📡 Presence channel subscribed')
        } else {
          console.warn('📡 Presence channel status:', status)
        }
      })

    // Fetch initial presence
    const fetchPresence = async () => {
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

    // Heartbeat: update last_seen every 30 seconds
    intervalRef.current = setInterval(() => {
      if (user && document.visibilityState === 'visible') {
        updatePresence('online')
      }
    }, 30000)

    // Page visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence('online')
      } else {
        updatePresence('away')
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Before unload
    const handleUnload = () => {
      updatePresence('offline')
    }
    window.addEventListener('beforeunload', handleUnload)

    return () => {
      clearInterval(intervalRef.current!)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleUnload)
      channel.unsubscribe()
    }
  }, [user])

  return { status, onlineUsers }
}
