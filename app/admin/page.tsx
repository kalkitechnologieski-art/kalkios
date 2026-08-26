'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'
import Link from 'next/link'
import { Shield, Users, Briefcase, FolderKanban, UserPlus, FileText, Settings, BarChart3 } from 'lucide-react'

export default function AdminDashboard() {
  const { user, loading: authLoading } = useUser()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({
    users: 0,
    projects: 0,
    employees: 0,
    leads: 0,
    applications: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const fetchData = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profile)
      const [users, projects, employees, leads, apps] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).in('role', ['ceo','admin','manager','developer','support','hr','employee']),
        supabase.from('leads').select('*', { count: 'exact', head: true }),
        supabase.from('job_applications').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        users: users.count || 0,
        projects: projects.count || 0,
        employees: employees.count || 0,
        leads: leads.count || 0,
        applications: apps.count || 0,
      })
      setLoading(false)
    }
    fetchData()
  }, [user, supabase])

  if (authLoading || loading) return <div className="text-cyan-400/40 text-center py-20 font-mono">Loading...</div>
  if (!user) return <div className="text-center py-20"><Link href="/login" className="text-cyan-400 hover:text-cyan-300">Sign in required</Link></div>
  if (!['ceo','admin','manager'].includes(profile?.role)) {
    return <div className="text-center py-20 text-red-400 font-mono">⛔ Unauthorized access</div>
  }

  const cards = [
    { label: 'Users', value: stats.users, icon: Users, href: '/admin/users' },
    { label: 'Projects', value: stats.projects, icon: FolderKanban, href: '/admin/projects' },
    { label: 'Employees', value: stats.employees, icon: UserPlus, href: '/admin/employees' },
    { label: 'Leads', value: stats.leads, icon: FileText, href: '/admin/leads' },
    { label: 'Applications', value: stats.applications, icon: Briefcase, href: '/admin/hiring' },
  ]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-mono">Admin Dashboard</h1>
          <p className="text-cyan-400/40 text-sm font-mono">Welcome back, {profile?.full_name || 'Admin'}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-cyan-400/30 font-mono border border-cyan-500/10 px-3 py-1 rounded-full">
          <Shield className="w-3 h-3" />
          {profile?.role?.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href} className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 hover:border-cyan-500/30 transition group">
            <card.icon className="w-6 h-6 text-cyan-400 mb-2" />
            <div className="text-2xl font-bold text-white">{card.value}</div>
            <div className="text-cyan-400/40 text-xs font-mono">{card.label}</div>
          </Link>
        ))}
      </div>

      <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6">
        <h2 className="text-white font-mono text-sm mb-4">Recent Activity</h2>
        <div className="text-cyan-400/30 text-sm font-mono">No recent activity to display.</div>
      </div>
    </div>
  )
}
