'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useCartStore } from '@/store/cartStore'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { Loader2, CheckCircle, WifiOff } from 'lucide-react'
import { checkSupabaseConnection } from '@/lib/services'
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
  const [online, setOnline] = useState<boolean>(true)
  const supabase = createClient()

  useEffect(() => {
    const check = async () => {
      const status = await checkSupabaseConnection()
      setOnline(status)
    }
    check()
  }, [])

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

  const purchaseItems = serviceId
    ? (serviceData ? [{ id: serviceData.id, name: serviceData.name, price: serviceData.price ?? 0, quantity: 1 }] : [])
    : items.map(item => ({ ...item, price: item.price ?? 0 }))

  const totalAmount = serviceId
    ? (serviceData?.price ?? 0)
    : totalPrice

  const handleCheckout = async () => {
    if (!online) {
      router.push('/contact?reason=offline&service=' + (serviceId || ''))
      return
    }

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

      await new Promise(resolve => setTimeout(resolve, 1500))

      await supabase
        .from('orders')
        .update({ status: 'paid' })
        .eq('id', order.id)

      if (!serviceId) clearCart()
      setSuccess(true)

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

  if (!online) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <WifiOff className="w-16 h-16 text-yellow-400 mb-4" />
        <h2 className="text-2xl font-bold text-white">Offline Mode</h2>
        <p className="text-cyan-400/40 mt-2 max-w-md">
          Payment processing is currently unavailable because Supabase is offline.
          Please contact us directly to complete your purchase.
        </p>
        <div className="mt-6 flex gap-4">
          <LuxuryButton variant="primary" size="lg" label="Contact Us" onClick={() => router.push('/contact')} />
          <LuxuryButton variant="secondary" size="lg" label="Back to Marketplace" onClick={() => router.push('/marketplace')} />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Checkout</h1>
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl mb-4">
          {error}
        </div>
      )}
      <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 space-y-4">
        <h2 className="text-white font-bold text-lg">Order Summary</h2>
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
            <div className="flex justify-between text-white font-bold pt-2">
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
