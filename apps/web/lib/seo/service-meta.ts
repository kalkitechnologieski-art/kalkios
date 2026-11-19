export const SERVICE_META: Record<string, { title: string; description: string }> = {
  'ai-chatbot-automation': {
    title: 'AI Automation for Astrologers and Businesses',
    description:
      'AI automation agency service for astrologers and businesses worldwide. Booking and lead questions from ₹5,999. Written quote, ₹0 advance.',
  },
  'ai-horoscope-kundali-api': {
    title: 'AI Horoscope and Kundali API',
    description:
      'Horoscope, kundali, compatibility and muhurta APIs for a website or app. From ₹29,999. Written scope from KALKI Intelligence.',
  },
  'ai-chatbot-development': {
    title: 'AI Chatbot Development',
    description:
      'AI chatbot development for astrologers, spiritual practices and other businesses. Written scope, fixed price, ₹0 advance. KALKI Intelligence.',
  },
  'custom-ai-development': {
    title: 'AI Development Company Services',
    description:
      'AI development company work for practices and businesses worldwide. Written scope, fixed price, ₹0 advance. KALKI Intelligence.',
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
    title: 'Business Website Development',
    description:
      'Five-page websites for astrologers, vastu consultants and every industry. From ₹5,000. Written scope, ₹0 advance.',
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
