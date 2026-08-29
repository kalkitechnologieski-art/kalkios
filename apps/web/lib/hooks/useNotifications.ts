'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification, NotificationPreferences } from '@/types/notification'

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchNotifications = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      
      if (data) {
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => !n.read).length)
      }
    } catch (e) {
      console.warn('Could not fetch notifications:', e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchNotifications()

    // Build channel with all callbacks before subscribing
    let channel: any = null
    try {
      if (typeof supabase.channel === 'function') {
        channel = supabase
          .channel('notifications-changes')
          .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'notifications' },
            (payload: any) => {
              const newNotif = payload.new as Notification
              setNotifications(prev => [newNotif, ...prev])
              if (!newNotif.read) {
                setUnreadCount(prev => prev + 1)
              }
            }
          )
          .subscribe()
      } else {
        console.log('Realtime not available — using polling fallback')
      }
    } catch (e) {
      console.warn('Could not subscribe to realtime:', e)
    }

    return () => {
      if (channel && typeof channel.unsubscribe === 'function') {
        channel.unsubscribe()
      }
    }
  }, [fetchNotifications, supabase])

  const markAsRead = useCallback(async (id: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
    
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
    setUnreadCount(prev => Math.max(0, prev - 1))
  }, [supabase])

  const markAllAsRead = useCallback(async () => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('read', false)
    
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    )
    setUnreadCount(0)
  }, [supabase])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  }
}

export function useNotificationPreferences() {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchPreferences = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('notification_preferences')
        .select('*')
        .single()
      setPreferences(data)
    } catch (e) {
      console.warn('Could not fetch preferences:', e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchPreferences()
  }, [fetchPreferences])

  const updatePreference = useCallback(async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return
    await supabase
      .from('notification_preferences')
      .update({ [key]: value, updated_at: new Date().toISOString() })
      .eq('id', preferences.id)
    
    setPreferences(prev => prev ? { ...prev, [key]: value } : null)
  }, [preferences, supabase])

  return {
    preferences,
    loading,
    updatePreference,
    refresh: fetchPreferences,
  }
}

export function useTokenUsage() {
  const [tokens, setTokens] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchTokenUsage = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('user_token_usage')
        .select('tokens_used')
        .single()
      setTokens(data?.tokens_used || 0)
    } catch (e) {
      console.warn('Could not fetch token usage:', e)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchTokenUsage()
  }, [fetchTokenUsage])

  return { tokens, loading, refresh: fetchTokenUsage }
}
