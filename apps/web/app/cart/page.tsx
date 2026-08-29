import { Suspense } from 'react'
import dynamic from 'next/dynamic'

const CartClient = dynamic(
  () => import('./CartClient'),
  { loading: () => <div className="text-white/40 text-center py-20">Loading cart...</div> }
)

export default function CartPage() {
  return (
    <Suspense fallback={<div className="text-white/40 text-center py-20">Loading cart...</div>}>
      <CartClient />
    </Suspense>
  )
}
