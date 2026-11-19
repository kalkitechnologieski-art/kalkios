export const SERVICE_META: Record<string, { title: string; description: string }> = {
  'ai-chatbot-automation': {
    title: 'AI Automation Services',
    description:
      'AI automation services for astrologers and businesses worldwide. Booking and lead questions from ₹5,999. Written quote, ₹0 advance.',
  },
  'ai-horoscope-kundali-api': {
    title: 'Kundali Software Development',
    description:
      'Kundali software and horoscope API: kundli, compatibility and muhurta. From ₹29,999. A website or app is a separate quote.',
  },
  'ai-chatbot-development': {
    title: 'AI Chatbot Development',
    description:
      'AI chatbot development for astrologers, spiritual practices and other businesses. Written scope, fixed price, ₹0 advance. KALKI Intelligence.',
  },
  'custom-ai-development': {
    title: 'Custom AI Agent Development',
    description:
      'Hire an AI developer for a scoped agent. AI development company work for practices and every industry. Written quote, ₹0 advance.',
  },
  'enterprise-seo': {
    title: 'Enterprise SEO Services',
    description:
      'Enterprise SEO: competitor analysis, on-page SEO, link building and monthly reporting. From ₹49,999. No ranking promise.',
  },
  'smo-viral-marketing': {
    title: 'Social Marketing for Practices and Brands',
    description:
      'Social marketing for astrologers and other businesses. From ₹20,000. Reported in writing. No view or viral promise.',
  },
  'landing-page-5-pages': {
    title: 'Landing Page Design',
    description:
      'Landing page design: the pages named in the quote, usually five. From ₹5,000. Written scope, ₹0 advance. KALKI Intelligence.',
  },
  'ppc-google-ads': {
    title: 'Google Ads Management',
    description:
      'Google Ads management for the campaigns named in the quote. From ₹24,999. No ranking or lead-count promise. Written quote, ₹0 advance.',
  },
  'mobile-app-development': {
    title: 'Mobile App Development (Flutter / React Native)',
    description:
      'Mobile app development in Flutter or React Native, as the quote names. From ₹1,99,999. Store approval is the store’s decision.',
  },
  'premium-logo-design': {
    title: 'Logo & Brand Identity Design',
    description:
      'Logo and brand identity design: the concepts and files named in the quote. Starting price on the page. Written scope, ₹0 advance.',
  },
  'ui-ux-design': {
    title: 'UI/UX Design',
    description:
      'UI/UX design for the screens named in the quote. From ₹39,999. A build of those screens is a separate quote. KALKI Intelligence.',
  },
  'email-marketing-automation': {
    title: 'Email Marketing Automation',
    description:
      'Email marketing automation for the messages and triggers named in the quote. From ₹14,999. No open-rate or revenue promise.',
  },
  'content-marketing': {
    title: 'Content Marketing Services',
    description:
      'Content marketing for astrologers, vastu consultants and other businesses worldwide. Written scope, fixed price, ₹0 advance.',
  },
}

export function serviceMeta(slug: string): { title: string; description: string } | undefined {
  return SERVICE_META[slug]
}
