'use client'
import { ScrollReveal } from './ui/ScrollReveal'

interface FAQItem {
  question: string
  answer: string
}

export function AEOContent({ title, answer, faqs }: { title: string; answer: string; faqs: FAQItem[] }) {
  return (
    <section className="py-16 border-t border-white/5">
      <ScrollReveal direction="up">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
          <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-3xl">{answer}</p>
          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <details key={i} className="group bg-white/5 border border-white/10 rounded-xl overflow-hidden transition hover:border-purple-500/30">
                <summary className="flex items-center justify-between p-4 cursor-pointer text-white font-medium hover:text-purple-400 transition">
                  <span className="text-sm">{faq.question}</span>
                  <span className="text-white/30 group-open:rotate-180 transition">▼</span>
                </summary>
                <div className="px-4 pb-4 text-white/60 text-sm leading-relaxed">{faq.answer}</div>
              </details>
            ))}
          </div>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'FAQPage',
                mainEntity: faqs.map(faq => ({
                  '@type': 'Question',
                  name: faq.question,
                  acceptedAnswer: { '@type': 'Answer', text: faq.answer },
                })),
              }),
            }}
          />
        </div>
      </ScrollReveal>
    </section>
  )
}
