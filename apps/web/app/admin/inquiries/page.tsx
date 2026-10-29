'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Mail, MessageSquare, Phone, Search, Download, Inbox } from 'lucide-react';
import { toast } from 'sonner';

interface Inquiry {
  id: string;
  ref_code: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service_interest: string | null;
  budget_range: string | null;
  timeline: string | null;
  message: string;
  source: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost', 'spam'] as const;

const STATUS_STYLE: Record<string, string> = {
  new: 'bg-cyan-500/15 text-cyan-200 border-cyan-500/30',
  contacted: 'bg-blue-500/15 text-blue-200 border-blue-500/30',
  quoted: 'bg-purple-500/15 text-purple-200 border-purple-500/30',
  won: 'bg-green-500/15 text-green-200 border-green-500/30',
  lost: 'bg-white/10 text-white/60 border-white/20',
  spam: 'bg-red-500/15 text-red-200 border-red-500/30',
};

export default function AdminInquiriesPage() {
  const [rows, setRows] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('new');
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (query.trim()) params.set('q', query.trim());
      const res = await fetch(`/api/admin/inquiries?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Request failed (${res.status})`);
      setRows((json.inquiries ?? []) as Inquiry[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the inbox');
    } finally {
      setLoading(false);
    }
  }, [status, query]);

  useEffect(() => {
    const t = setTimeout(() => void load(), query ? 320 : 0);
    return () => clearTimeout(t);
  }, [load, query]);

  const changeStatus = async (id: string, next: string) => {
    const res = await fetch('/api/admin/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: next }),
    });
    if (!res.ok) {
      toast.error('Could not update status');
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: next } : r)));
    toast.success(`Marked ${next}`);
  };

  const saveNotes = async (id: string) => {
    const res = await fetch('/api/admin/inquiries', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, notes: notes[id] ?? '' }),
    });
    if (!res.ok) {
      toast.error('Could not save notes');
      return;
    }
    toast.success('Notes saved');
  };

  const exportCsv = () => {
    if (rows.length === 0) {
      toast.error('Nothing to export');
      return;
    }
    const header = ['ref', 'date', 'status', 'name', 'email', 'phone', 'company', 'interest', 'budget', 'timeline', 'source', 'message'];
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = rows.map((r) => [
      r.ref_code, new Date(r.created_at).toISOString(), r.status, r.name, r.email, r.phone,
      r.company, r.service_interest, r.budget_range, r.timeline, r.source, r.message,
    ].map(cell).join(','));
    const blob = new Blob([[header.map(cell).join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kalki-enquiries-${status}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of rows) map.set(r.status, (map.get(r.status) ?? 0) + 1);
    return map;
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-mono flex items-center gap-2">
            <Inbox className="w-6 h-6 text-cyan-400" /> Enquiries
          </h1>
          <p className="text-white/50 text-sm mt-1">Every lead from the contact form and quote CTAs, newest first.</p>
        </div>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/12 text-white/70 text-sm hover:bg-white/5 transition"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          {(['new', 'contacted', 'quoted', 'won', 'lost', 'spam', 'all'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={
                status === s
                  ? 'px-3.5 py-1.5 rounded-full text-xs font-medium border border-cyan-500/50 bg-cyan-500/15 text-cyan-200'
                  : 'px-3.5 py-1.5 rounded-full text-xs font-medium border border-white/12 text-white/55 hover:text-white/85 transition'
              }
            >
              {s}{s !== 'all' && counts.get(s) ? ` (${counts.get(s)})` : ''}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 rounded-lg border border-white/12 px-3 py-2">
          <Search className="w-4 h-4 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="name, email, company, ref"
            className="bg-transparent text-sm text-white placeholder:text-white/30 outline-none w-48"
          />
        </label>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 text-sm py-8"><Loader2 className="w-4 h-4 animate-spin" /> Loading inbox…</div>
      ) : error ? (
        <div className="kalki-panel rounded-xl p-5 text-sm">
          <p className="text-white font-medium">Inbox not connected</p>
          <p className="text-white/60 mt-1">{error}</p>
          <p className="text-white/40 mt-2 font-mono text-xs">supabase/migrations/20261029000003_inquiries.sql</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="kalki-panel rounded-xl p-8 text-center text-white/50 text-sm">
          No {status === 'all' ? '' : status} enquiries. Leads from /contact land here the moment they are submitted.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const isOpen = open === r.id;
            return (
              <article key={r.id} className="kalki-panel rounded-xl p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] border font-medium ${STATUS_STYLE[r.status] ?? STATUS_STYLE.lost}`}>{r.status}</span>
                      <span className="text-white font-semibold text-sm">{r.name}</span>
                      {r.company && <span className="text-white/45 text-sm">{r.company}</span>}
                      <span className="text-white/35 text-xs font-mono">{r.ref_code}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-xs">
                      <a href={`mailto:${r.email}`} className="inline-flex items-center gap-1.5 text-cyan-300/80 hover:text-cyan-200"><Mail className="w-3.5 h-3.5" />{r.email}</a>
                      {r.phone && (
                        <a href={`tel:${r.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 text-green-300/80 hover:text-green-200"><Phone className="w-3.5 h-3.5" />{r.phone}</a>
                      )}
                      <span className="text-white/40">{new Date(r.created_at).toLocaleString('en-IN')}</span>
                      <span className="text-white/40">via {r.source.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 text-[11px] text-white/55">
                      {r.service_interest && <span className="px-2 py-0.5 rounded-md bg-white/6 border border-white/10">{r.service_interest}</span>}
                      {r.budget_range && <span className="px-2 py-0.5 rounded-md bg-white/6 border border-white/10">{r.budget_range}</span>}
                      {r.timeline && <span className="px-2 py-0.5 rounded-md bg-white/6 border border-white/10">{r.timeline}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={r.status}
                      onChange={(e) => void changeStatus(r.id, e.target.value)}
                      className="rounded-lg bg-white/5 border border-white/12 px-2 py-1.5 text-xs text-white outline-none"
                      aria-label="Status"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button
                      type="button"
                      onClick={() => { setOpen(isOpen ? null : r.id); setNotes((prev) => ({ ...prev, [r.id]: r.admin_notes ?? '' })); }}
                      className="p-2 rounded-lg border border-white/12 text-white/60 hover:text-cyan-300 transition"
                      aria-label="Open enquiry"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-white/8 space-y-3">
                    <p className="text-white/75 text-sm leading-relaxed whitespace-pre-wrap">{r.message}</p>
                    <textarea
                      rows={3}
                      value={notes[r.id] ?? ''}
                      onChange={(e) => setNotes((prev) => ({ ...prev, [r.id]: e.target.value }))}
                      placeholder="Internal notes — what was promised, next follow-up date…"
                      className="w-full rounded-lg bg-white/5 border border-white/12 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-cyan-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => void saveNotes(r.id)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 text-white text-xs font-semibold hover:scale-[1.02] transition"
                    >
                      Save notes
                    </button>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
