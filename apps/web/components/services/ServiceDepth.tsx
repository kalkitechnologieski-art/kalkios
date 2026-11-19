import Link from 'next/link'
import type { ServicePageContent } from '@/lib/services/service-details'

export function ServiceDepth({ content }: { content: ServicePageContent }) {
  return (
    <div className="mt-12 space-y-10 max-w-3xl">
      {content.sections.map((section) => (
        <section key={section.heading}>
          <h2 className="text-xl font-bold text-white mb-3">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-white/75 text-sm leading-relaxed mb-3">{paragraph}</p>
          ))}
        </section>
      ))}

      {content.deliverables.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-white mb-3">Deliverables</h2>
          <p className="text-white/75 text-sm leading-relaxed mb-3">
            The written quote is this list, plus the price and the date. Anything not written there is a separate quote.
          </p>
          <ul className="space-y-1.5">
            {content.deliverables.map((item) => (
              <li key={item} className="text-sm text-white/75">{item}</li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold text-white mb-3">What you provide first</h2>
        <ul className="space-y-1.5">
          {content.prerequisites.map((item) => (
            <li key={item} className="text-sm text-white/75">{item}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-3">How the work runs</h2>
        <ol className="space-y-3 list-decimal pl-5">
          {content.process.map((step) => (
            <li key={step.name} className="text-sm text-white/75">
              <span className="text-white font-medium">{step.name}. </span>
              {step.text}
            </li>
          ))}
        </ol>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-3">Related pages</h2>
        <ul className="space-y-1.5">
          {content.links.map((link) => (
            <li key={link.href}>
              <Link href={link.href} className="text-sm text-cyan-400/85 hover:text-cyan-300 transition">{link.label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-bold text-white mb-4">Frequently asked</h2>
        <div className="space-y-4">
          {content.faqs.map((faq) => (
            <details key={faq.question} className="border-b border-white/5 pb-3">
              <summary className="text-white font-medium cursor-pointer hover:text-cyan-400 transition">{faq.question}</summary>
              <p className="text-white/65 mt-2 text-sm">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
