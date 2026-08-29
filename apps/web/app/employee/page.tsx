'use client'

import { useUser } from '@/hooks/useAuth'
import { useRealtime } from '@/lib/hooks/useRealtime'
import { StatCard } from '@/components/ui/StatCard'
import { CheckSquare, Clock, FolderKanban, User } from 'lucide-react'
import Link from 'next/link'

export default function EmployeeDashboard() {
  const { user } = useUser()
  const { data: tasks, loading } = useRealtime('tasks', { column: 'assigned_to', value: user?.id || '' })
  const { data: projects } = useRealtime('projects')

  const total = tasks?.length ?? 0
  const completed = tasks?.filter(t => t.status === 'completed').length ?? 0

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono">Employee Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Assigned Tasks" value={total} icon={<CheckSquare className="w-5 h-5" />} loading={loading} />
        <StatCard title="Completed" value={completed} icon={<Clock className="w-5 h-5" />} loading={loading} />
        <StatCard title="Projects" value={projects?.length ?? 0} icon={<FolderKanban className="w-5 h-5" />} loading={loading} />
        <StatCard title="Hours Logged" value={0} icon={<User className="w-5 h-5" />} loading={loading} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/employee/tasks" className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-cyan-500/30 transition group">
          <CheckSquare className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition" />
          <span className="text-white font-mono text-sm">View My Tasks</span>
        </Link>
        <Link href="/employee/chat" className="bg-white/5 border border-white/10 rounded-xl p-6 text-center hover:border-cyan-500/30 transition group">
          <User className="w-8 h-8 text-cyan-400 mx-auto mb-2 group-hover:scale-110 transition" />
          <span className="text-white font-mono text-sm">Team Chat</span>
        </Link>
      </div>
    </div>
  )
}
