'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'
import { AdminProjectList } from '@/components/AdminProjectList'
import { AdminTimelineEditor } from '@/components/AdminTimelineEditor'

export default function AdminPage() {
  const { user, loading: userLoading } = useUser()
  const [projects, setProjects] = useState([])
  const [selectedProject, setSelectedProject] = useState(null)
  const [isClient, setIsClient] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!user || !isClient) return
    const fetchProjects = async () => {
      const { data } = await supabase
        .from('projects')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
      setProjects(data || [])
    }
    fetchProjects()
  }, [user, isClient, supabase])

  // Show loading state while hydrating
  if (!isClient || userLoading) {
    return <div className="text-white/40 text-center py-20">Loading...</div>
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-xl font-bold text-white">Please Sign In</h2>
        <p className="text-white/50 text-sm mt-2">Admin access requires authentication.</p>
        <a href="/login" className="mt-6 px-6 py-3 bg-purple-600 rounded-full text-white text-sm font-medium hover:bg-purple-700 transition">
          Sign In
        </a>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-xl p-4">
        <h2 className="text-lg font-bold text-white mb-4">Projects</h2>
        <AdminProjectList projects={projects} onSelect={setSelectedProject} />
      </div>
      <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-4">
        {selectedProject ? (
          <AdminTimelineEditor project={selectedProject} />
        ) : (
          <div className="text-white/40 text-center py-20">Select a project to manage</div>
        )}
      </div>
    </div>
  )
}
