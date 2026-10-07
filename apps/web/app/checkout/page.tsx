// == KALKI B1 SPINE ==
// Multi-item checkout with code input, wallet toggle, and auth gate.
// -----------------------------------------------------------------------------

'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useCartStore, useCartTotals } from '@/store/cartStore';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { Loader2, CheckCircle, ShoppingCart, ArrowLeft, CreditCard, Lock } from 'lucide-react';
import { CodeInput } from '@/components/checkout/CodeInput';
import { WalletToggle } from '@/components/checkout/WalletToggle';

function CheckoutInner() {
  const router = useRouter();
  const params = useSearchParams();
  const serviceId = params.get('service');

  const { items, clearCart } = useCartStore();
  const { totalItems } = useCartTotals();

  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: { full_name?: string } } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient() as unknown as {
      auth: { getUser(): Promise<{ data: { user: { id: string; email?: string; user_metadata?: { full_name?: string } } | null } }> };
    };
    void supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        setBuyer({
          name: (data.user.user_metadata?.full_name as string | undefined) ?? '',
          email: data.user.email ?? '',
          phone: '',
        });
      }
      setAuthChecked(true);
    });
  }, []);

  const serviceIds = serviceId ? [serviceId] : items.map((i) => i.id);
  const purchaseCount = serviceIds.length;

  const handleCheckout = async () => {
    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(`/checkout${serviceId ? `?service=${serviceId}` : ''}`)}`
      );
      return;
    }
    if (purchaseCount === 0) { setError('Your cart is empty.'); return; }
    if (!buyer.name.trim()) { setError('Please enter your full name.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email)) { setError('Please enter a valid email.'); return; }
    if (!/^[0-9+\-\s()]{7,15}$/.test(buyer.phone.trim())) { setError('Please enter a valid phone.'); return; }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceIds,
          buyerName: buyer.name,
          buyerEmail: buyer.email,
          buyerPhone: buyer.phone,
        }),
      });
      const data = (await response.json()) as { paymentUrl?: string; error?: string; orderIds?: string[]; idempotent?: boolean };

      if (!response.ok) throw new Error(data.error ?? 'Payment failed');
      if (!data.paymentUrl) {
        // No gateway link — never claim success; guide the buyer instead.
        setError(
          data.error ??
            (data.idempotent
              ? 'You already have a pending order for this item. Track it from your dashboard or try again in a few minutes.'
              : 'We could not open the payment page. Please try again — no money has been taken.')
        );
        return;
      }

      if (!serviceId) clearCart();
      window.location.href = data.paymentUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment initialization failed.';
      setError(msg);
      setLoading(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <h2 className="text-2xl font-bold text-white mb-2">Sign in to checkout</h2>
        <p className="text-white/40 text-sm mb-6">Your purchase is linked to your account.</p>
        <Link
          href={`/login?redirect=${encodeURIComponent(`/checkout${serviceId ? `?service=${serviceId}` : ''}`)}`}
        >
          <LuxuryButton variant="cyber" size="lg" label="Sign in" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href={serviceId ? '/marketplace' : '/cart'} className="text-cyan-400/60 hover:text-cyan-400 text-sm flex items-center gap-2 mb-6">
        <ArrowLeft className="w-4 h-4" />
        {serviceId ? 'Back to service' : 'Back to cart'}
      </Link>

      <h1 className="text-3xl font-bold text-white mb-6">Checkout</h1>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 space-y-6">
        <div>
          <h2 className="text-white font-bold text-lg flex items-center gap-2 mb-3">
            <ShoppingCart className="w-5 h-5 text-cyan-400" />
            Your order {purchaseCount > 0 && <span className="text-white/40 text-sm">({purchaseCount} item{purchaseCount > 1 ? 's' : ''})</span>}
          </h2>
          {purchaseCount === 0 ? (
            <p className="text-white/40 text-sm">No items to purchase.</p>
          ) : (
            <div className="space-y-2">
              {(serviceId ? [{ id: serviceId, name: 'Selected service' }] : items).map((it) => (
                <div key={it.id} className="flex justify-between text-sm text-white/70 border-b border-white/5 pb-2">
                  <span>{it.name}</span>
                  <span className="text-white/40">× 1</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Full name *"
            value={buyer.name}
            onChange={(e) => setBuyer({ ...buyer, name: e.target.value })}
            className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white outline-none focus:border-cyan-500/50 transition"
          />
          <input
            type="email"
            placeholder="Email *"
            value={buyer.email}
            onChange={(e) => setBuyer({ ...buyer, email: e.target.value })}
            className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white outline-none focus:border-cyan-500/50 transition"
          />
          <input
            type="tel"
            placeholder="Phone *"
            value={buyer.phone}
            onChange={(e) => setBuyer({ ...buyer, phone: e.target.value })}
            className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white outline-none focus:border-cyan-500/50 transition"
          />
        </div>

        <LuxuryButton
          variant="cyber"
          size="lg"
          label={loading ? 'Redirecting…' : `Pay securely`}
          onClick={handleCheckout}
          disabled={loading || purchaseCount === 0}
          fullWidth
          icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        />

        <div className="flex justify-center items-center gap-2 text-xs text-white/30">
          <Lock className="w-3 h-3" />
          Secure payment via Instamojo
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-white/40 text-center py-20">Loading…</div>}>
      <CheckoutInner />
    </Suspense>
  );
}
