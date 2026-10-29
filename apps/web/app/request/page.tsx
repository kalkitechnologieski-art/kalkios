// == KALKI SERVICE REQUEST (entry) ==
// No-payment, integrated submission. Server component fetches the catalog and
// renders the client form; ?service=<id> preselects one service.
// -----------------------------------------------------------------------------

import { fetchServices } from '@/lib/services'
import { RequestForm } from './RequestForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Request a Service — No Payment Needed',
  description:
    'Tell us what you need — no payment now. KALKI Intelligence, an AI tech company in Indore, sends a written scope and fixed quote within 24 hours.',
  alternates: { canonical: '/request' },
}

export const dynamic = 'force-dynamic'

export interface PickerService {
  id: string
  name: string
  category: string
  price: number | null
}

async function getServices(): Promise<PickerService[]> {
  // Same catalog the marketplace renders, so a card the client clicked is always
  // selectable here.
  const rows = await fetchServices()
  return rows
    .map((s) => ({
      id: String(s.id),
      name: s.name,
      category: s.category,
      price: s.price ?? null,
    }))
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
}

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; category?: string }>
}) {
  const { service } = await searchParams
  const services = await getServices()

  return (
    <div className="relative min-h-screen kalki-hero px-4 py-10 md:py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-purple-500/10 rounded-full blur-3xl" />
      </div>
      <div className="relative z-10">
        <RequestForm services={services} initialServiceId={service ?? null} />
      </div>
    </div>
  )
}
