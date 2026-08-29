'use client'

import { useRealtime } from '@/lib/hooks/useRealtime'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/badge'

export default function AdminAnalyticsPage() {
  const { data, loading } = useRealtime('analytics')
  const columns = [
    { key: 'id', header: 'ID' },
    { key: 'name', header: 'Name' },
    { key: 'status', header: 'Status', render: (val: string) => <Badge>{val}</Badge> },
    { key: 'created_at', header: 'Created', render: (val: string) => new Date(val).toLocaleDateString() },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono capitalize">analytics</h1>
      <DataTable data={data} columns={columns} keyExtractor={row => row.id} loading={loading} />
    </div>
  )
}
