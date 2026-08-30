'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { Loader2, CheckCircle, ShoppingCart, ArrowLeft, CreditCard } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const serviceId = searchParams.get('service')
  const { items, totalPrice, clearCart } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [serviceData, setServiceData] = useState<Service | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)
  const [buyerDetails, setBuyerDetails] = useState({
    name: '',
    email: '',
    phone: '',
  })
  const supabase = createClient()

  // Fetch service details if single service purchase
  useEffect(() => {
    if (serviceId) {
      supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single()
        .then(({ data, error }: { data: Service | null; error: any }) => {
          if (error) {
            setError('Service not found.')
          } else {
            setServiceData(data)
          }
        })
    }
  }, [serviceId, supabase])

  const purchaseItems = serviceId
    ? (serviceData ? [{ id: serviceData.id, name: serviceData.name, price: serviceData.price ?? 0, quantity: 1 }] : [])
    : items.map(item => ({ ...item, price: item.price ?? 0 }))

  const totalAmount = serviceId
    ? (serviceData?.price ?? 0)
    : totalPrice

  const handleCheckout = async () => {
    if (purchaseItems.length === 0) {
      setError('Your cart is empty.')
      return
    }

    // Validate buyer details
    if (!buyerDetails.name.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!buyerDetails.email.trim() || !buyerDetails.email.includes('@')) {
      setError('Please enter a valid email address.')
      return
    }
    if (!buyerDetails.phone.trim()) {
      setError('Please enter your phone number.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const item = purchaseItems[0]
      if (!item) {
        setError('No valid item to purchase.')
        setLoading(false)
        return
      }

      // Call payment creation API
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: item.id,
          buyerName: buyerDetails.name,
          buyerEmail: buyerDetails.email,
          buyerPhone: buyerDetails.phone,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Payment creation failed')
      }

      setOrderId(data.orderId)
      setPaymentUrl(data.paymentUrl)

      // Redirect to Instamojo payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      } else {
        throw new Error('No payment URL returned')
      }

    } catch (err: any) {
      console.error('Checkout error:', err)
      setError(err.message || 'Payment initialization failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // If payment was successful (redirected back with ?payment=success)
  useEffect(() => {
    const successParam = searchParams.get('payment')
    if (successParam === 'success') {
      setSuccess(true)
      if (!serviceId) clearCart()
      setTimeout(() => {
        router.push('/client')
      }, 3000)
    }
  }, [searchParams, router, serviceId, clearCart])

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
        <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
        <p className="text-cyan-400/40 mt-2">Your order is being processed.</p>
        <p className="text-white/30 text-sm mt-4">Redirecting to your dashboard...</p>
        <LuxuryButton variant="primary" size="lg" label="Go to Dashboard" onClick={() => router.push('/client')} className="mt-6" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Link href={serviceId ? '/marketplace' : '/cart'} className="text-cyan-400/60 hover:text-cyan-400 text-sm flex items-center gap-2 mb-6">
        <ArrowLeft className="w-4 h-4" />
        {serviceId ? 'Back to Service' : 'Back to Cart'}
      </Link>

      <h1 className="text-3xl font-bold text-white mb-6">Checkout</h1>
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-4">
          {error}
        </div>
      )}
      <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 space-y-4">
        <h2 className="text-white font-bold text-lg flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-cyan-400" />
          Order Summary
        </h2>

        {/* Buyer details */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Full Name *"
            value={buyerDetails.name}
            onChange={(e) => setBuyerDetails({ ...buyerDetails, name: e.target.value })}
            className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition"
            required
          />
          <input
            type="email"
            placeholder="Email *"
            value={buyerDetails.email}
            onChange={(e) => setBuyerDetails({ ...buyerDetails, email: e.target.value })}
            className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition"
            required
          />
          <input
            type="tel"
            placeholder="Phone *"
            value={buyerDetails.phone}
            onChange={(e) => setBuyerDetails({ ...buyerDetails, phone: e.target.value })}
            className="w-full bg-black/40 border border-cyan-500/20 rounded-lg px-4 py-2 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition"
            required
          />
        </div>

        {purchaseItems.length === 0 ? (
          <p className="text-white/40">No items to purchase.</p>
        ) : (
          <>
            {purchaseItems.map((item) => (
              <div key={item.id} className="flex justify-between text-white/80 border-b border-white/5 pb-2">
                <span>{item.name || 'Service'}</span>
                <span>₹{(item.price ?? 0).toLocaleString()}</span>
              </div>
            ))}
            <div className="flex justify-between text-white font-bold pt-2 text-lg">
              <span>Total</span>
              <span>₹{totalAmount.toLocaleString()}</span>
            </div>
            <LuxuryButton
              variant="primary"
              size="lg"
              label={loading ? 'Processing...' : 'Pay with Instamojo'}
              onClick={handleCheckout}
              disabled={loading || purchaseItems.length === 0}
              fullWidth
              icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
            />
          </>
        )}
      </div>
    </div>
  )
}
