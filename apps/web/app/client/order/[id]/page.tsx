// == KALKI B4 EXPERIENCE ==
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useAuth';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle, Circle, FileText } from 'lucide-react';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
}

interface TimelinePost {
  id: string;
  content: string;
  post_type: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  description: string | null;
  estimated_delivery: string | null;
  milestones?: Milestone[];
}

export default function ClientOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const projectId = params?.id;
  const { user, loading: authLoading } = useUser();
  const [project, setProject] = useState<Project | null>(null);
  const [timeline, setTimeline] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !projectId) { setLoading(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;

    void (async () => {
      try {
        const [{ data: p }, { data: t }] = await Promise.all([
          supabase
            .from('projects')
            .select('*, milestones(*)')
            .eq('id', projectId)
            .eq('client_id', user.id)
            .single(),
          supabase
            .from('timeline_posts')
            .select('id, content, post_type, created_at')
            .eq('project_id', projectId)
            .eq('visibility', 'client')
            .order('created_at', { ascending: false })
            .limit(50),
        ]);
        setProject(p as Project | null);
        setTimeline((t ?? []) as TimelinePost[]);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, projectId]);

  if (authLoading || loading) {
    return <div className="text-white/40 text-center py-20">Loading…</div>;
  }

  if (!project) {
    return (
      <div className="max-w-3xl mx-auto py-20 text-center">
        <p className="text-white/60">Project not found.</p>
        <Link href="/client" className="mt-4 inline-block text-cyan-400">← Back to dashboard</Link>
      </div>
    );
  }

  const milestones = project.milestones ?? [];
  const completed = milestones.filter((m) => m.status === 'completed').length;
  const progress = milestones.length > 0 ? Math.round((completed / milestones.length) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <Link href="/client" className="inline-flex items-center gap-2 text-cyan-400/60 hover:text-cyan-400 text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to dashboard
      </Link>

      <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            <p className="text-white/40 text-sm mt-1">{project.description}</p>
          </div>
          <span className="text-xs bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full">
            {project.status.replace('_', ' ')}
          </span>
        </div>

        {milestones.length > 0 && (
          <div className="mt-6">
            <div className="flex justify-between text-xs text-white/40 mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Milestones */}
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
          <h2 className="text-lg font-bold text-white mb-4">Milestones</h2>
          {milestones.length === 0 ? (
            <p className="text-white/40 text-sm">No milestones yet.</p>
          ) : (
            <div className="space-y-3">
              {milestones.map((m) => (
                <div key={m.id} className="flex items-start gap-3">
                  {m.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : m.status === 'in_progress' ? (
                    <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-5 h-5 text-white/20 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`text-sm ${m.status === 'completed' ? 'text-white/60 line-through' : 'text-white'}`}>{m.title}</p>
                    <p className="text-white/40 text-xs">{m.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-5">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Live updates
          </h2>
          {timeline.length === 0 ? (
            <p className="text-white/40 text-sm">No updates yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {timeline.map((post) => (
                <div key={post.id} className="border-l-2 border-cyan-500/20 pl-3">
                  <p className="text-white/80 text-sm">{post.content}</p>
                  <p className="text-white/30 text-[10px] mt-1 font-mono">
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
