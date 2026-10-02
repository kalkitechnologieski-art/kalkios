// == KALKI B3 COMMAND ==
// Single timeline post card — avatar, role badge, media grid, reactions.
// -----------------------------------------------------------------------------

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { TimelinePost } from '@/lib/timeline/types';
import { CheckCircle2, AlertCircle, FileText, MessageSquare, Star, Upload, Sparkles, Flag } from 'lucide-react';

interface Props {
  post: TimelinePost;
  onReact?: (postId: string, emoji: string) => void;
}

const TYPE_ICONS: Record<string, typeof CheckCircle2> = {
  system: Sparkles,
  milestone: Star,
  deliverable: Upload,
  question: MessageSquare,
  client_file: FileText,
  note: Flag,
  update: AlertCircle,
};

const TYPE_COLORS: Record<string, string> = {
  system: 'text-cyan-400',
  milestone: 'text-green-400',
  deliverable: 'text-purple-400',
  question: 'text-yellow-400',
  client_file: 'text-blue-400',
  note: 'text-red-400',
  update: 'text-pink-400',
};

export function TimelinePostCard({ post, onReact }: Props) {
  const [showReactions, setShowReactions] = useState(false);
  const Icon = TYPE_ICONS[post.post_type] ?? Sparkles;
  const color = TYPE_COLORS[post.post_type] ?? 'text-cyan-400';

  const react = (emoji: string) => {
    onReact?.(post.id, emoji);
    setShowReactions(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-cyan-500/20 transition"
    >
      <div className={cn('flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-black/40 border border-white/10', color)}>
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn('text-xs font-mono uppercase tracking-wider', color)}>
            {post.post_type}
          </span>
          {post.visibility === 'admin' && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
              ADMIN ONLY
            </span>
          )}
          <span className="text-[10px] font-mono text-white/30">
            {new Date(post.created_at).toLocaleString('en-IN', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </span>
        </div>

        <p className="text-white/80 text-sm mt-1 whitespace-pre-wrap break-words">
          {post.content}
        </p>

        {post.media && post.media.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {post.media.map((m) => (
              <a key={m.id} href={m.url} target="_blank" rel="noopener noreferrer" className="aspect-square bg-white/5 rounded-lg overflow-hidden hover:opacity-80 transition">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={m.url} alt="" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => setShowReactions((v) => !v)}
            className="text-[10px] font-mono text-white/30 hover:text-white/60 transition"
          >
            👍 React
          </button>
          {showReactions && (
            <div className="flex items-center gap-1">
              {['👍', '❤️', '🎉', '🔥'].map((e) => (
                <button
                  key={e}
                  onClick={() => react(e)}
                  className="text-sm hover:scale-125 transition"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
          {post.reactions && post.reactions.length > 0 && (
            <div className="flex items-center gap-1 ml-2">
              {post.reactions.map((r) => (
                <span key={r.emoji} className="text-[10px] font-mono text-white/40">
                  {r.emoji} {r.count}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default TimelinePostCard;
