'use client'

import { useUser } from '@/hooks/useAuth'
import { useRealtime } from '@/lib/hooks/useRealtime'
import { StatCard } from '@/components/ui/StatCard'
import { FolderKanban, ShoppingBag, FileText, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export default function ClientDashboard() {
  const { user } = useUser()
  const { data: projects } = useRealtime('projects', { column: 'client_id', value: user?.id || '' })
  const { data: orders } = useRealtime('orders', { column: 'client_id', value: user?.id || '' })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono">Client Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Active Projects" value={projects?.length ?? 0} icon={<FolderKanban className="w-5 h-5" />} />
        <StatCard title="Orders" value={orders?.length ?? 0} icon={<ShoppingBag className="w-5 h-5" />} />
        <StatCard title="Invoices" value={0} icon={<FileText className="w-5 h-5" />} />
        <StatCard title="Support" value="Chat" icon={<MessageSquare className="w-5 h-5" />} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/client/projects" className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:border-cyan-500/30 transition group">
          <FolderKanban className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition" />
          <span className="text-white font-mono text-sm">Projects</span>
        </Link>
        <Link href="/client/orders" className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:border-cyan-500/30 transition group">
          <ShoppingBag className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition" />
          <span className="text-white font-mono text-sm">Orders</span>
        </Link>
        <Link href="/client/support" className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:border-cyan-500/30 transition group">
          <MessageSquare className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition" />
          <span className="text-white font-mono text-sm">Support</span>
        </Link>
      </div>
    </div>
  )
}
