'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'
import { ProjectTimeline } from '@/components/ProjectTimeline'
import { ChatWidget } from '@/components/ChatWidget'
import { InvoiceList } from '@/components/InvoiceList'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import type { Database } from '@/lib/supabase/types'

type Project = Database['public']['Tables']['projects']['Row'] & { milestones: Database['public']['Tables']['milestones']['Row'][] }

export default function DashboardPage() {
  const { user, loading: userLoading } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return
    const fetch = async () => {
      const { data } = await supabase.from('projects').select('*, milestones(*)').eq('client_id', user.id).order('created_at', { ascending: false })
      setProjects(data as Project[] || [])
      setLoading(false)
    }
    fetch()
    const sub = supabase.channel('projects_changes').on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `client_id=eq.${user.id}` }, fetch).subscribe()
    return () => { sub.unsubscribe() }
  }, [user, supabase])

  if (userLoading || loading) return <div className="text-white/40 text-center py-20">Loading your projects...</div>
  if (!user) return <div className="flex flex-col items-center justify-center min-h-[60vh] text-center"><div className="text-6xl mb-4">🔐</div><h2 className="text-xl font-bold text-white">Please Sign In</h2><p className="text-white/50 text-sm mt-2">Sign in to view your projects and dashboard.</p><a href="/login" className="mt-6 px-6 py-3 bg-purple-600 rounded-full text-white text-sm font-medium hover:bg-purple-700 transition">Sign In</a></div>
  if (projects.length === 0) return <div className="flex flex-col items-center justify-center min-h-[60vh] text-center"><div className="text-6xl mb-4">📂</div><h2 className="text-xl font-bold text-white">No Active Projects</h2><p className="text-white/50 text-sm mt-2">Explore our services and start your first project.</p><a href="/explore" className="mt-6 px-6 py-3 bg-purple-600 rounded-full text-white text-sm font-medium hover:bg-purple-700 transition">Explore Services</a></div>

  return (
    <div className="max-w-4xl mx-auto py-6">
      <h1 className="text-3xl font-bold text-white mb-6">Your Dashboard</h1>
      <Tabs defaultValue={projects[0]?.id || ''}>
        <TabsList className="bg-black/40 border border-white/10 rounded-xl p-1 flex-wrap">
          {projects.map(p => <TabsTrigger key={p.id} value={p.id} className="text-white/60 data-[state=active]:text-white data-[state=active]:bg-purple-600/20 rounded-lg px-4 py-2 text-sm">{p.name}</TabsTrigger>)}
        </TabsList>
        {projects.map(p => (
          <TabsContent key={p.id} value={p.id}>
            <div className="mt-6 space-y-6">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 flex justify-between items-start"><div><h2 className="text-2xl font-bold text-white">{p.name}</h2><p className="text-white/40 text-sm">Status: {p.status}</p></div><span className="px-3 py-1 bg-purple-600/20 text-purple-400 rounded-full text-xs">{p.estimated_delivery ? `Due ${new Date(p.estimated_delivery).toLocaleDateString()}` : 'In progress'}</span></div>
              <ProjectTimeline milestones={p.milestones || []} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><ChatWidget projectId={p.id} /><InvoiceList projectId={p.id} /></div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
