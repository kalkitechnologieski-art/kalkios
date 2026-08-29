'use client'

import { useMemo } from 'react'
import { useRealtime } from '@/lib/hooks/useRealtime'
import { StatCard } from '@/components/ui/StatCard'
import { ChartWrapper } from '@/components/dashboard/ChartWrapper'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { Users, ShoppingBag, FileText, Briefcase, TrendingUp, Activity } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import Link from 'next/link'

const QuickAction = ({ href, label, icon: Icon }: { href: string; label: string; icon: any }) => (
  <Link href={href} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center hover:border-cyan-500/30 transition group">
    <Icon className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition" />
    <span className="text-white font-mono text-sm">{label}</span>
  </Link>
)

export default function AdminDashboard() {
  const { data: users, loading: usersLoading } = useRealtime('profiles')
  const { data: orders, loading: ordersLoading } = useRealtime('orders')
  const { data: leads } = useRealtime('leads')
  const { data: projects } = useRealtime('projects')

  const revenueData = useMemo(() => {
    if (!orders) return []
    const map = new Map<string, number>()
    orders.forEach(o => {
      const date = new Date(o.created_at).toLocaleDateString()
      map.set(date, (map.get(date) || 0) + (o.amount || 0))
    })
    return Array.from(map.entries()).map(([date, amount]) => ({ date, amount }))
  }, [orders])

  const totalRevenue = orders?.reduce((sum, o) => sum + (o.amount || 0), 0) ?? 0

  const stats = [
    { title: 'Total Users', value: users?.length ?? 0, icon: Users },
    { title: 'Orders', value: orders?.length ?? 0, icon: ShoppingBag },
    { title: 'Leads', value: leads?.length ?? 0, icon: FileText },
    { title: 'Projects', value: projects?.length ?? 0, icon: Briefcase },
    { title: 'Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: TrendingUp },
    { title: 'Active Sessions', value: 42, icon: Activity },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono">Admin Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <StatCard
            key={i}
            title={stat.title}
            value={stat.value}
            icon={<stat.icon className="w-5 h-5" />}
            loading={usersLoading || ordersLoading}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-mono mb-4">Revenue (last 7 days)</h3>
          <ChartWrapper loading={ordersLoading} empty={!revenueData.length}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={revenueData.slice(-7)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="date" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #333' }} />
                <Line type="monotone" dataKey="amount" stroke="#00ffff" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </ChartWrapper>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-mono mb-4">Recent Activity</h3>
          <ActivityFeed events={[]} loading={false} />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction href="/admin/users" label="Users" icon={Users} />
        <QuickAction href="/admin/orders" label="Orders" icon={ShoppingBag} />
        <QuickAction href="/admin/leads" label="Leads" icon={FileText} />
        <QuickAction href="/admin/projects" label="Projects" icon={Briefcase} />
      </div>
    </div>
  )
}
