'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { Loader2, CheckCircle, ShoppingCart, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import type { Database } from '@/lib/supabase/types'

type Service = Database['public']['Tables']['services']['Row']

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const serviceId = searchParams.get('service')
  const { items, totalPrice, clearCart, removeItem } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [serviceData, setServiceData] = useState<Service | null>(null)
  const supabase = createClient()

  // Fetch service details if single service purchase
  useEffect(() => {
    if (serviceId) {
      supabase
        .from('services')
        .select('*')
        .eq('id', serviceId)
        .single()
        .then(({ data, error }: { data: any; error: any }) => {
          if (error) {
            setError('Service not found.')
          } else {
            setServiceData(data)
          }
        })
    }
  }, [serviceId, supabase])

  // Determine purchase items
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

    setLoading(true)
    setError(null)

    try {
      const item = purchaseItems[0]
      if (!item) {
        setError('No valid item to purchase.')
        setLoading(false)
        return
      }

      // Create order in Supabase
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          service_id: item.id,
          amount: item.price,
          status: 'pending',
          buyer_name: 'Guest',
          buyer_email: 'guest@example.com',
        })
        .select()
        .single()

      if (orderError) throw orderError

      setOrderId(order.id)

      // Simulate payment gateway
      await new Promise(resolve => setTimeout(resolve, 1500))

      // Update order to paid (in prod, webhook would do this)
      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', order.id)

      if (!serviceId) clearCart()
      setSuccess(true)

      // Redirect to client dashboard after 2s
      setTimeout(() => router.push('/client'), 2000)

    } catch (err) {
      console.error('Checkout error:', err)
      setError('Payment failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <CheckCircle className="w-16 h-16 text-green-400 mb-4" />
        <h2 className="text-2xl font-bold text-white">Payment Successful!</h2>
        <p className="text-cyan-400/40 mt-2">Your order is being processed.</p>
        <p className="text-white/30 text-sm mt-4">Order ID: {orderId}</p>
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
              label={loading ? 'Processing...' : 'Pay Now'}
              onClick={handleCheckout}
              disabled={loading || purchaseItems.length === 0}
              fullWidth
              icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
            />
          </>
        )}
      </div>
    </div>
  )
}
