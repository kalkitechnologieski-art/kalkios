// == KALKI B5 LAUNCH ==
// Generate Answer-Engine-Optimized blocks from service data.
// AEO best practice: definition sentence, audience, HowTo, FAQs.
// -----------------------------------------------------------------------------

export interface ServiceInput {
  name: string;
  category: string;
  description?: string | null;
  long_description?: string | null;
  price?: number | null;
  duration_days?: number | null;
  features?: string[] | null;
  target_industries?: string[] | null;
}

export function buildDefinition(s: ServiceInput): string {
  const price = s.price ? ` Starting at ₹${s.price.toLocaleString('en-IN')}.` : '';
  const duration = s.duration_days ? ` Delivered in ${s.duration_days} days.` : '';
  const desc = (s.description ?? '').replace(/\s+/g, ' ').trim();
  const first = desc.split('.')[0] ?? desc;
  return `${s.name} is an AI-powered ${s.category.toLowerCase()} service by KALKI OS. ${first}.${price}${duration}`;
}

export function buildAudienceBlock(s: ServiceInput): string {
  const industries = (s.target_industries ?? []).filter(Boolean);
  if (industries.length === 0) {
    return 'Suitable for businesses across India looking to grow with AI.';
  }
  return `Built for ${industries.join(', ')} businesses across India.`;
}

export interface HowToStepText {
  name: string;
  text: string;
}

export function buildHowToSteps(s: ServiceInput): HowToStepText[] {
  return [
    {
      name: 'Choose your tier',
      text: `Select the ${s.name} package that matches your scope. All tiers are described on this page.`,
    },
    {
      name: 'Checkout securely',
      text: 'Sign in and pay via Instamojo. Your order is confirmed instantly with a GST invoice.',
    },
    {
      name: 'Project kickoff',
      text: `Our team starts within 24 hours. You receive a live project timeline in your client dashboard.`,
    },
    {
      name: 'Delivery & review',
      text: `We deliver in ${s.duration_days ?? 30} days (typical). You approve each milestone before final handover.`,
    },
  ];
}

export interface FaqBlock {
  question: string;
  answer: string;
}

export function buildFaqs(s: ServiceInput): FaqBlock[] {
  const price = s.price ? `₹${s.price.toLocaleString('en-IN')}` : 'a competitive price';
  const duration = s.duration_days ? `${s.duration_days} days` : '30 days';

  return [
    {
      question: `What is ${s.name}?`,
      answer: `${buildDefinition(s)}`,
    },
    {
      question: `How much does ${s.name} cost?`,
      answer: `${s.name} starts at ${price}. Optional add-ons and enterprise tiers are available on request.`,
    },
    {
      question: `How long does delivery take?`,
      answer: `Typical delivery for ${s.name} is ${duration}. Rush delivery is available for an additional fee.`,
    },
    {
      question: `What is included in ${s.name}?`,
      answer: (s.features ?? []).slice(0, 5).join('. ') || 'Full scope is detailed in the product description above.',
    },
    {
      question: `Do you offer revisions?`,
      answer: `Yes. Every ${s.name} package includes at least one round of revisions. Enterprise tiers include unlimited revisions.`,
    },
    {
      question: `Is ${s.name} available across India?`,
      answer: `Yes, we serve clients across India from our Indore office. All delivery is remote-first with optional on-site visits.`,
    },
    {
      question: `How do I get started with ${s.name}?`,
      answer: `Click "Buy Now" on this page, sign in, and complete checkout. Your project appears on your dashboard within minutes.`,
    },
    {
      question: `Can I customise ${s.name}?`,
      answer: `Yes. Contact our sales team for custom scope, additional integrations, or enterprise pricing.`,
    },
  ];
}

export function summarizableParagraph(s: ServiceInput, maxWords = 40): string {
  const def = buildDefinition(s);
  const words = def.split(/\s+/);
  if (words.length <= maxWords) return def;
  return words.slice(0, maxWords).join(' ') + '…';
}
