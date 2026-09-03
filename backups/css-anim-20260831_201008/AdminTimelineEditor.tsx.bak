'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Milestone = Database['public']['Tables']['milestones']['Row']

export function AdminTimelineEditor({ project }: any) {
  const [milestones, setMilestones] = useState<Milestone[]>(project.milestones || [])
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [due, setDue] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const add = async () => {
    if (!title) return
    setLoading(true)
    // Use `as any` for insert (foreign keys)
    const { data } = await supabase
      .from('milestones')
      .insert({ 
        project_id: project.id, 
        title, 
        description: desc || null, 
        due_date: due || null, 
        status: 'pending' 
      } as any)
      .select()
      .single()
    if (data) setMilestones(prev => [...prev, data])
    setTitle(''); setDesc(''); setDue(''); setLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    // Use `as never` for update — this is the documented workaround for Supabase-js v2.39.2+
    // The `never` type appears because of a type inference issue in postgrest-js.
    // Casting to `never` tells TypeScript to bypass the strict type check.
    // See: https://blog.gitcode.com/dadb896e237152be7a4a89104af7ba49.html
    await supabase
      .from('milestones')
      .update({ status } as never)
      .eq('id', id)
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, status } : m))
  }

  return (
    <div className="space-y-4">
      <h3 className="text-white font-bold">Timeline Editor</h3>
      <div className="space-y-2">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Milestone title" className="w-full bg-white/5 rounded-lg px-3 py-2 text-white placeholder-white/30 outline-none text-sm" />
        <input type="text" value={desc} onChange={e => setDesc(e.target.value)} placeholder="Description" className="w-full bg-white/5 rounded-lg px-3 py-2 text-white placeholder-white/30 outline-none text-sm" />
        <input type="date" value={due} onChange={e => setDue(e.target.value)} className="w-full bg-white/5 rounded-lg px-3 py-2 text-white outline-none text-sm" />
        <button onClick={add} disabled={loading || !title} className="px-4 py-2 bg-purple-600 rounded-lg text-white text-sm hover:bg-purple-700 transition disabled:opacity-50">Add Milestone</button>
      </div>
      <div className="space-y-2 mt-4">{milestones.map(m => <div key={m.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg"><div><p className="text-white text-sm font-medium">{m.title}</p><p className="text-white/40 text-xs">{m.description}</p></div><select value={m.status} onChange={e => updateStatus(m.id, e.target.value)} className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 outline-none"><option value="pending">Pending</option><option value="in_progress">In Progress</option><option value="completed">Completed</option></select></div>)}</div>
    </div>
  )
}
