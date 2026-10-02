// == KALKI B3 COMMAND ==
// Order Command: full lifecycle + timeline composer + invoice preview.
// -----------------------------------------------------------------------------

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { ShoppingBag, X, Download, Send, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimelineComposer } from '@/components/timeline/TimelineComposer';
import { TimelineFeed } from '@/components/timeline/TimelineFeed';
import { logAdminAction } from '@/lib/admin/actions';
import { toast } from 'sonner';

interface OrderRow {
  id: string;
  client_id: string | null;
  service_id: string | null;
  amount: number;
  status: string;
  buyer_name: string | null;
  buyer_email: string | null;
  buyer_phone: string | null;
  created_at: string;
  discount_code: string | null;
  discount_amount: number | null;
  tax_amount: number | null;
  subtotal: number | null;
}

const STATUSES = ['pending', 'paid', 'failed', 'refunded'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  const refetch = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);
    setOrders((data ?? []) as OrderRow[]);
    setLoading(false);
  };

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () => statusFilter === 'all' ? orders : orders.filter((o) => o.status === statusFilter),
    [orders, statusFilter]
  );

  const kpis = useMemo(() => ({
    pending: orders.filter((o) => o.status === 'pending').length,
    paid: orders.filter((o) => o.status === 'paid').length,
    failed: orders.filter((o) => o.status === 'failed').length,
    refunded: orders.filter((o) => o.status === 'refunded').length,
    revenue: orders.filter((o) => o.status === 'paid').reduce((s, o) => s + o.amount, 0),
  }), [orders]);

  const changeStatus = async (row: OrderRow, status: string) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', row.id);
    if (error) { toast.error('Update failed'); return; }
    await logAdminAction({
      action: 'order_status_change',
      targetTable: 'orders',
      targetId: row.id,
      payload: { from: row.status, to: status },
    });
    toast.success(`Status → ${status}`);
    await refetch();
    if (selected?.id === row.id) setSelected({ ...row, status });
  };

  const columns = [
    { key: 'id', header: 'Order', render: (v: string) => <span className="font-mono text-xs">{v.slice(0, 8)}</span> },
    { key: 'buyer_name', header: 'Client', searchable: true },
    { key: 'amount', header: 'Amount', render: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { key: 'discount_code', header: 'Code', render: (v: string | null) => v ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (v: string) => (
        <Badge variant={v === 'paid' ? 'default' : v === 'failed' ? 'destructive' : 'secondary'}>{v}</Badge>
      ),
    },
    { key: 'created_at', header: 'Date', render: (v: string) => new Date(v).toLocaleDateString('en-IN') },
  ];

  const actions = (row: OrderRow) => (
    <select
      value={row.status}
      onChange={(e) => void changeStatus(row, e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className="bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs font-mono outline-none"
    >
      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-3xl font-bold text-white font-mono flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-cyan-400" />
          Orders
        </h1>
        <div className="flex items-center gap-2 flex-wrap">
          {['all', ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1 text-xs font-mono rounded-full transition ${
                statusFilter === s ? 'bg-cyan-600/30 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-white/50 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi label="Pending" value={kpis.pending} color="text-yellow-400" />
        <Kpi label="Paid" value={kpis.paid} color="text-green-400" />
        <Kpi label="Failed" value={kpis.failed} color="text-red-400" />
        <Kpi label="Refunded" value={kpis.refunded} color="text-purple-400" />
        <Kpi label="Revenue" value={`₹${kpis.revenue.toLocaleString('en-IN')}`} color="text-cyan-400" />
      </div>

      <DataTable
        data={filtered}
        columns={columns}
        keyExtractor={(r) => r.id}
        loading={loading}
        actions={actions}
        searchPlaceholder="Search orders…"
        onRowClick={(row) => setSelected(row as OrderRow)}
      />

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex justify-end"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xl bg-black border-l border-cyan-500/20 h-full flex flex-col"
            >
              <div className="p-4 border-b border-cyan-500/10 flex items-center justify-between">
                <div>
                  <h2 className="text-white font-mono text-sm font-bold">Order {selected.id.slice(0, 8)}</h2>
                  <p className="text-white/40 text-xs font-mono">{selected.buyer_email}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1.5 rounded hover:bg-white/10 text-white/40" aria-label="Close">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <section>
                  <h3 className="text-xs font-mono text-cyan-400/60 uppercase mb-2">Summary</h3>
                  <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-3 space-y-2 text-xs font-mono">
                    <Row label="Subtotal" value={`₹${(selected.subtotal ?? selected.amount).toLocaleString('en-IN')}`} />
                    {selected.discount_amount ? <Row label="Discount" value={`− ₹${selected.discount_amount.toLocaleString('en-IN')}`} /> : null}
                    {selected.tax_amount ? <Row label="Tax" value={`₹${selected.tax_amount.toLocaleString('en-IN')}`} /> : null}
                    <Row label="Total" value={`₹${selected.amount.toLocaleString('en-IN')}`} bold />
                  </div>
                </section>

                <section>
                  <h3 className="text-xs font-mono text-cyan-400/60 uppercase mb-2">Client</h3>
                  <div className="text-white/70 text-sm font-mono space-y-1">
                    <p>{selected.buyer_name ?? '—'}</p>
                    <p className="text-white/40">{selected.buyer_email ?? '—'}</p>
                    {selected.buyer_phone && <p className="text-white/40">{selected.buyer_phone}</p>}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-mono text-cyan-400/60 uppercase">Timeline</h3>
                  </div>
                  <TimelineComposer orderId={selected.id} onPosted={() => void refetch()} />
                  <div className="mt-3">
                    <TimelineFeed orderId={selected.id} emptyMessage="No timeline posts yet" />
                  </div>
                </section>

                <section className="flex flex-wrap gap-2">
                  <LuxuryButton variant="outline" size="sm" label="Resend email" icon={<Send className="w-3 h-3" />} />
                  <LuxuryButton variant="outline" size="sm" label="Download invoice" icon={<Download className="w-3 h-3" />} />
                  <LuxuryButton
                    variant="destructive"
                    size="sm"
                    label="Refund"
                    icon={<RefreshCw className="w-3 h-3" />}
                    onClick={() => void changeStatus(selected, 'refunded')}
                  />
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Kpi({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-3">
      <p className="text-white/40 text-[10px] font-mono uppercase">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? 'text-white font-bold' : 'text-white/70'}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
