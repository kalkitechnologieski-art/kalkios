'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2, Plus, Quote, Star, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

interface TestimonialRow {
  id: string;
  author_name: string;
  author_role: string | null;
  author_company: string | null;
  city: string | null;
  quote: string;
  rating: number;
  is_approved: boolean;
  sort_order: number;
  created_at: string;
}

const emptyDraft = {
  authorName: '',
  authorRole: '',
  authorCompany: '',
  city: '',
  quote: '',
  rating: 5,
  isApproved: true,
};

export default function AdminTestimonialsPage() {
  const [rows, setRows] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch('/api/admin/testimonials', { cache: 'no-store' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? `Request failed (${res.status})`);
      setRows((json.testimonials ?? []) as TestimonialRow[]);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load testimonials');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const create = async () => {
    if (draft.quote.trim().length < 20) {
      toast.error('Quote needs at least 20 characters.');
      return;
    }
    if (!draft.authorName.trim()) {
      toast.error('Author name is required.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? 'Could not save');
      toast.success('Testimonial published.');
      setDraft(emptyDraft);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const patch = async (id: string, body: Record<string, unknown>, label: string) => {
    const res = await fetch('/api/admin/testimonials', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...body }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json?.error ?? 'Update failed');
      return;
    }
    toast.success(label);
    await load();
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/admin/testimonials?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      toast.error(json?.error ?? 'Delete failed');
      return;
    }
    toast.success('Testimonial removed.');
    await load();
  };

  const field = 'w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm placeholder:text-white/30 focus:border-cyan-500/40';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white font-mono">Testimonials</h1>
        <p className="text-white/50 text-sm mt-2 max-w-2xl">
          Only publish quotes you received from a real, named client about work that actually shipped. These appear on
          the homepage, About and every product page.
        </p>
      </div>

      <section className="kalki-panel rounded-2xl p-5 space-y-4">
        <h2 className="text-white font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4 text-cyan-400" /> Add a testimonial
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input className={field} placeholder="Client name *" value={draft.authorName} onChange={(e) => setDraft({ ...draft, authorName: e.target.value })} />
          <input className={field} placeholder="Role (e.g. Founder)" value={draft.authorRole} onChange={(e) => setDraft({ ...draft, authorRole: e.target.value })} />
          <input className={field} placeholder="Company" value={draft.authorCompany} onChange={(e) => setDraft({ ...draft, authorCompany: e.target.value })} />
          <input className={field} placeholder="City" value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} />
        </div>
        <textarea
          className={`${field} min-h-[110px] resize-y`}
          placeholder="What the client said, in their words (20–900 characters) *"
          maxLength={900}
          value={draft.quote}
          onChange={(e) => setDraft({ ...draft, quote: e.target.value })}
        />
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-white/70 text-sm">
            Rating
            <select className={`${field} w-20`} value={draft.rating} onChange={(e) => setDraft({ ...draft, rating: Number(e.target.value) })}>
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="flex items-center gap-2 text-white/70 text-sm">
            <input type="checkbox" checked={draft.isApproved} onChange={(e) => setDraft({ ...draft, isApproved: e.target.checked })} />
            Publish immediately
          </label>
          <span className="text-white/40 text-xs ml-auto">{draft.quote.trim().length}/900</span>
          <button
            type="button"
            onClick={create}
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600 text-white text-sm font-semibold disabled:opacity-60 hover:scale-[1.02] transition"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save testimonial'}
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex items-center gap-2 text-white/50 text-sm py-6"><Loader2 className="w-4 h-4 animate-spin" /> Loading testimonials…</div>
      ) : loadError ? (
        <div className="kalki-panel rounded-xl p-5 text-sm">
          <p className="text-white font-medium">Not connected yet</p>
          <p className="text-white/60 mt-1">{loadError}</p>
          <p className="text-white/50 mt-2 font-mono text-xs">
            Apply supabase/migrations/20261029000002_testimonials.sql in the Supabase SQL editor, then reload this page.
          </p>
          <button type="button" onClick={() => void load()} className="mt-3 px-4 py-2 rounded-lg border border-cyan-500/30 text-cyan-300 text-sm hover:bg-cyan-500/10 transition">
            Retry
          </button>
        </div>
      ) : rows.length === 0 ? (
        <div className="kalki-panel rounded-xl p-6 text-center text-white/50 text-sm">
          No testimonials yet. Marketing pages currently show the written-commitments panel instead — that is the honest
          fallback until real quotes are added here.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => (
            <article key={r.id} className="kalki-panel rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-white text-sm font-semibold">
                    <Quote className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span className="truncate">{r.author_name}</span>
                    <span className="text-white/40 font-normal truncate">
                      {[r.author_role, r.author_company, r.city].filter(Boolean).join(' · ')}
                    </span>
                  </div>
                  <p className="text-white/70 text-sm mt-2 leading-relaxed">{r.quote}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-3 h-3 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-white/20'}`} />
                      ))}
                    </span>
                    <span>{new Date(r.created_at).toLocaleDateString('en-IN')}</span>
                    <span className={r.is_approved ? 'text-green-400' : 'text-amber-400'}>
                      {r.is_approved ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => void patch(r.id, { isApproved: !r.is_approved }, r.is_approved ? 'Hidden from the site.' : 'Published.')}
                    className="p-2 rounded-lg border border-white/10 text-white/70 hover:text-cyan-300 hover:border-cyan-500/30 transition"
                    aria-label={r.is_approved ? 'Unpublish' : 'Publish'}
                    title={r.is_approved ? 'Hide from site' : 'Publish'}
                  >
                    {r.is_approved ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(r.id)}
                    className="p-2 rounded-lg border border-white/10 text-white/70 hover:text-red-400 hover:border-red-500/30 transition"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
