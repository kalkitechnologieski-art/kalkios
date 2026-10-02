// == SIDDHI F1 ==
// The slim chat bar — 40px, all chat-level actions.
// -----------------------------------------------------------------------------

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Menu, Pencil, Trash2, Check, X, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ChatTopBarProps {
  title: string;
  messageCount: number;
  autoTitled: boolean;
  modeLabel?: string;
  onNew: () => void;
  onOpenHistory: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
  onAutoTitle?: () => void;
  historyOpen: boolean;
}

export function ChatTopBar({
  title, messageCount, autoTitled, modeLabel,
  onNew, onOpenHistory, onRename, onDelete, onAutoTitle, historyOpen,
}: ChatTopBarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setDraft(title); }, [title]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commit = useCallback(() => {
    const next = draft.trim();
    if (next && next !== title) onRename(next);
    setIsEditing(false);
  }, [draft, title, onRename]);

  const cancel = useCallback(() => {
    setDraft(title);
    setIsEditing(false);
  }, [title]);

  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      else if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    },
    [commit, cancel]
  );

  return (
    <div className={cn(
      'relative z-20 h-10 flex items-center gap-1 px-2 sm:px-3 shrink-0',
      'bg-black/80 backdrop-blur-xl border-b border-cyan-500/10 select-none'
    )}>
      <button
        onClick={onNew}
        title="New chat"
        aria-label="New chat"
        className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10 active:scale-95"
      >
        <Plus className="w-4 h-4" />
      </button>

      <button
        onClick={onOpenHistory}
        title="History"
        aria-label="Toggle history"
        className={cn(
          'shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition active:scale-95',
          historyOpen
            ? 'text-cyan-300 bg-cyan-500/15'
            : 'text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10'
        )}
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-cyan-500/15 mx-1 shrink-0" />

      <div className="flex-1 min-w-0 flex items-center gap-2">
        {isEditing ? (
          <div className="flex-1 min-w-0 flex items-center gap-1">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKey}
              onBlur={commit}
              maxLength={60}
              className="flex-1 min-w-0 h-7 px-2 rounded-md bg-black/40 border border-cyan-500/30 text-white text-[13px] font-mono outline-none focus:border-cyan-500/60"
              placeholder="Chat name…"
            />
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={commit}
              className="shrink-0 h-7 w-7 rounded-md flex items-center justify-center text-green-400 hover:bg-green-500/10"
              aria-label="Save"
            >
              <Check className="w-3.5 h-3.5" />
            </button>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={cancel}
              className="shrink-0 h-7 w-7 rounded-md flex items-center justify-center text-red-400 hover:bg-red-500/10"
              aria-label="Cancel"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={() => setIsEditing(true)}
              className="flex-1 min-w-0 text-left text-[13px] font-mono text-white/80 hover:text-white truncate transition"
              title={title}
            >
              {title || 'New chat'}
            </button>

            {autoTitled && (
              <span
                className="shrink-0 text-[9px] font-mono px-1.5 py-0.5 rounded text-cyan-400/60 border border-cyan-500/20"
                title="Auto-generated name"
              >
                <Sparkles className="w-2.5 h-2.5 inline-block mr-0.5" />
                auto
              </span>
            )}

            <div className="hidden sm:flex items-center gap-1.5 shrink-0 text-[10px] font-mono text-cyan-400/40">
              <span>{messageCount}</span>
              <span className="text-cyan-400/20">msg</span>
              {modeLabel && (
                <>
                  <span className="text-cyan-400/20">·</span>
                  <span>{modeLabel}</span>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          title="Rename"
          aria-label="Rename conversation"
          className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10 active:scale-95"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}

      {onAutoTitle && !isEditing && (
        <button
          onClick={onAutoTitle}
          title="Regenerate name"
          aria-label="Regenerate name"
          className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition text-cyan-400/60 hover:text-cyan-300 hover:bg-cyan-500/10 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5" />
        </button>
      )}

      <button
        onClick={() => setConfirmDelete(true)}
        title="Delete chat"
        aria-label="Delete conversation"
        className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition text-red-400/60 hover:text-red-300 hover:bg-red-500/10 active:scale-95"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-black/90 border border-red-500/30 rounded-xl p-5 max-w-sm w-full mx-4 shadow-2xl shadow-red-500/10"
            >
              <h3 className="text-white font-mono text-sm font-bold mb-2">Delete this chat?</h3>
              <p className="text-white/50 text-xs font-mono mb-4">
                &ldquo;{title}&rdquo; will be removed. This can&rsquo;t be undone.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 text-white/60 text-xs font-mono hover:bg-white/10 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { setConfirmDelete(false); onDelete(); }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-semibold transition"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
