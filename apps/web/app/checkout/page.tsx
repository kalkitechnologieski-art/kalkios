import { Suspense } from 'react'
import CheckoutClient from './CheckoutClient'

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-white/40 text-center py-20">Loading checkout...</div>}>
      <CheckoutClient />
    </Suspense>
  )
}
