'use client'

import { useRealtime } from '@/lib/hooks/useRealtime'
import { DataTable } from '@/components/ui/DataTable'
import { Badge } from '@/components/ui/badge'

export default function AdminOrdersPage() {
  const { data: orders, loading } = useRealtime('orders')

  const columns = [
    { key: 'id', header: 'Order ID' },
    { key: 'buyer_name', header: 'Client' },
    { key: 'amount', header: 'Amount', render: (val: number) => `₹${val}` },
    { key: 'status', header: 'Status', render: (val: string) => <Badge variant={val === 'paid' ? 'default' : 'secondary'}>{val}</Badge> },
    { key: 'created_at', header: 'Date', render: (val: string) => new Date(val).toLocaleDateString() },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono">Orders</h1>
      <DataTable data={orders} columns={columns} keyExtractor={row => row.id} loading={loading} searchPlaceholder="Search orders..." />
    </div>
  )
}
