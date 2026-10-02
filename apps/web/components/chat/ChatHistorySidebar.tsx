// == SIDDHI F1 ==
// History panel — desktop rail + mobile sheet.
// -----------------------------------------------------------------------------

'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, X, Trash2, Pencil, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/lib/conversations/types';

export interface ChatHistorySidebarProps {
  open: boolean;
  onClose: () => void;
  list: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
}

interface Bucket { label: string; items: Conversation[]; }

function groupByDate(list: Conversation[]): Bucket[] {
  const now = Date.now();
  const day = 86_400_000;
  const today: Conversation[] = [], yesterday: Conversation[] = [],
        week: Conversation[] = [], month: Conversation[] = [], older: Conversation[] = [];

  for (const c of list) {
    const diff = now - c.updatedAt;
    if (diff < day) today.push(c);
    else if (diff < 2 * day) yesterday.push(c);
    else if (diff < 7 * day) week.push(c);
    else if (diff < 30 * day) month.push(c);
    else older.push(c);
  }

  const out: Bucket[] = [];
  if (today.length) out.push({ label: 'Today', items: today });
  if (yesterday.length) out.push({ label: 'Yesterday', items: yesterday });
  if (week.length) out.push({ label: 'Previous 7 days', items: week });
  if (month.length) out.push({ label: 'Previous 30 days', items: month });
  if (older.length) out.push({ label: 'Older', items: older });
  return out;
}

export function ChatHistorySidebar({
  open, onClose, list, activeId, onSelect, onNew, onDelete, onRename,
}: ChatHistorySidebarProps) {
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return list;
    const q = query.toLowerCase();
    return list.filter((c) => c.title.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q));
  }, [list, query]);

  const buckets = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            onClick={onClose}
          />

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="fixed top-14 bottom-0 left-0 z-40 w-[290px] max-w-[86vw] bg-black/95 backdrop-blur-2xl border-r border-cyan-500/10 flex flex-col"
          >
            <div className="p-3 border-b border-cyan-500/10 flex items-center gap-2">
              <button
                onClick={onNew}
                className="flex-1 h-9 rounded-lg flex items-center justify-center gap-2 bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-semibold transition active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                New chat
              </button>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/5 transition md:hidden"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 border-b border-cyan-500/10">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-400/40" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search chats…"
                  className="w-full h-8 pl-8 pr-2 rounded-lg bg-black/40 border border-cyan-500/10 focus:border-cyan-500/40 text-white text-xs font-mono placeholder-white/30 outline-none transition"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {buckets.length === 0 && (
                <div className="text-center py-12 text-white/30 text-xs font-mono">
                  {query ? 'No matches' : 'No chats yet'}
                </div>
              )}

              {buckets.map((bucket) => (
                <div key={bucket.label} className="mb-2">
                  <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-cyan-400/40 font-mono">
                    {bucket.label}
                  </div>
                  {bucket.items.map((c) => {
                    const isActive = c.id === activeId;
                    const isEditing = editingId === c.id;
                    return (
                      <div
                        key={c.id}
                        className={cn(
                          'group relative mx-1.5 rounded-lg transition',
                          isActive
                            ? 'bg-cyan-500/10 border border-cyan-500/20'
                            : 'hover:bg-white/5 border border-transparent'
                        )}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1 p-1.5">
                            <input
                              autoFocus
                              value={draft}
                              onChange={(e) => setDraft(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') { onRename(c.id, draft); setEditingId(null); }
                                else if (e.key === 'Escape') { setEditingId(null); }
                              }}
                              onBlur={() => { onRename(c.id, draft); setEditingId(null); }}
                              className="flex-1 min-w-0 h-7 px-2 rounded-md bg-black/60 border border-cyan-500/30 text-white text-xs font-mono outline-none"
                            />
                          </div>
                        ) : (
                          <button
                            onClick={() => { onSelect(c.id); onClose(); }}
                            className="w-full text-left p-2 pr-14 flex items-start gap-2"
                          >
                            <MessageSquare className={cn('w-3.5 h-3.5 mt-0.5 flex-shrink-0', isActive ? 'text-cyan-400' : 'text-white/30')} />
                            <div className="flex-1 min-w-0">
                              <div className={cn('text-xs font-mono truncate', isActive ? 'text-white' : 'text-white/80')}>
                                {c.title}
                              </div>
                              {c.preview && (
                                <div className="text-[10px] font-mono text-white/30 truncate mt-0.5">{c.preview}</div>
                              )}
                              <div className="text-[9px] font-mono text-cyan-400/30 mt-0.5">{c.messageCount} msg</div>
                            </div>
                          </button>
                        )}

                        {!isEditing && (
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingId(c.id); setDraft(c.title); }}
                              title="Rename"
                              className="h-6 w-6 rounded flex items-center justify-center text-white/40 hover:text-cyan-400 hover:bg-cyan-500/10 transition"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                              title="Delete"
                              className="h-6 w-6 rounded flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-cyan-500/10 text-[10px] font-mono text-cyan-400/30 text-center">
              {list.length} conversation{list.length === 1 ? '' : 's'}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
