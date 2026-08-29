'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { Check, X, Eye, Download, Filter } from 'lucide-react'

export default function AdminHiringPage() {
  const { user, loading: authLoading } = useUser()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const supabase = createClient()

  useEffect(() => {
    if (!user) { setLoading(false); return }
    const fetchData = async () => {
      const { data } = await supabase
        .from('job_applications')
        .select('*, job_postings(title)')
        .order('created_at', { ascending: false })
      setApplications(data || [])
      setLoading(false)
    }
    fetchData()
  }, [user, supabase])

  const updateStatus = async (id: string, status: string) => {
    await supabase
      .from('job_applications')
      .update({ status })
      .eq('id', id)
    setApplications(prev =>
      prev.map(app => app.id === id ? { ...app, status } : app)
    )
  }

  const filtered = applications.filter(app =>
    filter === 'all' ? true : app.status === filter
  )

  if (authLoading || loading) {
    return <div className="text-cyan-400/40 text-center py-20 font-mono">Loading...</div>
  }

  if (!user) {
    return <div className="text-center py-20"><a href="/login" className="text-cyan-400 hover:text-cyan-300">Sign in required</a></div>
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    reviewing: 'bg-blue-500/20 text-blue-400',
    interviewed: 'bg-purple-500/20 text-purple-400',
    offered: 'bg-green-500/20 text-green-400',
    hired: 'bg-emerald-500/20 text-emerald-400',
    rejected: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white font-mono">Hiring Applications</h1>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-black/40 border border-cyan-500/20 rounded-lg px-3 py-2 text-white text-sm outline-none"
          >
            <option value="all">All</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="interviewed">Interviewed</option>
            <option value="offered">Offered</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>
          <Filter className="w-5 h-5 text-white/30" />
        </div>
      </div>

      <div className="bg-white/5 border border-cyan-500/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-cyan-500/10 text-cyan-400/60 text-xs font-mono uppercase tracking-wider">
              <tr>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Job</th>
                <th className="p-3">Status</th>
                <th className="p-3">Applied</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-cyan-400/30 text-sm font-mono">
                    No applications found.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="border-t border-cyan-500/5 hover:bg-white/5 transition">
                    <td className="p-3 text-white text-sm font-mono">{app.applicant_name}</td>
                    <td className="p-3 text-white/60 text-sm font-mono">{app.applicant_email}</td>
                    <td className="p-3 text-white/60 text-sm font-mono">{app.job_postings?.title || 'General'}</td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${statusColors[app.status] || 'bg-white/10 text-white/40'}`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="p-3 text-white/40 text-xs font-mono">
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-3 text-right space-x-1">
                      <button
                        onClick={() => updateStatus(app.id, 'reviewing')}
                        className="p-1.5 rounded hover:bg-blue-500/20 text-blue-400/60 hover:text-blue-400 transition"
                        title="Start Review"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, 'offered')}
                        className="p-1.5 rounded hover:bg-green-500/20 text-green-400/60 hover:text-green-400 transition"
                        title="Offer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => updateStatus(app.id, 'rejected')}
                        className="p-1.5 rounded hover:bg-red-500/20 text-red-400/60 hover:text-red-400 transition"
                        title="Reject"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {app.resume_url && (
                        <a
                          href={app.resume_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white transition inline-block"
                          title="Download Resume"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
