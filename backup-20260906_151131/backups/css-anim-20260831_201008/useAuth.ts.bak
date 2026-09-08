'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let supabase: any
    try {
      supabase = createClient()
    } catch (err) {
      setError(err as Error)
      setLoading(false)
      return
    }

    const getUser = async () => {
      try {
        if (!supabase.auth || typeof supabase.auth.getUser !== 'function') {
          setUser(null)
          setLoading(false)
          return
        }
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    let listener: any
    if (supabase.auth && typeof supabase.auth.onAuthStateChange === 'function') {
      const { data } = supabase.auth.onAuthStateChange(
        (_event: string, session: Session | null) => {
          setUser(session?.user || null)
        }
      )
      listener = data
    }

    return () => {
      if (listener?.subscription) {
        listener.subscription.unsubscribe()
      }
    }
  }, [])

  if (error) {
    return { user: null, loading: false, error }
  }

  return { user, loading }
}
