'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { ArrowLeft, Shield, CreditCard, Lock } from 'lucide-react'

export default function CheckoutClient() {
  const [mounted, setMounted] = useState(false)
  const params = useSearchParams()
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return <div className="text-white/40 text-center py-20">Loading...</div>
  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href="/cart" className="text-cyan-400"><ArrowLeft className="w-4 h-4 inline" /> Back to Cart</Link>
      <h1 className="text-3xl font-bold text-white mt-4">Checkout</h1>
      <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 mt-6">
        <div className="flex items-center gap-3 border-b border-white/5 pb-4"><CreditCard className="w-6 h-6 text-cyan-400" /><h2 className="text-white">Payment Details</h2></div>
        <div className="mt-4 space-y-4">
          <input type="text" placeholder="Name on Card" className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50" />
          <input type="text" placeholder="Card Number" className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50" />
          <div className="grid grid-cols-2 gap-4"><input type="text" placeholder="MM/YY" className="bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white" /><input type="text" placeholder="CVV" className="bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white" /></div>
        </div>
        <div className="mt-6 pt-4 border-t border-white/5"><LuxuryButton variant="primary" size="lg" label="Place Order" className="w-full" /><div className="flex justify-center gap-2 mt-4 text-xs text-white/20"><Lock className="w-3 h-3" />Secure & encrypted</div></div>
      </div>
    </div>
  )
}
