// == KALKI B1 HOTFIX v2 ==
// Cart uses DERIVED totals via useCartTotals().
// -----------------------------------------------------------------------------

'use client';

import { useEffect, useState } from 'react';
import { useCartStore, useCartTotals, itemKey } from '@/store/cartStore';
import Link from 'next/link';
import { LuxuryButton } from '@/components/ui/LuxuryButton';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';

export default function CartClient() {
  const [mounted, setMounted] = useState(false);
  const { items, removeItem, updateQuantity, clearCart } = useCartStore();
  const { totalItems, totalPrice } = useCartTotals();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="text-white/40 text-center py-20">Loading cart…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <ShoppingBag className="w-16 h-16 text-white/20 mb-4" />
        <h2 className="text-2xl font-bold text-white">Your cart is empty</h2>
        <Link href="/marketplace" className="mt-6 text-cyan-400 hover:text-cyan-300">
          Browse Marketplace →
        </Link>
      </div>
    );
  }

  const gst = Math.round(totalPrice * 0.18);
  const grandTotal = totalPrice + gst;

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-white">Your Cart</h1>
      <p className="text-white/40">
        {totalItems} item{totalItems === 1 ? '' : 's'}
      </p>

      <div className="space-y-4 mt-6">
        {items.map((item) => {
          const key = itemKey(item);
          return (
            <div key={key} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
              <div className="flex-1">
                <h3 className="text-white">{item.name}</h3>
                {item.variantName && (
                  <p className="text-white/40 text-xs">{item.variantName}</p>
                )}
                <p className="text-white/40">₹{item.price.toLocaleString('en-IN')}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(key, item.quantity - 1)}
                  className="p-1 rounded hover:bg-white/10"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4 text-white/60" />
                </button>
                <span className="text-white w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(key, item.quantity + 1)}
                  className="p-1 rounded hover:bg-white/10"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4 text-white/60" />
                </button>
              </div>
              <button
                onClick={() => removeItem(key)}
                className="text-red-400"
                aria-label="Remove item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 bg-white/5 p-4 rounded-xl space-y-2">
        <div className="flex justify-between text-sm text-white/60">
          <span>Subtotal</span>
          <span>₹{totalPrice.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-sm text-white/60">
          <span>GST (18%)</span>
          <span>₹{gst.toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-white font-bold pt-2 border-t border-white/10">
          <span>Total</span>
          <span>₹{grandTotal.toLocaleString('en-IN')}</span>
        </div>
        <div className="mt-4 flex gap-3">
          <LuxuryButton variant="outline" size="default" label="Clear Cart" onClick={clearCart} />
          <Link href="/checkout" className="flex-1">
            <LuxuryButton
              variant="cyber"
              size="lg"
              label="Proceed to Checkout"
              className="w-full"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
