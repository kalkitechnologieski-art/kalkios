// apps/web/components/chat/PremiumChatTopBar.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Premium enterprise-grade chat top bar with luxury glassmorphism,
// advanced animations, and high-end micro-interactions.
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Menu, Pencil, Trash2, Check, X, Sparkles, Zap, Crown, Clock, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface PremiumChatTopBarProps {
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

export function PremiumChatTopBar({
  title, messageCount, autoTitled, modeLabel,
  onNew, onOpenHistory, onRename, onDelete, onAutoTitle, historyOpen,
}: PremiumChatTopBarProps) {
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

  // Get mode-specific styling
  const getModeConfig = () => {
    switch (modeLabel?.toLowerCase()) {
      case 'leads':
        return { color: 'from-amber-500 to-orange-600', icon: Crown };
      case 'image':
        return { color: 'from-pink-500 to-rose-600', icon: Zap };
      case 'video':
        return { color: 'from-red-500 to-pink-600', icon: Zap };
      default:
        return { color: 'from-cyan-500 to-purple-600', icon: Sparkles };
    }
  };

  const modeConfig = getModeConfig();
  const ModeIcon = modeConfig.icon;

  return (
    <>
      {/* Premium gradient glow background */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-cyan-500/5 via-purple-500/3 to-transparent pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'relative z-20 h-14 flex items-center gap-2 px-3 sm:px-4 shrink-0',
          'bg-gradient-to-r from-black/90 via-slate-950/90 to-black/90 backdrop-blur-2xl',
          'border-b border-white/10 shadow-lg shadow-black/50'
        )}
      >
        {/* Animated accent line */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-[1px]"
          animate={{
            background: [
              'linear-gradient(90deg, transparent, rgba(6,182,212,0.5), transparent)',
              'linear-gradient(90deg, transparent, rgba(168,85,247,0.5), transparent)',
              'linear-gradient(90deg, transparent, rgba(6,182,212,0.5), transparent)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        />

        {/* New Chat Button - Premium */}
        <motion.button
          onClick={onNew}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="group relative shrink-0 h-9 w-9 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Plus className="w-5 h-5 text-cyan-400/80 group-hover:text-cyan-300 transition-colors relative z-10" />
        </motion.button>

        {/* History Toggle - Premium */}
        <motion.button
          onClick={onOpenHistory}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            'group relative shrink-0 h-9 w-9 rounded-xl flex items-center justify-center overflow-hidden transition-all duration-300',
            historyOpen
              ? 'bg-gradient-to-br from-cyan-600/30 to-purple-600/30 shadow-lg shadow-cyan-500/20'
              : 'hover:shadow-lg hover:shadow-cyan-500/20'
          )}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Menu className={cn(
            'w-5 h-5 transition-colors relative z-10',
            historyOpen ? 'text-cyan-300' : 'text-cyan-400/80 group-hover:text-cyan-300'
          )} />
        </motion.button>

        {/* Separator */}
        <div className="w-px h-6 bg-gradient-to-b from-transparent via-white/20 to-transparent mx-1 shrink-0" />

        {/* Title Section - Premium */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          {isEditing ? (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 min-w-0 flex items-center gap-2"
            >
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKey}
                onBlur={commit}
                maxLength={60}
                className="flex-1 min-w-0 h-9 px-3 rounded-lg bg-black/60 border border-cyan-500/40 text-white text-sm font-medium outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all placeholder:text-white/30"
                placeholder="Conversation name…"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={commit}
                className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-all"
              >
                <Check className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={cancel}
                className="shrink-0 h-9 w-9 rounded-lg flex items-center justify-center bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </motion.div>
          ) : (
            <>
              {/* Title with gradient */}
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 min-w-0 text-left group"
              >
                <h2 className="text-sm font-semibold text-white/90 truncate group-hover:text-white transition-colors">
                  {title || 'New Conversation'}
                </h2>
                {autoTitled && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <Sparkles className="w-3 h-3 text-cyan-400/60" />
                    <span className="text-[9px] font-mono text-cyan-400/50 uppercase tracking-wider">AI Generated</span>
                  </div>
                )}
              </button>

              {/* Stats Badge - Premium */}
              <div className="hidden sm:flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <MessageCircle className="w-3.5 h-3.5 text-cyan-400/70" />
                  <span className="text-xs font-medium text-white/70">{messageCount}</span>
                </div>

                {modeLabel && (
                  <motion.div
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r ${modeConfig.color} bg-opacity-20 border border-white/10`}
                    whileHover={{ scale: 1.05 }}
                  >
                    <ModeIcon className="w-3.5 h-3.5 text-white/90" />
                    <span className="text-xs font-semibold text-white/90">{modeLabel}</span>
                  </motion.div>
                )}

                <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10">
                  <Clock className="w-3.5 h-3.5 text-purple-400/70" />
                  <span className="text-xs font-medium text-white/70">Active</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons - Premium */}
        {!isEditing && (
          <>
            <motion.button
              onClick={() => setIsEditing(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-cyan-400/70 hover:text-cyan-300 hover:bg-cyan-500/10 transition-all duration-300"
              title="Rename conversation"
            >
              <Pencil className="w-4 h-4" />
            </motion.button>

            {onAutoTitle && (
              <motion.button
                onClick={onAutoTitle}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-purple-400/70 hover:text-purple-300 hover:bg-purple-500/10 transition-all duration-300"
                title="Auto-generate name"
              >
                <Sparkles className="w-4 h-4" />
              </motion.button>
            )}
          </>
        )}

        {/* Delete Button - Premium with confirmation */}
        <motion.button
          onClick={() => setConfirmDelete(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="shrink-0 h-9 w-9 rounded-xl flex items-center justify-center text-red-400/70 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
          title="Delete conversation"
        >
          <Trash2 className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Premium Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
            onClick={() => setConfirmDelete(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-gradient-to-br from-slate-900 to-black border border-red-500/30 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl shadow-red-500/20"
            >
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-red-600/20 to-orange-600/20 rounded-2xl blur-xl opacity-50" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                    <Trash2 className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Delete Conversation?</h3>
                    <p className="text-white/50 text-xs">This action cannot be undone</p>
                  </div>
                </div>

                <div className="bg-black/40 rounded-xl p-4 mb-6 border border-white/10">
                  <p className="text-white/80 text-sm font-medium">&ldquo;{title}&rdquo;</p>
                  <p className="text-white/40 text-xs mt-1">{messageCount} messages will be permanently deleted</p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => { setConfirmDelete(false); onDelete(); }}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 transition-all text-sm font-semibold shadow-lg shadow-red-500/30"
                  >
                    Delete Permanently
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
