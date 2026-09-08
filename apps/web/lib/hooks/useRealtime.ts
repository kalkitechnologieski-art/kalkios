import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export function useRealtime<T = any>(
  table: string,
  filter?: { column: string; value: string | number }
) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient() as any

  const fetchData = useCallback(async () => {
    try {
// @ts-ignore
      let query = supabase.from(table).select('*')
      if (filter) query = query.eq(filter.column, filter.value as any as any)
      const { data: result, error: err } = await query
      if (err) throw err
      setData(result || [])
      setError(null)
    } catch (err) {
      console.error(`Error fetching ${table}:`, err)
      setError(err as Error)
      toast.error(`Failed to load ${table}`)
    } finally {
      setLoading(false)
    }
  }, [table, filter])

  useEffect(() => {
    fetchData()

    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [table, filter, fetchData])

  return { data, loading, error, refetch: fetchData }
}
