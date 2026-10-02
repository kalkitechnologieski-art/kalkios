// == KALKI B3 COMMAND ==
// Compact timeline preview card for dashboard.
// -----------------------------------------------------------------------------

'use client';

import { useTimeline } from '@/hooks/useTimeline';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

interface Props {
  projectId?: string;
  orderId?: string;
  limit?: number;
}

export function TimelineCard({ projectId, orderId, limit = 3 }: Props) {
  const { posts, loading } = useTimeline({ projectId, orderId });
  const recent = posts.slice(0, limit);

  if (loading) {
    return <div className="h-24 bg-white/5 rounded-xl animate-pulse" />;
  }

  if (recent.length === 0) {
    return (
      <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-white/30 text-xs font-mono text-center">
        No recent activity
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-3 space-y-2">
      {recent.map((post) => (
        <motion.div
          key={post.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-start gap-2 text-xs"
        >
          <Sparkles className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className={cn('text-white/80 truncate font-mono')}>{post.content}</p>
            <p className="text-white/30 text-[10px] font-mono">
              {new Date(post.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default TimelineCard;
