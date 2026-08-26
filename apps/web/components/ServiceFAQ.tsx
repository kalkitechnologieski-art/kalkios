import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type FAQ = Database['public']['Tables']['faqs']['Row']

export async function ServiceFAQ({ serviceId }: { serviceId: string }) {
  const supabase = await createClient()
  const { data: faqs } = await supabase
    .from('faqs')
    .select('*')
    .eq('service_id', serviceId)
    .order('order_index', { ascending: true })

  if (!faqs || faqs.length === 0) return null

  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
      <h2 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
      <div className="space-y-3">
        {faqs.map((faq: FAQ) => (
          <details key={faq.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
            <summary className="text-white font-medium cursor-pointer hover:text-purple-400 transition text-sm">
              {faq.question}
            </summary>
            <p className="text-white/60 mt-2 text-sm pl-2">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
