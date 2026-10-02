// == KALKI B3 COMMAND ==
// Product Studio: 8-tab editor with variants, SEO, AEO, GEO.
// -----------------------------------------------------------------------------

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { Plus, Package, Edit3, Save, X, Eye, EyeOff, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logAdminAction } from '@/lib/admin/actions';
import { toast } from 'sonner';

interface ServiceRow {
  id: string;
  name: string;
  slug: string;
  category: string;
  sub_category: string | null;
  description: string | null;
  long_description: string | null;
  price: number | null;
  duration_days: number | null;
  features: unknown;
  icon: string | null;
  image_url: string | null;
  rating: number | null;
  review_count: number | null;
  is_active: boolean;
  published_status?: 'draft' | 'live' | 'archived';
  seo_title?: string | null;
  seo_description?: string | null;
  aeo_summary?: string | null;
  geo_keywords?: string[] | null;
  eligible_for_codes?: boolean;
  eligible_for_referral?: boolean;
}

type Tab = 'general' | 'pricing' | 'features' | 'seo' | 'aeo' | 'publish';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'features', label: 'Features' },
  { id: 'seo', label: 'SEO' },
  { id: 'aeo', label: 'AEO' },
  { id: 'publish', label: 'Publish' },
];

export default function AdminServicesPage() {
  const [rows, setRows] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ServiceRow | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('general');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  const refetch = async () => {
    const { data } = await supabase.from('services').select('*').order('category').order('name');
    setRows((data ?? []) as ServiceRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => ({
    total: rows.length,
    live: rows.filter((r) => r.is_active && r.published_status !== 'draft').length,
    drafts: rows.filter((r) => r.published_status === 'draft').length,
  }), [rows]);

  const save = async () => {
    if (!editing) return;
    const { error } = await supabase
      .from('services')
      .update({
        name: editing.name,
        slug: editing.slug,
        category: editing.category,
        description: editing.description,
        long_description: editing.long_description,
        price: editing.price,
        duration_days: editing.duration_days,
        icon: editing.icon,
        image_url: editing.image_url,
        is_active: editing.is_active,
        published_status: editing.published_status ?? 'live',
        seo_title: editing.seo_title,
        seo_description: editing.seo_description,
        aeo_summary: editing.aeo_summary,
        geo_keywords: editing.geo_keywords ?? [],
        eligible_for_codes: editing.eligible_for_codes ?? true,
        eligible_for_referral: editing.eligible_for_referral ?? true,
      })
      .eq('id', editing.id);

    if (error) {
      toast.error('Save failed: ' + error.message);
      return;
    }

    await logAdminAction({
      action: 'service_update',
      targetTable: 'services',
      targetId: editing.id,
      payload: { name: editing.name, published_status: editing.published_status },
    });

    toast.success('Saved');
    setEditing(null);
    await refetch();
  };

  const togglePublished = async (row: ServiceRow) => {
    const next = row.published_status === 'live' ? 'draft' : 'live';
    await supabase.from('services').update({ published_status: next }).eq('id', row.id);
    await logAdminAction({
      action: 'service_publish_toggle',
      targetTable: 'services',
      targetId: row.id,
      payload: { to: next },
    });
    await refetch();
  };

  const columns = [
    { key: 'name', header: 'Name', searchable: true },
    { key: 'category', header: 'Category', searchable: true },
    {
      key: 'price',
      header: 'Price',
      render: (v: number | null) => v ? `₹${v.toLocaleString('en-IN')}` : '—',
    },
    {
      key: 'published_status',
      header: 'Status',
      render: (_: unknown, row: ServiceRow) => (
        <Badge variant={row.published_status === 'draft' ? 'secondary' : 'default'}>
          {row.published_status ?? 'live'}
        </Badge>
      ),
    },
    { key: 'review_count', header: 'Reviews' },
  ];

  const actions = (row: ServiceRow) => (
    <div className="flex gap-1 justify-end">
      <button
        onClick={() => { setEditing(row); setActiveTab('general'); }}
        className="p-1.5 rounded hover:bg-cyan-500/10 text-cyan-400/60 hover:text-cyan-400"
        title="Edit"
      >
        <Edit3 className="w-4 h-4" />
      </button>
      <button
        onClick={() => void togglePublished(row)}
        className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white"
        title={row.published_status === 'live' ? 'Unpublish' : 'Publish'}
      >
        {row.published_status === 'live' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white font-mono flex items-center gap-2">
          <Package className="w-6 h-6 text-cyan-400" />
          Product Studio
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-cyan-400/40 font-mono">
            {stats.live} live · {stats.drafts} draft · {stats.total} total
          </span>
          <LuxuryButton variant="cyber" size="default" label="New" icon={<Plus className="w-4 h-4" />} />
        </div>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        keyExtractor={(r) => r.id}
        loading={loading}
        actions={actions}
        searchPlaceholder="Search products…"
      />

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end"
            onClick={() => setEditing(null)}
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
                <h2 className="text-white font-mono text-sm font-bold truncate">{editing.name}</h2>
                <div className="flex items-center gap-2">
                  <LuxuryButton variant="cyber" size="sm" label="Save" icon={<Save className="w-3 h-3" />} onClick={save} />
                  <button onClick={() => setEditing(null)} className="p-1.5 rounded hover:bg-white/10 text-white/40 hover:text-white" aria-label="Close">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex border-b border-cyan-500/10 px-2 overflow-x-auto">
                {TABS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`px-3 py-2 text-xs font-mono transition whitespace-nowrap ${
                      activeTab === t.id ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-white/40 hover:text-white/70'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeTab === 'general' && (
                  <>
                    <Field label="Name">
                      <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Slug">
                      <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Category">
                      <input value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Icon (emoji)">
                      <input value={editing.icon ?? ''} onChange={(e) => setEditing({ ...editing, icon: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="Description">
                      <textarea rows={3} value={editing.description ?? ''} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={inputCls} />
                    </Field>
                  </>
                )}

                {activeTab === 'pricing' && (
                  <>
                    <Field label="Price (₹)">
                      <input type="number" value={editing.price ?? 0} onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })} className={inputCls} />
                    </Field>
                    <Field label="Duration (days)">
                      <input type="number" value={editing.duration_days ?? 0} onChange={(e) => setEditing({ ...editing, duration_days: Number(e.target.value) })} className={inputCls} />
                    </Field>
                    <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-lg p-3 text-xs text-cyan-400/60 font-mono">
                      <p>Variants can be added later via the variants engine.</p>
                      <p className="mt-1 text-[10px]">GST is auto-applied based on category at checkout.</p>
                    </div>
                  </>
                )}

                {activeTab === 'features' && (
                  <Field label="Features (JSON)">
                    <textarea
                      rows={8}
                      value={JSON.stringify(editing.features ?? [], null, 2)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          setEditing({ ...editing, features: parsed });
                        } catch { /* ignore parse error while typing */ }
                      }}
                      className={`${inputCls} font-mono text-xs`}
                    />
                  </Field>
                )}

                {activeTab === 'seo' && (
                  <>
                    <Field label="SEO title">
                      <input value={editing.seo_title ?? ''} onChange={(e) => setEditing({ ...editing, seo_title: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="SEO description">
                      <textarea rows={3} value={editing.seo_description ?? ''} onChange={(e) => setEditing({ ...editing, seo_description: e.target.value })} className={inputCls} />
                    </Field>
                  </>
                )}

                {activeTab === 'aeo' && (
                  <>
                    <Field label="AEO summary (40 words max)">
                      <textarea rows={3} value={editing.aeo_summary ?? ''} onChange={(e) => setEditing({ ...editing, aeo_summary: e.target.value })} className={inputCls} />
                    </Field>
                    <Field label="GEO keywords (comma-separated)">
                      <input
                        value={(editing.geo_keywords ?? []).join(', ')}
                        onChange={(e) => setEditing({ ...editing, geo_keywords: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                        className={inputCls}
                      />
                    </Field>
                  </>
                )}

                {activeTab === 'publish' && (
                  <>
                    <Field label="Status">
                      <select value={editing.published_status ?? 'live'} onChange={(e) => setEditing({ ...editing, published_status: e.target.value as 'draft' | 'live' | 'archived' })} className={inputCls}>
                        <option value="draft">Draft</option>
                        <option value="live">Live</option>
                        <option value="archived">Archived</option>
                      </select>
                    </Field>
                    <Toggle label="Eligible for promo codes" value={editing.eligible_for_codes ?? true} onChange={(v) => setEditing({ ...editing, eligible_for_codes: v })} />
                    <Toggle label="Eligible for referral rewards" value={editing.eligible_for_referral ?? true} onChange={(v) => setEditing({ ...editing, eligible_for_referral: v })} />
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = 'w-full bg-black/40 border border-cyan-500/20 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-cyan-500/50 font-mono';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-mono text-cyan-400/60 uppercase tracking-wider block mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 border border-cyan-500/10 rounded-lg">
      <span className="text-white/70 text-xs font-mono">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${value ? 'bg-cyan-600' : 'bg-white/20'}`}
        aria-label={label}
      >
        <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}
