import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const CheckoutClient = dynamic(
  () => import('./CheckoutClient'),
  { loading: () => <div className="text-white/40 text-center py-20">Loading checkout...</div> }
)

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="text-white/40 text-center py-20">Loading checkout...</div>}>
      <CheckoutClient />
    </Suspense>
  )
}
