// == KALKI B3 COMMAND ==
// Timeline feed — reusable across admin + client.
// -----------------------------------------------------------------------------

'use client';

import { Loader2, Inbox } from 'lucide-react';
import { useTimeline } from '@/hooks/useTimeline';
import { TimelinePostCard } from './TimelinePost';
import { reactToPost } from '@/lib/timeline/store';
import type { TimelineVisibility } from '@/lib/timeline/types';

interface Props {
  projectId?: string;
  orderId?: string;
  visibility?: TimelineVisibility;
  emptyMessage?: string;
}

export function TimelineFeed({ projectId, orderId, visibility, emptyMessage = 'No activity yet' }: Props) {
  const { posts, loading, error } = useTimeline({ projectId, orderId, visibility });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-8 text-red-400/60 text-xs font-mono">{error}</div>;
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-white/30">
        <Inbox className="w-8 h-8 mb-2" />
        <p className="text-xs font-mono">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {posts.map((post) => (
        <TimelinePostCard
          key={post.id}
          post={post}
          onReact={(id, emoji) => void reactToPost(id, emoji)}
        />
      ))}
    </div>
  );
}

export default TimelineFeed;
