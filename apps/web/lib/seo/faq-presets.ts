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
} satisfies Record<string, FAQItem[]>;
