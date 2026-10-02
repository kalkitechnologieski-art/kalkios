// == KALKI B2 ENGINES ==
// == KALKI B3 COMMAND ==
// Admin referral command center: overview, events, rewards, fraud.
// -----------------------------------------------------------------------------

'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/badge';
import { Users, TrendingUp, AlertTriangle } from 'lucide-react';

interface ReferralEvent {
  id: string;
  referrer_id: string;
  referee_id: string | null;
  referral_code: string;
  status: string;
  referrer_reward_amount: number | null;
  created_at: string;
}

export default function AdminReferralsPage() {
  const [events, setEvents] = useState<ReferralEvent[]>([]);
  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = createClient() as any;

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('referral_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);
      setEvents((data ?? []) as ReferralEvent[]);
      setLoading(false);
    };
    void fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => ({
    total: events.length,
    converted: events.filter((e) => e.status === 'converted' || e.status === 'rewarded').length,
    fraud: events.filter((e) => e.status === 'fraud').length,
    paid: events
      .filter((e) => e.status === 'rewarded')
      .reduce((s, e) => s + (e.referrer_reward_amount ?? 0), 0),
  }), [events]);

  const conversionRate = stats.total > 0
    ? Math.round((stats.converted / stats.total) * 100)
    : 0;

  const columns = [
    { key: 'referral_code', header: 'Code', searchable: true },
    { key: 'status', header: 'Status', render: (v: string) => (
      <Badge variant={v === 'rewarded' ? 'default' : v === 'fraud' ? 'destructive' : 'secondary'}>{v}</Badge>
    )},
    { key: 'referrer_reward_amount', header: 'Reward', render: (v: number | null) => v ? `₹${v}` : '—' },
    { key: 'created_at', header: 'Date', render: (v: string) => new Date(v).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono flex items-center gap-2">
        <Users className="w-6 h-6 text-cyan-400" />
        Referrals
      </h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-mono">Total events</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-mono">Conversion</p>
          <p className="text-2xl font-bold text-green-400">{conversionRate}%</p>
          <p className="text-[10px] text-white/30 font-mono flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> {stats.converted} converted
          </p>
        </div>
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-mono">Rewards paid</p>
          <p className="text-2xl font-bold text-cyan-400">₹{stats.paid.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white/5 border border-red-500/10 rounded-xl p-4">
          <p className="text-white/40 text-xs font-mono">Fraud flags</p>
          <p className="text-2xl font-bold text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-4 h-4" />
            {stats.fraud}
          </p>
        </div>
      </div>

      <DataTable
        data={events}
        columns={columns}
        keyExtractor={(row) => row.id}
        loading={loading}
        searchPlaceholder="Search referrals…"
      />
    </div>
  );
}
