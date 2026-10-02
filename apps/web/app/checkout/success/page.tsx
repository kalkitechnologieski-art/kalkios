// == KALKI B1 SPINE ==
// Post-payment success page. Shows what was bought + link to project.
// -----------------------------------------------------------------------------

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, Loader2, FolderKanban } from 'lucide-react';
import { LuxuryButton } from '@/components/ui/LuxuryButton';

interface OrderRow {
  id: string;
  amount: number;
  service_id: string | null;
  status: string;
}

function SuccessInner() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get('order');
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [serviceName, setServiceName] = useState<string>('Your service');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    const supabase = createClient() as unknown as {
      from(t: string): {
        select(c: string): { eq(c: string, v: unknown): { single(): Promise<{ data: unknown }> } };
      };
    };
    void supabase
      .from('orders')
      .select('id, amount, service_id, status')
      .eq('id', orderId)
      .single()
      .then(({ data }) => {
        setOrder(data as OrderRow | null);
        setLoading(false);
      });
  }, [orderId]);

  useEffect(() => {
    if (!orderId || !order?.service_id) return;
    const supabase = createClient() as unknown as {
      from(t: string): {
        select(c: string): { eq(c: string, v: unknown): { single(): Promise<{ data: { name?: string } | null }> } };
      };
    };
    void supabase
      .from('services')
      .select('name')
      .eq('id', order.service_id)
      .single()
      .then(({ data }) => { if (data?.name) setServiceName(data.name); });
  }, [orderId, order?.service_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
      <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
      <h1 className="text-3xl font-bold text-white">Payment successful</h1>
      <p className="text-white/60">
        Thank you. Your order for <span className="text-cyan-400">{serviceName}</span> has been confirmed.
      </p>

      {order && (
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 text-left space-y-2">
          <div className="flex justify-between text-sm text-white/60">
            <span>Order ID</span>
            <span className="font-mono text-white">{order.id.slice(0, 8)}</span>
          </div>
          <div className="flex justify-between text-sm text-white/60">
            <span>Amount</span>
            <span className="font-mono text-white">₹{order.amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm text-white/60">
            <span>Status</span>
            <span className="text-green-400">{order.status}</span>
          </div>
        </div>
      )}

      <div className="bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-6 text-left">
        <div className="flex items-start gap-3">
          <FolderKanban className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-white text-sm font-semibold">Your project is being set up</p>
            <p className="text-white/50 text-xs mt-1">
              It will appear on your client dashboard in under a minute. You can track progress there.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <LuxuryButton
          variant="cyber"
          size="lg"
          label="Go to my dashboard"
          onClick={() => router.push('/client')}
        />
        <Link href="/marketplace">
          <LuxuryButton variant="outline" size="lg" label="Continue shopping" />
        </Link>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="text-white/40 text-center py-20">Loading…</div>}>
      <SuccessInner />
    </Suspense>
  );
}
