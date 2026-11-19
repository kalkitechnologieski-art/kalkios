// == KALKI SEO ==
// Pre-built FAQ sets for common topics (plain data, safe to import from server components)
// -----------------------------------------------------------------------------

export interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ_PRESETS = {
  aiServices: [
    {
      question: 'What is KALKI Intelligence?',
      answer:
        'KALKI Intelligence LLP is an AI and development tech partner. The tagline is Temple of technology. The studio is in Indore, India, and delivery is remote and worldwide. The commercial terms are a written scope, a fixed price and ₹0 advance. AI is used in the work, and a person is accountable for the quote.',
    },
    {
      question: 'Who do you work with?',
      answer:
        'Businesses in every industry. The catalog is grouped by the job: AI, commerce, marketing, data, cloud, security, and design. Industry hubs cover clinics, real estate, education, restaurants, finance, legal, hospitality, and manufacturing. Astrology and vastu are one of those hubs, not the whole company.',
    },
    {
      question: 'Do you guarantee rankings, views, or AI citations?',
      answer:
        'No. A report can include numbers that were measured. A ranking, a view count, a viral outcome, or a citation in an AI answer is not part of the quote.',
    },
    {
      question: 'How does pricing work?',
      answer:
        'Each service page lists a starting price in INR. Most projects are quoted individually. You receive a written scope and fixed price within 24 hours of the brief. Nothing is charged until you accept that quote.',
    },
    {
      question: 'Where do you deliver?',
      answer:
        'Worldwide, remotely. The office is 52, MOG Lines, Swastik Nagar, Indore, Madhya Pradesh 452002, India. English is the default. Hindi is available when the quote says so.',
    },
    {
      question: 'How do I start?',
      answer:
        'Send a brief through the request form or the contact page. There is no checkout and no advance to start the conversation.',
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
} satisfies Record<string, FAQItem[]>;
