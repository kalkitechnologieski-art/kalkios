// == KALKI B1 SPINE ==
// Post-payment landing page. The gateway redirect only proves the buyer came
// back — the webhook proves the money landed — so this page polls the real
// order status instead of declaring success up front.
// -----------------------------------------------------------------------------

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, Loader2, FolderKanban, XCircle } from 'lucide-react';
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
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    const supabase = createClient() as unknown as {
      from(t: string): {
        select(c: string): { eq(c: string, v: unknown): { single(): Promise<{ data: unknown }> } };
      };
    };

    let cancelled = false;
    let tries = 0;

    const fetchOrder = async (): Promise<boolean> => {
      const { data } = await supabase
        .from('orders')
        .select('id, amount, service_id, status')
        .eq('id', orderId)
        .single();
      if (cancelled) return true;
      const row = data as OrderRow | null;
      setOrder(row);
      setLoading(false);
      return !!row && row.status !== 'pending';
    };

    void fetchOrder();
    setConfirming(true);

    // Webhook fulfillment usually lands within seconds; poll up to 60s.
    const interval = setInterval(() => {
      tries += 1;
      void fetchOrder().then((settled) => {
        if (cancelled || settled || tries >= 20) {
          clearInterval(interval);
          if (!cancelled) setConfirming(false);
        }
      });
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
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

  const status = order?.status ?? 'unknown';
  const paid = status === 'paid';
  const failed = status === 'failed';

  return (
    <div className="max-w-2xl mx-auto py-16 text-center space-y-6">
      {paid ? (
        <>
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
          <h1 className="text-3xl font-bold text-white">Payment successful</h1>
          <p className="text-white/60">
            Thank you. Your order for <span className="text-cyan-400">{serviceName}</span> has been confirmed.
          </p>
        </>
      ) : failed ? (
        <>
          <XCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h1 className="text-3xl font-bold text-white">Payment not completed</h1>
          <p className="text-white/60">
            We did not receive payment for <span className="text-cyan-400">{serviceName}</span>.
            No money was taken — you can retry the checkout, or contact support if you were charged.
          </p>
        </>
      ) : (
        <>
          <Loader2 className="w-16 h-16 text-amber-400 mx-auto animate-spin" />
          <h1 className="text-3xl font-bold text-white">{confirming ? 'Confirming your payment…' : 'Order received'}</h1>
          <p className="text-white/60">
            Your bank has finished, and we are waiting for the payment gateway to confirm your
            order for <span className="text-cyan-400">{serviceName}</span>. This usually takes a few
            seconds{!confirming ? ' — if it does not confirm shortly, check your dashboard' : ''}.
          </p>
        </>
      )}

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
            <span className={paid ? 'text-green-400' : failed ? 'text-red-400' : 'text-amber-400'}>
              {status === 'pending' ? 'confirming' : status}
            </span>
          </div>
        </div>
      )}

      {paid && (
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
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <LuxuryButton
          variant="cyber"
          size="lg"
          label="Go to my dashboard"
          onClick={() => router.push('/client')}
        />
        {failed ? (
          <Link href="/checkout">
            <LuxuryButton variant="outline" size="lg" label="Retry checkout" />
          </Link>
        ) : (
          <Link href="/marketplace">
            <LuxuryButton variant="outline" size="lg" label="Continue shopping" />
          </Link>
        )}
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
