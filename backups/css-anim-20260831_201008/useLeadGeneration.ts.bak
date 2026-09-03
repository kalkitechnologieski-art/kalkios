'use client'

import { useCallback, useRef, useEffect } from 'react'
import { useLeadStore } from '@/store/leadStore'
import { createClient } from '@/lib/supabase/client'
import type { LeadSearchParams, Lead, LeadSearchSession } from '@/types/lead'

export function useLeadGeneration() {
  const {
    leads,
    session,
    isProcessing,
    progress,
    error,
    addLead,
    setSession,
    setIsProcessing,
    setProgress,
    setError,
    reset,
  } = useLeadStore()
  const supabase = createClient()

  const subscriptionsRef = useRef<{ channel: any; sessionChannel: any } | null>(null)

  useEffect(() => {
    return () => {
      if (subscriptionsRef.current) {
        subscriptionsRef.current.channel.unsubscribe()
        subscriptionsRef.current.sessionChannel.unsubscribe()
        subscriptionsRef.current = null
      }
    }
  }, [])

  const startSearch = useCallback(async (params: LeadSearchParams): Promise<void> => {
    reset()
    setIsProcessing(true)
    setError(null)

    try {
      const { data: sessionData, error: sessionError } = await supabase
        .from('lead_search_sessions')
        .insert({
          query: params.query,
          target_count: params.targetCount,
          status: 'processing'
        })
        .select()
        .single()

      if (sessionError) throw sessionError
      setSession(sessionData as LeadSearchSession)

      const response = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: (sessionData as any).id,
          query: params.query,
          targetCount: params.targetCount,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      if (subscriptionsRef.current) {
        subscriptionsRef.current.channel.unsubscribe()
        subscriptionsRef.current.sessionChannel.unsubscribe()
        subscriptionsRef.current = null
      }

      const channel = supabase
        .channel(`leads:${(sessionData as any).id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'leads',
            filter: `session_id=eq.${(sessionData as any).id}`,
          },
          (payload: { new: Lead }) => {
            addLead(payload.new as Lead)
            setProgress((prev: number) => Math.min(prev + 1, 100))
          }
        )
        .subscribe()

      const sessionChannel = supabase
        .channel(`session:${(sessionData as any).id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'lead_search_sessions',
            filter: `id=eq.${(sessionData as any).id}`,
          },
          (payload: { new: { status: string } }) => {
            if (payload.new.status === 'completed') {
              setSession((prev: LeadSearchSession | null) =>
                prev ? { ...prev, status: 'completed' as const } : prev
              )
              setIsProcessing(false)
              if (subscriptionsRef.current) {
                subscriptionsRef.current.channel.unsubscribe()
                subscriptionsRef.current.sessionChannel.unsubscribe()
                subscriptionsRef.current = null
              }
            } else if (payload.new.status === 'failed') {
              setError('Search failed')
              setIsProcessing(false)
              if (subscriptionsRef.current) {
                subscriptionsRef.current.channel.unsubscribe()
                subscriptionsRef.current.sessionChannel.unsubscribe()
                subscriptionsRef.current = null
              }
            }
          }
        )
        .subscribe()

      subscriptionsRef.current = { channel, sessionChannel }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
      setIsProcessing(false)
    }
  }, [supabase, addLead, setSession, setIsProcessing, setProgress, setError, reset])

  const exportCSV = useCallback(async (): Promise<void> => {
    if (leads.length === 0) return

    try {
      const response = await fetch('/api/leads/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leads }),
      })

      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Export failed')
    }
  }, [leads, setError])

  return {
    leads,
    session,
    isProcessing,
    progress,
    error,
    startSearch,
    exportCSV,
    reset,
  }
}
