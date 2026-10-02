// == KALKI B3 COMMAND ==
// Project Control: milestone editor + timeline composer.
// -----------------------------------------------------------------------------

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { FolderKanban, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AdminTimelineEditor } from '@/components/AdminTimelineEditor';
import { TimelineComposer } from '@/components/timeline/TimelineComposer';
import { TimelineFeed } from '@/components/timeline/TimelineFeed';

interface ProjectRow {
  id: string;
  name: string;
  description: string | null;
  status: string;
  client_id: string | null;
  estimated_delivery: string | null;
  created_at: string;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ProjectRow | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  const refetch = async () => {
    const { data } = await supabase.from('projects').select('*').order('created_at', { ascending: false }).limit(100);
    setProjects((data ?? []) as ProjectRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: 'name', header: 'Project', searchable: true },
    { key: 'status', header: 'Status', render: (v: string) => <Badge>{v}</Badge> },
    {
      key: 'estimated_delivery',
      header: 'Due',
      render: (v: string | null) => v ? new Date(v).toLocaleDateString('en-IN') : '—',
    },
    { key: 'created_at', header: 'Started', render: (v: string) => new Date(v).toLocaleDateString('en-IN') },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono flex items-center gap-2">
        <FolderKanban className="w-6 h-6 text-cyan-400" />
        Projects
      </h1>

      <DataTable
        data={projects}
        columns={columns}
        keyExtractor={(r) => r.id}
        loading={loading}
        searchPlaceholder="Search projects…"
        onRowClick={(row) => setSelected(row as ProjectRow)}
      />

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-black border-l border-cyan-500/20 h-full flex flex-col"
            >
              <div className="p-4 border-b border-cyan-500/10 flex items-center justify-between">
                <h2 className="text-white font-mono text-sm font-bold">{selected.name}</h2>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded hover:bg-white/10 text-white/40" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <section>
                  <h3 className="text-xs font-mono text-cyan-400/60 uppercase mb-2">Milestones</h3>
                  <AdminTimelineEditor project={{ id: selected.id, milestones: [] }} />
                </section>

                <section>
                  <h3 className="text-xs font-mono text-cyan-400/60 uppercase mb-2">Post update</h3>
                  <TimelineComposer projectId={selected.id} onPosted={() => void refetch()} />
                </section>

                <section>
                  <h3 className="text-xs font-mono text-cyan-400/60 uppercase mb-2">Activity</h3>
                  <TimelineFeed projectId={selected.id} />
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
