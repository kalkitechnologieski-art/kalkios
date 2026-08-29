'use client'

import { useRealtime } from '@/lib/hooks/useRealtime'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const { data: users, loading, refetch } = useRealtime('profiles')
  const supabase = createClient()

  const handleRoleChange = async (id: string, role: string) => {
    try {
      await supabase.from('profiles').update({ role }).eq('id', id)
      await refetch()
      toast.success('Role updated')
    } catch {
      toast.error('Failed to update role')
    }
  }

  const handleBlock = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active'
    try {
      await supabase.from('profiles').update({ status: newStatus }).eq('id', id)
      await refetch()
      toast.success(`User ${newStatus}`)
    } catch {
      toast.error('Failed to update status')
    }
  }

  const columns = [
    { key: 'full_name', header: 'Name', searchable: true },
    { key: 'email', header: 'Email', searchable: true },
    { key: 'role', header: 'Role', render: (val: string) => <Badge variant="secondary">{val || 'client'}</Badge> },
    { key: 'status', header: 'Status', render: (val: string) => <Badge variant={val === 'blocked' ? 'destructive' : 'default'}>{val || 'active'}</Badge> },
    { key: 'created_at', header: 'Joined', render: (val: string) => new Date(val).toLocaleDateString() },
  ]

  const actions = (row: any) => (
    <div className="flex gap-2">
      <select
        value={row.role || 'client'}
        onChange={e => handleRoleChange(row.id, e.target.value)}
        className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs"
      >
        <option value="client">Client</option>
        <option value="admin">Admin</option>
        <option value="manager">Manager</option>
        <option value="employee">Employee</option>
      </select>
      <button
        onClick={() => handleBlock(row.id, row.status)}
        className="p-1 rounded hover:bg-white/10 text-white/40"
      >
        {row.status === 'blocked' ? '🔓' : '🔒'}
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono">Users</h1>
      <DataTable
        data={users}
        columns={columns}
        keyExtractor={row => row.id}
        loading={loading}
        actions={actions}
        searchPlaceholder="Search users..."
      />
    </div>
  )
}
