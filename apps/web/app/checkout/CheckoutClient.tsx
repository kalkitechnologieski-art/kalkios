'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

export default function CheckoutClient() {
  const searchParams = useSearchParams()
  const serviceId = searchParams.get('service')
  const [loading, setLoading] = useState(false)
  const [service, setService] = useState<Service | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (serviceId) {
      supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single()
        .then(({ data }: { data: Service | null }) => setService(data))
    }
  }, [serviceId, supabase])

  const handleCheckout = async () => {
    if (!service || !email || !name) return
    setLoading(true)
    const response = await fetch('/api/payments/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serviceId: service.id,
        amount: service.price,
        buyer_email: email,
        buyer_name: name,
      }),
    })
    const data = await response.json()
    if (data.paymentUrl) {
      window.location.href = data.paymentUrl
    } else {
      alert('Payment initiation failed. Please try again.')
    }
    setLoading(false)
  }

  if (!service) return <div className="text-white/40 text-center py-20">Loading...</div>

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold text-white mb-6">Checkout</h1>
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <div>
          <p className="text-white/40 text-sm">Service</p>
          <p className="text-white font-medium">{service.name}</p>
        </div>
        <div>
          <p className="text-white/40 text-sm">Amount</p>
          <p className="text-2xl font-bold text-white">₹{service.price}</p>
        </div>
        <div>
          <label className="text-white/40 text-sm block mb-1">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/5 rounded-lg px-3 py-2 text-white placeholder-white/30 outline-none text-sm"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-white/40 text-sm block mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-white/5 rounded-lg px-3 py-2 text-white placeholder-white/30 outline-none text-sm"
            placeholder="you@example.com"
          />
        </div>
        <button
          onClick={handleCheckout}
          disabled={loading || !email || !name}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl text-white font-medium transition disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Pay Now'}
        </button>
      </div>
    </div>
  )
}
