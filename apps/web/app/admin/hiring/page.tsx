'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'

export default function AdminHiringPage() {
  const { user, loading: authLoading } = useUser()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const fetchData = async () => {
      // Replace with actual table name
      const table = 'hiring'
      const { data } = await supabase.from(table).select('*').limit(10)
      setData(data || [])
      setLoading(false)
    }
    fetchData()
  }, [user, supabase])

  if (authLoading || loading) return <div className="text-cyan-400/40 text-center py-20 font-mono">Loading...</div>
  if (!user) return <div className="text-center py-20"><a href="/login" className="text-cyan-400 hover:text-cyan-300">Sign in required</a></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white font-mono capitalize">hiring</h1>
        <span className="text-xs text-cyan-400/30 font-mono">{data.length} items</span>
      </div>
      <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6">
        {data.length === 0 ? (
          <p className="text-cyan-400/30 text-sm font-mono">No hiring found.</p>
        ) : (
          <pre className="text-cyan-400/40 text-xs font-mono overflow-auto">{JSON.stringify(data, null, 2)}</pre>
        )}
      </div>
    </div>
  )
}
