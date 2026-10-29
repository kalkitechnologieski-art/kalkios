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
      question: 'What is KALKI OS and who runs it?',
      answer:
        'KALKI OS is the platform of KALKI Intelligence, a tech company based in Indore, Madhya Pradesh. It brings together a service marketplace, an AI concierge (Siddhi), a lead generation engine (SETU) and project management tools, so Indian businesses can buy websites, automation and marketing from one place.',
    },
    {
      question: 'Who is KALKI Intelligence?',
      answer:
        'KALKI Intelligence LLP is an AI tech company in Indore, Madhya Pradesh, founded in 2025. It builds websites, AI chatbots, SEO and lead generation systems for businesses across India, and gives every project a written scope and fixed price before work starts.',
    },
    {
      question: 'How much do KALKI services cost?',
      answer:
        'Each service page lists its own starting price in INR, and most projects are quoted individually. Submit the request form and you get a written scope and fixed price within 24 hours. Nothing is charged until you accept that quote, and there are no hidden fees.',
    },
    {
      question: 'Is KALKI OS suitable for small businesses?',
      answer:
        'Yes. KALKI OS is designed for businesses of all sizes—from startups to enterprises. The modular approach means you can start with a single service, such as lead generation or chatbot integration, and scale as you grow.',
    },
    {
      question: 'How quickly can I get started?',
      answer:
        'Set up takes minutes and our AI concierge Siddhi guides you through it. After you accept a quote, most digital services are delivered in 30–60 days, with a live project timeline you can follow from your dashboard.',
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
