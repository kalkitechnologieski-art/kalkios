'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useAuth'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import Link from 'next/link'
import { 
  User, Sparkles, ShoppingBag, Clock, Award, 
  TrendingUp, ChevronRight, FolderKanban,
  Calendar, CheckCircle, Circle
} from 'lucide-react'
import type { Database } from '@/lib/supabase/types'

type Project = Database['public']['Tables']['projects']['Row'] & {
  milestones?: Database['public']['Tables']['milestones']['Row'][]
}

type Order = Database['public']['Tables']['orders']['Row']

// ─── Not Logged In State ───
function NotLoggedIn() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-600/20 to-purple-600/20 flex items-center justify-center mb-6">
        <User className="w-10 h-10 text-cyan-400/50" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Welcome to Your Client Panel</h2>
      <p className="text-cyan-400/40 text-sm max-w-md mb-8">
        Sign in to track your projects, view invoices, and manage your services.
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <LuxuryButton
          variant="primary"
          size="lg"
          label="Sign In"
          icon={<User className="w-4 h-4" />}
          onClick={() => { window.location.href = '/login' }}
        />
        <Link href="/marketplace">
          <LuxuryButton variant="secondary" size="lg" label="Browse Marketplace" />
        </Link>
      </div>
    </div>
  )
}

// ─── Project Card ───
function ProjectCard({ project }: { project: Project }) {
  const total = project.milestones?.length || 0
  const completed = project.milestones?.filter(m => m.status === 'completed').length || 0
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 rounded-xl p-6 transition hover:bg-white/10">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-white font-medium">{project.name}</h3>
          <p className="text-cyan-400/40 text-sm mt-1">{project.description || 'No description'}</p>
        </div>
        <span className={`text-xs px-3 py-1 rounded-full ${
          project.status === 'completed' ? 'bg-green-500/20 text-green-400' :
          project.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-white/10 text-cyan-400/40'
        }`}>
          {project.status || 'Pending'}
        </span>
      </div>
      <div className="mt-4">
        <div className="flex justify-between text-xs text-cyan-400/30 mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      {project.milestones && project.milestones.length > 0 && (
        <div className="mt-4 flex items-center gap-3 text-xs text-cyan-400/30">
          {project.milestones.slice(0, 3).map((m, i) => (
            <span key={i} className="flex items-center gap-1">
              {m.status === 'completed' ? (
                <CheckCircle className="w-3 h-3 text-green-400" />
              ) : m.status === 'in_progress' ? (
                <Circle className="w-3 h-3 text-yellow-400 animate-pulse" />
              ) : (
                <Circle className="w-3 h-3 text-white/20" />
              )}
              {m.title}
            </span>
          ))}
          {project.milestones.length > 3 && (
            <span className="text-white/20">+{project.milestones.length - 3} more</span>
          )}
        </div>
      )}
      <div className="mt-4 flex items-center justify-between text-xs">
        {project.estimated_delivery && (
          <span className="text-cyan-400/30 flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Due: {new Date(project.estimated_delivery).toLocaleDateString()}
          </span>
        )}
        <span className="text-cyan-400/50 hover:text-cyan-400 transition flex items-center gap-1">
          View Details <ChevronRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  )
}

// ─── Main Client Panel ───
export default function ClientPage() {
  const { user, loading: authLoading } = useUser()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchProjects = async () => {
      try {
        // Try to get projects for this user
        let { data, error } = await supabase
          .from('projects')
          .select('*, milestones(*)')
          .eq('client_id', user.id)
          .order('created_at', { ascending: false })

        // If no projects, try using email from orders
        if (!data || data.length === 0) {
          const { data: orders } = await supabase
            .from('orders')
            .select('id')
            .eq('buyer_email', user.email)

          if (orders && orders.length > 0) {
            // Get orders that have a project_id (could be null)
            const { data: ordersWithProjects } = await supabase
              .from('orders')
              .select('project_id')
              .eq('buyer_email', user.email)

            const projectIds = ordersWithProjects
              ?.map((o: any) => o.project_id)
              .filter((id: string | null): id is string => id !== null) || []

            if (projectIds.length > 0) {
              const { data: projectsData } = await supabase
                .from('projects')
                .select('*, milestones(*)')
                .in('id', projectIds)
                .order('created_at', { ascending: false })
              data = projectsData
            }
          }
        }
        setProjects((data || []) as Project[])
      } catch (e) {
        console.warn('Could not fetch projects:', e)
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [user, supabase])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <NotLoggedIn />
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-600/20 to-purple-600/20 flex items-center justify-center mb-6">
          <FolderKanban className="w-10 h-10 text-cyan-400/50" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">No Active Projects</h2>
        <p className="text-cyan-400/40 text-sm max-w-md mb-8">
          You don't have any active projects yet. Start your journey with our premium services.
        </p>
        <Link href="/marketplace">
          <LuxuryButton variant="primary" size="lg" label="Explore Marketplace" />
        </Link>
      </div>
    )
  }

  const userName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2 font-mono">
            <FolderKanban className="w-6 h-6 text-cyan-400" />
            <span className="text-cyan-400">//</span> Client Panel
          </h1>
          <p className="text-cyan-400/40 text-sm mt-1">
            Welcome back, {userName} • {projects.length} active {projects.length === 1 ? 'project' : 'projects'}
          </p>
        </div>
        <Link href="/marketplace">
          <LuxuryButton
            variant="secondary"
            size="sm"
            label="New Project"
            icon={<Sparkles className="w-4 h-4" />}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Projects', value: projects.filter(p => p.status === 'in_progress').length, icon: FolderKanban },
          { label: 'Completed', value: projects.filter(p => p.status === 'completed').length, icon: CheckCircle },
          { label: 'Total Milestones', value: projects.reduce((acc, p) => acc + (p.milestones?.length || 0), 0), icon: Calendar },
          { label: 'On Track', value: projects.filter(p => p.status !== 'completed').length, icon: TrendingUp },
        ].map((stat, i) => (
          <div key={i} className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 text-center">
            <stat.icon className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
            <div className="text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-xs text-cyan-400/30">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
