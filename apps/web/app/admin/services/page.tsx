'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { Plus, Edit, Trash2, Check, X } from 'lucide-react'

export default function AdminServicesPage() {
  const { user, loading: authLoading } = useUser()
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<any>({})
  const supabase = createClient()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    fetchServices()
  }, [user, supabase])

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false })
    setServices(data || [])
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this service?')) return
    await supabase.from('services').delete().eq('id', id)
    fetchServices()
  }

  const handleUpdate = async (id: string) => {
    await supabase.from('services').update(editData).eq('id', id)
    setEditingId(null)
    fetchServices()
  }

  if (authLoading || loading) return <div className="text-cyan-400/40 text-center py-20 font-mono">Loading...</div>
  if (!user) return <div className="text-center py-20"><a href="/login" className="text-cyan-400 hover:text-cyan-300">Sign in required</a></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white font-mono">Manage Services</h1>
        <LuxuryButton variant="primary" size="sm" label="Add Service" icon={<Plus className="w-4 h-4" />} />
      </div>
      <div className="bg-white/5 border border-cyan-500/10 rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="border-b border-cyan-500/10 text-cyan-400/60 text-xs font-mono uppercase tracking-wider">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price (₹)</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-t border-cyan-500/5 hover:bg-white/5">
                <td className="p-3">
                  {editingId === s.id ? (
                    <input value={editData.name || ''} onChange={(e) => setEditData({ ...editData, name: e.target.value })} className="bg-black/40 border border-cyan-500/20 rounded px-2 py-1 text-white text-sm" />
                  ) : (
                    <span className="text-white text-sm font-mono">{s.name}</span>
                  )}
                </td>
                <td className="p-3 text-white/60 text-sm font-mono">{s.category}</td>
                <td className="p-3 text-white/60 text-sm font-mono">₹{s.price?.toLocaleString()}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="p-3 text-right space-x-2">
                  {editingId === s.id ? (
                    <>
                      <button onClick={() => handleUpdate(s.id)} className="text-green-400 hover:text-green-300"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => { setEditingId(s.id); setEditData(s) }} className="text-cyan-400/60 hover:text-cyan-400"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-400/60 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
