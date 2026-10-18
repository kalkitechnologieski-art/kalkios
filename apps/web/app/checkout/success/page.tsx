// Post-payment landing is retired — requests confirm inline on /request.
// Keep the route alive for old bookmarks and forward buyers to the catalog.
import { redirect } from 'next/navigation'

export default function CheckoutSuccessPage() {
  redirect('/marketplace')
}
