'use client'
import { useEffect, useState } from 'react'
import { useCartStore } from '@/store/cartStore'
import Link from 'next/link'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'

export default function CartClient() {
  const [mounted, setMounted] = useState(false)
  const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCartStore()
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="text-white/40 text-center py-20">Loading cart...</div>
  if (items.length === 0) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <ShoppingBag className="w-16 h-16 text-white/20 mb-4" />
      <h2 className="text-2xl font-bold text-white">Your cart is empty</h2>
      <Link href="/marketplace" className="mt-6 text-cyan-400 hover:text-cyan-300">Browse Marketplace →</Link>
    </div>
  )
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-white">Your Cart</h1>
      <p className="text-white/40">{totalItems} items</p>
      <div className="space-y-4 mt-6">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-xl">
            <div className="flex-1"><h3 className="text-white">{item.name}</h3><p className="text-white/40">₹{item.price.toLocaleString()}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.id, item.quantity-1)} className="p-1 rounded hover:bg-white/10"><Minus className="w-4 h-4 text-white/60" /></button>
              <span className="text-white w-8 text-center">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity+1)} className="p-1 rounded hover:bg-white/10"><Plus className="w-4 h-4 text-white/60" /></button>
            </div>
            <button onClick={() => removeItem(item.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
      <div className="mt-6 bg-white/5 p-4 rounded-xl">
        <div className="flex justify-between text-white font-bold"><span>Total</span><span>₹{Math.round(totalPrice*1.18).toLocaleString()}</span></div>
        <div className="mt-4 flex gap-3"><LuxuryButton variant="secondary" size="md" label="Clear Cart" onClick={clearCart} /><Link href="/checkout" className="flex-1"><LuxuryButton variant="primary" size="lg" label="Proceed to Checkout" className="w-full" /></Link></div>
      </div>
    </div>
  )
}
