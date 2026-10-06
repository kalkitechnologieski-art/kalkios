'use client';

import { faqSchema } from '@/lib/seo/structured-data';

interface FAQItem {
  question: string;
  answer: string;
}

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

/**
 * Pre-built FAQ sets for common topics
 */
export const FAQ_PRESETS = {
  aiServices: [
    {
      question: 'What is KALKI OS and how does it work?',
      answer:
        'KALKI OS is an enterprise AI platform that combines a service marketplace, AI concierge (Siddhi), lead generation engine (SETU), and project management tools. It helps Indian businesses automate workflows, generate leads, and manage digital services—all in one place.',
    },
    {
      question: 'How much do KALKI services cost?',
      answer:
        'Our services start at just ₹499 for basic packages. Enterprise solutions are custom-priced based on your requirements. We offer transparent pricing with no hidden fees, and all services include free consultation.',
    },
    {
      question: 'Is KALKI OS suitable for small businesses?',
      answer:
        'Absolutely! KALKI OS is designed for businesses of all sizes—from startups to enterprises. Our modular approach means you can start with a single service and scale as you grow. Many of our clients begin with lead generation or chatbot integration.',
    },
    {
      question: 'How quickly can I get started?',
      answer:
        'You can sign up and start using KALKI OS in under 5 minutes. Our AI concierge Siddhi guides you through the setup process, and most services can be deployed within 24-48 hours.',
    },
    {
      question: 'Do you provide support in Hindi?',
      answer:
        'Yes! KALKI OS supports both English and Hindi. Our team is based in Indore, Madhya Pradesh, and we understand the needs of Indian businesses. Customer support is available in multiple languages.',
    },
  ],

  leadGeneration: [
    {
      question: 'How does SETU lead generation work?',
      answer:
        'SETU uses AI-powered web search and intelligent scraping to find potential leads based on your criteria. It searches across multiple sources, extracts contact information, validates emails and phone numbers, and delivers verified leads directly to your dashboard.',
    },
    {
      question: 'Are the leads real-time and verified?',
      answer:
        'Yes, all leads are generated in real-time from live web searches. Our system validates email formats, checks phone number patterns, and cross-references company information to ensure accuracy. You get fresh, actionable leads—not outdated databases.',
    },
    {
      question: 'Can I export leads to my CRM?',
      answer:
        'Absolutely! You can export leads in CSV or Excel format, compatible with all major CRMs including Salesforce, HubSpot, and Zoho. We also offer API integration for automated syncing with your existing systems.',
    },
  ],

  technical: [
    {
      question: 'What technologies power KALKI OS?',
      answer:
        'KALKI OS is built on Next.js 16 with React 19, TypeScript, and Supabase for backend services. Our AI layer integrates multiple providers including Agnes AI, Groq, and Zhipu for optimal performance. The platform uses Redis caching, serverless functions, and edge computing for speed.',
    },
    {
      question: 'Is my data secure with KALKI?',
      answer:
        'Security is our top priority. We use industry-standard encryption, Row Level Security (RLS) policies, and regular security audits. Your data is stored in compliant infrastructure, and we never share your information with third parties without consent.',
    },
  ],
};
