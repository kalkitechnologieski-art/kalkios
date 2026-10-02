// == KALKI B3 COMMAND ==
// Admin composer for posting to timeline.
// -----------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { createTimelinePost } from '@/lib/timeline/store';
import type { TimelinePostType } from '@/lib/timeline/types';
import { LuxuryButton } from '@/components/ui/LuxuryButton';

interface Props {
  projectId?: string;
  orderId?: string;
  onPosted?: () => void;
}

const POST_TYPES: Array<{ value: TimelinePostType; label: string }> = [
  { value: 'update', label: 'Update' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'deliverable', label: 'Deliverable' },
  { value: 'question', label: 'Question' },
  { value: 'note', label: 'Note (admin)' },
];

export function TimelineComposer({ projectId, orderId, onPosted }: Props) {
  const [content, setContent] = useState('');
  const [type, setType] = useState<TimelinePostType>('update');
  const [visibility, setVisibility] = useState<'client' | 'admin'>('client');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!content.trim()) return;
    setLoading(true);
    const created = await createTimelinePost({
      projectId,
      orderId,
      postType: type,
      content: content.trim(),
      visibility,
    });
    setLoading(false);
    if (created) {
      setContent('');
      onPosted?.();
    }
  };

  return (
    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TimelinePostType)}
          className="bg-black/40 border border-cyan-500/20 rounded-lg px-2 py-1 text-xs font-mono text-white outline-none"
        >
          {POST_TYPES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as 'client' | 'admin')}
          className="bg-black/40 border border-cyan-500/20 rounded-lg px-2 py-1 text-xs font-mono text-white outline-none"
        >
          <option value="client">Client visible</option>
          <option value="admin">Admin only</option>
        </select>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Post an update to the timeline…"
        rows={3}
        className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50 resize-none font-mono"
      />

      <div className="flex justify-end">
        <LuxuryButton
          variant="cyber"
          size="sm"
          label={loading ? 'Posting…' : 'Post'}
          icon={loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
          onClick={submit}
          disabled={loading || !content.trim()}
        />
      </div>
    </div>
  );
}

export default TimelineComposer;
