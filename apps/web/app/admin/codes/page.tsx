// == KALKI B2 ENGINES ==
// == KALKI B3 COMMAND ==
// Admin code management: list, create, analytics.
// -----------------------------------------------------------------------------

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { Plus, Tag } from 'lucide-react';
import type { Code } from '@/lib/codes/types';

export default function AdminCodesPage() {
  const [codes, setCodes] = useState<Code[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('codes').select('*').order('created_at', { ascending: false });
      setCodes((data ?? []) as Code[]);
      setLoading(false);
    };
    void fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => ({
    total: codes.length,
    active: codes.filter((c) => c.status === 'active').length,
    uses: codes.reduce((s, c) => s + c.total_uses, 0),
    revenue: codes.reduce((s, c) => s + c.total_revenue_generated, 0),
  }), [codes]);

  const columns = [
    { key: 'code', header: 'Code', searchable: true },
    { key: 'code_type', header: 'Type', render: (v: string) => <Badge variant="outline">{v}</Badge> },
    { key: 'discount_value', header: 'Discount', render: (v: number, row: Code) =>
      row.discount_type === 'percentage' ? `${v}%` : `₹${v}`,
    },
    { key: 'total_uses', header: 'Uses' },
    { key: 'total_revenue_generated', header: 'Revenue', render: (v: number) => `₹${v.toLocaleString('en-IN')}` },
    { key: 'status', header: 'Status', render: (v: string) => (
      <Badge variant={v === 'active' ? 'default' : v === 'expired' ? 'destructive' : 'secondary'}>{v}</Badge>
    )},
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white font-mono flex items-center gap-2">
          <Tag className="w-6 h-6 text-cyan-400" />
          Codes
        </h1>
        <LuxuryButton variant="cyber" size="default" label="New code" icon={<Plus className="w-4 h-4" />} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-mono">Total codes</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-mono">Active</p>
          <p className="text-2xl font-bold text-green-400">{stats.active}</p>
        </div>
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-mono">Total uses</p>
          <p className="text-2xl font-bold text-white">{stats.uses}</p>
        </div>
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-mono">Revenue</p>
          <p className="text-2xl font-bold text-cyan-400">₹{stats.revenue.toLocaleString('en-IN')}</p>
        </div>
      </div>

      <DataTable
        data={codes}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        searchPlaceholder="Search codes…"
      />
    </div>
  );
}
