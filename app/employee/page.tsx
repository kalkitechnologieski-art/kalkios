'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'
import Link from 'next/link'
import { CheckCircle, Clock, Calendar, User } from 'lucide-react'

export default function EmployeeDashboard() {
  const { user, loading: authLoading } = useUser()
  const [profile, setProfile] = useState<any>(null)
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const fetchData = async () => {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profile)
      // Mock tasks for now (in production, fetch from tasks table)
      setTasks([
        { id: '1', title: 'Complete project documentation', status: 'in_progress', due_date: '2026-09-15' },
        { id: '2', title: 'Review code PR #42', status: 'pending', due_date: '2026-09-16' },
      ])
      setLoading(false)
    }
    fetchData()
  }, [user, supabase])

  if (authLoading || loading) return <div className="text-cyan-400/40 text-center py-20 font-mono">Loading...</div>
  if (!user) return <div className="text-center py-20"><Link href="/login" className="text-cyan-400 hover:text-cyan-300">Sign in required</Link></div>

  const isHR = profile?.role === 'hr'

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-mono">Employee Dashboard</h1>
          <p className="text-cyan-400/40 text-sm font-mono">Welcome, {profile?.full_name || 'Employee'}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-cyan-400/30 font-mono border border-cyan-500/10 px-3 py-1 rounded-full">
          <User className="w-3 h-3" />
          {profile?.role?.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4">
          <Clock className="w-5 h-5 text-cyan-400 mb-2" />
          <div className="text-2xl font-bold text-white">{tasks.filter(t => t.status === 'pending').length}</div>
          <div className="text-cyan-400/40 text-xs font-mono">Pending Tasks</div>
        </div>
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4">
          <CheckCircle className="w-5 h-5 text-green-400 mb-2" />
          <div className="text-2xl font-bold text-white">{tasks.filter(t => t.status === 'completed').length}</div>
          <div className="text-cyan-400/40 text-xs font-mono">Completed</div>
        </div>
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4">
          <Calendar className="w-5 h-5 text-cyan-400 mb-2" />
          <div className="text-2xl font-bold text-white">{tasks.length}</div>
          <div className="text-cyan-400/40 text-xs font-mono">Total Tasks</div>
        </div>
        {isHR && (
          <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4">
            <Briefcase className="w-5 h-5 text-purple-400 mb-2" />
            <div className="text-2xl font-bold text-white">0</div>
            <div className="text-cyan-400/40 text-xs font-mono">Open Positions</div>
          </div>
        )}
      </div>

      <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6">
        <h2 className="text-white font-mono text-sm mb-4">My Tasks</h2>
        {tasks.length === 0 ? (
          <div className="text-cyan-400/30 text-sm font-mono">No tasks assigned</div>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-white/5">
                <div>
                  <p className="text-white text-sm font-mono">{task.title}</p>
                  <p className="text-cyan-400/30 text-xs font-mono">Due: {task.due_date}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  task.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  task.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-white/10 text-white/40'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
