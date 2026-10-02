// == KALKI B5 LAUNCH ==
// Service FAQ with FAQPage JSON-LD + client-side data fetch.
// -----------------------------------------------------------------------------

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { faqSchema } from '@/lib/seo/schema';
import type { Database } from '@/lib/supabase/types';

type FAQ = Database['public']['Tables']['faqs']['Row'];

export function ServiceFAQ({ serviceId }: { serviceId: string }) {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = createClient() as any;
    void supabase
      .from('faqs')
      .select('*')
      .eq('service_id', serviceId)
      .order('order_index', { ascending: true })
      .then(({ data }: { data: FAQ[] | null }) => {
        setFaqs(data ?? []);
        setLoading(false);
      });
  }, [serviceId]);

  if (loading) {
    return <div className="text-white/40 text-sm">Loading FAQs…</div>;
  }
  if (!faqs.length) return null;

  const schema = faqSchema(
    faqs.map((f) => ({ question: f.question, answer: f.answer }))
  );

  return (
    <section className="bg-white/5 border border-white/10 rounded-xl p-6">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <h2 className="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
      <div className="space-y-3">
        {faqs.map((faq: FAQ) => (
          <details key={faq.id} className="border-b border-white/5 pb-3 last:border-0 last:pb-0">
            <summary className="text-white font-medium cursor-pointer hover:text-cyan-400 transition text-sm">
              {faq.question}
            </summary>
            <p className="text-white/60 mt-2 text-sm pl-2">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
