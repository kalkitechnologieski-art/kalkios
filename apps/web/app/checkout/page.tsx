// Payments are removed from KALKI. Old checkout links now hand the buyer to the
// integrated, no-payment request flow (preserving the ?service= id).
import { redirect } from 'next/navigation'

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string }>
}) {
  const { service } = await searchParams
  redirect(service ? `/request?service=${encodeURIComponent(service)}` : '/request')
}
