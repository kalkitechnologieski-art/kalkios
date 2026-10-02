// ═══ SIDDHI v4.0 BATCH 3 ═══
// == KALKI B3 COMMAND ==
// Live layer-health dashboard. Reads siddhi_layer_health view (falls back
// to siddhi_telemetry raw query if view missing).
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { StatCard } from '@/components/ui/StatCard';

interface LayerHealth {
  layer: string;
  total_requests?: number;
  avg_latency_ms?: number;
  success_rate?: number;
  last_seen?: string;
}

export default function AdminAnalyticsPage() {
  const [health, setHealth] = useState<LayerHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const supabase = createClient() as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          order: (c: string, opts: { ascending: boolean }) => Promise<{ data?: LayerHealth[] | null; error?: { message: string } | null }>;
          limit?: (n: number) => Promise<{ data?: LayerHealth[] | null; error?: { message: string } | null }>;
        };
      };
    };

    const fetchHealth = async () => {
      try {
        // Prefer the view
        const res = await supabase
          .from('siddhi_layer_health')
          .select('*')
          .order('last_seen', { ascending: false });

        if (res.error) {
          // View may not exist yet — try raw telemetry
          const alt = await supabase
            .from('siddhi_telemetry')
            .select('layer, duration_ms, success')
            .order('created_at', { ascending: false });
          if (alt.error) throw new Error(alt.error.message);
          if (mounted) setHealth((alt.data as unknown as LayerHealth[]) ?? []);
        } else {
          if (mounted) setHealth(res.data ?? []);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchHealth();
    const interval = setInterval(fetchHealth, 30_000);
    return () => { mounted = false; clearInterval(interval); };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white font-mono">Layer Health</h1>
        <span className="text-xs text-cyan-400/40 font-mono">Auto-refreshes every 30s</span>
      </div>

      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          <p className="font-mono">Telemetry table not yet migrated. Run SQL migration for siddhi_telemetry + siddhi_layer_health.</p>
          <p className="text-xs text-red-400/60 mt-1">{error}</p>
        </div>
      )}

      {!loading && !error && health.length === 0 && (
        <div className="text-center py-12 text-white/40 text-sm font-mono">
          No telemetry yet. Send some chat messages to populate data.
        </div>
      )}

      {!loading && health.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {health.map((h) => {
            const rate = typeof h.success_rate === 'number' ? h.success_rate : 1;
            const latency = h.avg_latency_ms ?? 0;
            const requests = h.total_requests ?? 0;
            const changeType: 'increase' | 'decrease' | 'neutral' =
              rate > 0.95 ? 'increase' : rate > 0.8 ? 'neutral' : 'decrease';
            return (
              <StatCard
                key={h.layer}
                title={h.layer.toUpperCase()}
                value={`${(rate * 100).toFixed(1)}%`}
                change={`${latency.toFixed(0)}ms avg · ${requests} reqs`}
                changeType={changeType}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
