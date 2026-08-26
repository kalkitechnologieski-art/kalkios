'use client'
import type { Database } from '@/lib/supabase/types'

type Milestone = Database['public']['Tables']['milestones']['Row']

export function ProjectTimeline({ milestones }: { milestones: Milestone[] }) {
  const total = milestones.length
  const completed = milestones.filter((m: Milestone) => m.status === 'completed').length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold">Project Progress</h3>
        <span className="text-white/60 text-sm">{progress}%</span>
      </div>
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>
      <div className="mt-4 space-y-3">
        {milestones.map((m: Milestone) => (
          <div key={m.id} className="flex items-start gap-3">
            <div className={`w-4 h-4 rounded-full mt-1 flex-shrink-0 border-2 ${
              m.status === 'completed' ? 'bg-green-500 border-green-500' :
              m.status === 'in_progress' ? 'bg-yellow-500 border-yellow-500 animate-pulse' :
              'bg-white/20 border-white/20'
            }`} />
            <div>
              <p className={`text-sm ${m.status === 'completed' ? 'text-white/70 line-through' : 'text-white'}`}>
                {m.title}
              </p>
              <p className="text-xs text-white/40">{m.description}</p>
              {m.due_date && (
                <p className="text-xs text-white/30 mt-1">
                  Due: {new Date(m.due_date).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
