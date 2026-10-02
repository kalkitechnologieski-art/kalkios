// == KALKI B4 EXPERIENCE ==
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/useAuth';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ShoppingBag } from 'lucide-react';
import { LuxuryButton } from '@/components/ui/LuxuryButton';

interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  service_id: string | null;
  discount_amount?: number | null;
  discount_code?: string | null;
}

export default function ClientOrdersPage() {
  const { user, loading: authLoading } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    void supabase
      .from('orders')
      .select('id, amount, status, created_at, service_id, discount_amount, discount_code')
      .eq('client_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }: { data: Order[] | null }) => {
        setOrders(data ?? []);
        setLoading(false);
      });
  }, [user]);

  if (authLoading || loading) {
    return <div className="text-white/40 text-center py-20">Loading…</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <Link href="/login" className="text-cyan-400">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-6 space-y-6">
      <h1 className="text-3xl font-bold text-white font-mono">My Orders</h1>

      {orders.length === 0 ? (
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-12 text-center">
          <ShoppingBag className="w-12 h-12 text-cyan-400/40 mx-auto mb-3" />
          <p className="text-white/60">No orders yet.</p>
          <Link href="/marketplace" className="mt-4 inline-block">
            <LuxuryButton variant="cyber" size="default" label="Browse services" />
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/client/order/${o.id}`}
              className="block bg-white/5 border border-cyan-500/10 hover:border-cyan-500/30 rounded-xl p-4 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-mono text-sm">Order #{o.id.slice(0, 8)}</p>
                  <p className="text-white/40 text-xs mt-1">
                    {new Date(o.created_at).toLocaleDateString()} · {o.discount_code ? `Code: ${o.discount_code}` : 'No code'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold">₹{o.amount.toLocaleString('en-IN')}</p>
                  <Badge variant={o.status === 'paid' ? 'default' : 'secondary'}>{o.status}</Badge>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
