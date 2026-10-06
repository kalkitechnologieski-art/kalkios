'use client';

import { faqSchema } from '@/lib/seo/structured-data';
import type { FAQItem } from '@/lib/seo/faq-presets';

interface FAQStructuredDataProps {
  questions: FAQItem[];
  className?: string;
}

/**
 * FAQ component with structured data for AEO
 * Renders visible FAQ + invisible JSON-LD for search engines
 */
export function FAQStructuredData({ questions, className }: FAQStructuredDataProps) {
  return (
    <>
      {/* JSON-LD structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(questions)) }}
      />

      {/* Visible FAQ section */}
      <div className={className}>
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {questions.map((faq, index) => (
            <FAQItemComponent key={index} {...faq} index={index} />
          ))}
        </div>
      </div>
    </>
  );
}

function FAQItemComponent({ question, answer, index }: FAQItem & { index: number }) {
  return (
    <details className="group bg-white/5 border border-cyan-500/10 rounded-lg overflow-hidden">
      <summary className="flex items-center justify-between p-4 cursor-pointer hover:bg-white/5 transition">
        <h3 className="text-white font-medium pr-4">{question}</h3>
        <span className="text-cyan-400 text-xl transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="px-4 pb-4 text-white/70">
        <p>{answer}</p>
      </div>
    </details>
  );
}
