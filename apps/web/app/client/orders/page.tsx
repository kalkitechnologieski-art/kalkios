'use client'

import { useUser } from '@/hooks/useAuth'
import { useRealtime } from '@/lib/hooks/useRealtime'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/badge'

export default function ClientOrdersPage() {
  const { user } = useUser()
  const { data: orders, loading } = useRealtime('orders', { column: 'client_id', value: user?.id || '' })
  const columns = [
    { key: 'id', header: 'Order ID' },
    { key: 'amount', header: 'Amount', render: (val: number) => `₹${val}` },
    { key: 'status', header: 'Status', render: (val: string) => <Badge>{val}</Badge> },
    { key: 'created_at', header: 'Date', render: (val: string) => new Date(val).toLocaleDateString() },
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono">My Orders</h1>
      <DataTable data={orders} columns={columns} keyExtractor={row => row.id} loading={loading} searchPlaceholder="Search orders..." />
    </div>
  )
}
