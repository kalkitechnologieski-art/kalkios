// == KALKI SERVICE REQUEST (entry) ==
// No-payment, integrated submission. Server component fetches the catalog and
// renders the client form; ?service=<id> preselects one service.
// -----------------------------------------------------------------------------

import { createPublicClient } from '@/lib/supabase/public-client'
import { RequestForm } from './RequestForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Request a Service — KALKI OS',
  description:
    'Tell us what you need. No payment now — you get a tailored quote and a free consultation within 24 hours.',
}

export const dynamic = 'force-dynamic'

export interface PickerService {
  id: string
  name: string
  category: string
  price: number | null
}

async function getServices(): Promise<PickerService[]> {
  try {
    const supabase = createPublicClient()
    const { data } = await supabase
      .from('services')
      // @ts-ignore - generated types lag runtime columns
      .select('id, name, category, price')
      .eq('is_active', true as any)
      .order('category', { ascending: true })
      .limit(300)
    return (data ?? []) as PickerService[]
  } catch {
    return []
  }
}

export default async function RequestPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; category?: string }>
}) {
  const { service } = await searchParams
  const services = await getServices()

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-slate-950 to-black px-4 py-10 md:py-16">
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
