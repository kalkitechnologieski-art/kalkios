'use client'

import { useUser } from '@/hooks/useAuth'
import { useRealtime } from '@/lib/hooks/useRealtime'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function EmployeeTasksPage() {
  const { user } = useUser()
  const { data: tasks, loading, refetch } = useRealtime('tasks', { column: 'assigned_to', value: user?.id || '' })
  const supabase = createClient()

  const updateStatus = async (id: string, status: string) => {
    try {
      await supabase.from('tasks').update({ status }).eq('id', id)
      await refetch()
      toast.success('Task updated')
    } catch {
      toast.error('Failed to update task')
    }
  }

  const columns = [
    { key: 'title', header: 'Task', searchable: true },
    { key: 'priority', header: 'Priority', render: (val: string) => <Badge variant={val === 'high' ? 'destructive' : val === 'medium' ? 'secondary' : 'outline'}>{val}</Badge> },
    { key: 'status', header: 'Status', render: (val: string) => <Badge>{val}</Badge> },
    { key: 'due_date', header: 'Due', render: (val: string) => val ? new Date(val).toLocaleDateString() : '-' },
  ]

  const actions = (row: any) => (
    <select
      value={row.status || 'pending'}
      onChange={e => updateStatus(row.id, e.target.value)}
      className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs"
    >
      <option value="pending">Pending</option>
      <option value="in_progress">In Progress</option>
      <option value="review">Review</option>
      <option value="completed">Completed</option>
    </select>
  )

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono">My Tasks</h1>
      <DataTable data={tasks} columns={columns} keyExtractor={row => row.id} loading={loading} actions={actions} searchPlaceholder="Search tasks..." />
    </div>
  )
}
