// == KALKI SERVICE IMAGERY ==
// Every service renders a premium hero image, even the 50+ that live only in
// Supabase with no (or a legacy tiny placeholder) image_url. We resolve by
// exact slug first, then category, then a brand fallback.
// -----------------------------------------------------------------------------

export type ServiceLike = {
  slug?: string | null;
  category?: string | null;
  image_url?: string | null;
};

const BASE = '/images/services';

// Canonical premium assets (generated). Extension is .jpg on purpose.
const IMG = {
  web: `${BASE}/web-development.jpg`,
  software: `${BASE}/software-development.jpg`,
  siddhi: `${BASE}/siddhi-ai.jpg`,
  marketing: `${BASE}/digital-marketing.jpg`,
  design: `${BASE}/graphic-design.jpg`,
  video: `${BASE}/video-media.jpg`,
  ai: `${BASE}/ai-automation.jpg`,
  dashboards: `${BASE}/dashboards-enterprise.jpg`,
  ecommerce: `${BASE}/ecommerce-platform.jpg`,
  astrology: `${BASE}/astrology-api.jpg`,
} as const;

// Legacy stub filenames we must never trust — they are ~500-byte placeholders.
const STUB_SUFFIXES = [
  'ai-app.jpg', 'chatbot.jpg', 'cinematic.jpg', 'dashboard.jpg',
  'enterprise-suite.jpg', 'graphic-design.jpg', 'horoscope-api.jpg',
  'landing-page.jpg', 'logo-design.jpg', 'simple-app.jpg', 'smo.jpg',
  'support-bot.jpg', 'video-editing.jpg',
];

function isUsableRemote(url: string): boolean {
  // Trust only real absolute/CDN URLs; ignore the local stubs.
  if (/^https?:\/\//i.test(url) && !url.includes(BASE)) return true;
  if (url.includes(BASE)) return !STUB_SUFFIXES.some((s) => url.endsWith(s));
  return false;
}

// slug -> image (covers every currently-seeded service)
const BY_SLUG: Record<string, string> = {
  'landing-page-5-pages': IMG.web,
  'ai-multivendor-ecommerce': IMG.ecommerce,
  'ecommerce-website': IMG.ecommerce,
  'simple-business-app': IMG.software,
  'fully-managed-ai-app': IMG.software,
  'smo-viral-marketing': IMG.marketing,
  'enterprise-seo': IMG.marketing,
  'premium-logo-design': IMG.design,
  'single-graphic-design': IMG.design,
  'basic-video-editing': IMG.video,
  'cinematic-motion-graphics': IMG.video,
  'ai-chatbot-automation': IMG.ai,
  'custom-ai-support-bot': IMG.ai,
  'ai-horoscope-kundali-api': IMG.astrology,
  'standard-admin-dashboard': IMG.dashboards,
  'ai-enterprise-dashboard-suite': IMG.dashboards,
};

// category -> image
const BY_CATEGORY: Record<string, string> = {
  'web development': IMG.web,
  'app development': IMG.software,
  'software development': IMG.software,
  development: IMG.dashboards,
  marketing: IMG.marketing,
  'digital marketing': IMG.marketing,
  seo: IMG.marketing,
  design: IMG.design,
  branding: IMG.design,
  media: IMG.video,
  'video editing': IMG.video,
  'ai automation': IMG.ai,
  'ai chatbots': IMG.ai,
  ai: IMG.siddhi,
  'artificial intelligence': IMG.siddhi,
  'machine learning': IMG.siddhi,
  dashboards: IMG.dashboards,
  'business intelligence': IMG.dashboards,
  ecommerce: IMG.ecommerce,
  'e-commerce': IMG.ecommerce,
  astrology: IMG.astrology,
  consulting: IMG.siddhi,
  education: IMG.siddhi,
  healthcare: IMG.siddhi,
};

export function getServiceImageUrl(service: ServiceLike): string {
  if (service.slug && BY_SLUG[service.slug]) return BY_SLUG[service.slug];
  if (service.image_url && isUsableRemote(service.image_url)) return service.image_url;
  const cat = (service.category ?? '').trim().toLowerCase();
  if (cat && BY_CATEGORY[cat]) return BY_CATEGORY[cat];
  return IMG.siddhi; // brand fallback
}

// Resolve a hero image for a category landing page from the raw category label.
export function getCategoryImageUrl(category: string): string {
  const cat = (category ?? '').trim().toLowerCase();
  if (BY_CATEGORY[cat]) return BY_CATEGORY[cat];
  // Substring match for free-form categories (e.g. "SEO Services", "Cloud").
  const hit = Object.keys(BY_CATEGORY).find(
    (key) => cat.includes(key) || key.includes(cat)
  );
  return hit ? BY_CATEGORY[hit] : IMG.siddhi;
}

// Ordered hero set for the homepage banner slideshow.
export const FEATURED_BANNERS = [
  {
    image: IMG.siddhi,
    eyebrow: 'Siddhi AI Concierge',
    title: 'Your business, thinking for itself',
    subtitle: '24/7 AI answers, automation and insights built for Indian businesses.',
    href: '/chat',
    cta: 'Meet Siddhi',
  },
  {
    image: IMG.web,
    eyebrow: 'Web Development',
    title: 'Websites that load fast and sell',
    subtitle: 'From ₹5,000 landing pages to full enterprise platforms.',
    href: '/marketplace/Web%20Development',
    cta: 'Explore Web',
  },
  {
    image: IMG.software,
    eyebrow: 'App & Software',
    title: 'Apps engineered to scale',
    subtitle: 'Cross-platform mobile and enterprise software, delivered in weeks.',
    href: '/marketplace/App%20Development',
    cta: 'Explore Software',
  },
  {
    image: IMG.marketing,
    eyebrow: 'Growth & Marketing',
    title: 'Leads, ranked and measured',
    subtitle: 'AI-driven SEO, social and SETU lead generation with real ROI.',
    href: '/marketplace/Marketing',
    cta: 'Explore Growth',
  },
] as const;
