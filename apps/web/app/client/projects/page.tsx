'use client'

import { useUser } from '@/hooks/useAuth'
import { useRealtime } from '@/lib/hooks/useRealtime'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/badge'

export default function ClientProjectsPage() {
  const { user } = useUser()
  const { data: projects, loading } = useRealtime('projects', { column: 'client_id', value: user?.id || '' })
  const columns = [
    { key: 'name', header: 'Project' },
    { key: 'status', header: 'Status', render: (val: string) => <Badge>{val}</Badge> },
    { key: 'created_at', header: 'Started', render: (val: string) => new Date(val).toLocaleDateString() },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono">My Projects</h1>
      <DataTable data={projects} columns={columns} keyExtractor={row => row.id} loading={loading} searchPlaceholder="Search projects..." />
    </div>
  )
}
