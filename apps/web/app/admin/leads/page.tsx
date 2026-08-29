'use client'

import { useRealtime } from '@/lib/hooks/useRealtime'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function AdminLeadsPage() {
  const { data: leads, loading, refetch } = useRealtime('leads')
  const supabase = createClient()

  const updateStatus = async (id: string, status: string) => {
    try {
      await supabase.from('leads').update({ status }).eq('id', id)
      await refetch()
      toast.success('Lead status updated')
    } catch {
      toast.error('Failed to update lead')
    }
  }

  const columns = [
    { key: 'name', header: 'Name', searchable: true },
    { key: 'email', header: 'Email', searchable: true },
    { key: 'status', header: 'Status', render: (val: string) => <Badge variant={val === 'converted' ? 'default' : 'secondary'}>{val || 'new'}</Badge> },
    { key: 'created_at', header: 'Received', render: (val: string) => new Date(val).toLocaleDateString() },
  ]

  const actions = (row: any) => (
    <select
      value={row.status || 'new'}
      onChange={e => updateStatus(row.id, e.target.value)}
      className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs"
    >
      <option value="new">New</option>
      <option value="contacted">Contacted</option>
      <option value="qualified">Qualified</option>
      <option value="converted">Converted</option>
    </select>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono">Leads</h1>
      <DataTable data={leads} columns={columns} keyExtractor={row => row.id} loading={loading} actions={actions} searchPlaceholder="Search leads..." />
    </div>
  )
}
