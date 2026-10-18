// The cart belonged to the payment flow, which is now removed.
// /marketplace is the entry to the no-payment request flow.
import { redirect } from 'next/navigation'

export default function CartPage() {
  redirect('/marketplace')
}
