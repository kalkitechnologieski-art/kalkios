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
  return `${s.name} is a ${s.category.toLowerCase()} service by KALKI Intelligence. ${first}.${price}${duration}`;
}

export function buildAudienceBlock(s: ServiceInput): string {
  const industries = (s.target_industries ?? []).filter(Boolean);
  if (industries.length === 0) {
    return 'Suitable for astrologers, spiritual practitioners and businesses in every industry. Delivery is worldwide.';
  }
  return `Built for ${industries.join(', ')}. Delivery is worldwide.`;
}

export interface HowToStepText {
  name: string;
  text: string;
}

export function buildHowToSteps(s: ServiceInput): HowToStepText[] {
  return [
    {
      name: 'Share your requirement',
      text: `Submit a free request for ${s.name} — tell us your goal, budget and timeline. No payment is taken.`,
    },
    {
      name: 'Receive a tailored quote',
      text: 'Within 24 hours our team reviews your brief and sends a fixed proposal with scope, timeline and pricing.',
    },
    {
      name: 'Approve and start',
      text: 'You only pay once you approve the proposal. Your project then appears live on your client dashboard.',
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
      answer: `${s.name} starts at ${price}. That figure is a starting price. The written quote is the price you approve.`,
    },
    {
      question: `How long does delivery take?`,
      answer: `The listed typical duration for ${s.name} is ${duration}. The written quote states the date for your brief.`,
    },
    {
      question: `What is included in ${s.name}?`,
      answer: (s.features ?? []).slice(0, 5).join('. ') || 'The written quote lists the deliverables. This page is the starting point.',
    },
    {
      question: 'What happens after I request this?',
      answer: 'You send a brief and pay nothing. A written scope, fixed price and delivery date come back within 24 hours. Work starts after you approve. There is no checkout step.',
    },
    {
      question: `Where is ${s.name} delivered?`,
      answer: 'Remotely, worldwide. The studio office is in Indore, India.',
    },
    {
      question: 'Do you guarantee rankings, views, or revenue?',
      answer: 'No. The quote lists deliverables. It does not promise a ranking, a traffic total, a view count, or revenue.',
    },
    {
      question: `Can ${s.name} be changed after approval?`,
      answer: 'A change outside the approved list is a new written quote.',
    },
  ];
}

export function summarizableParagraph(s: ServiceInput, maxWords = 40): string {
  const def = buildDefinition(s);
  const words = def.split(/\s+/);
  if (words.length <= maxWords) return def;
  return words.slice(0, maxWords).join(' ') + '…';
}
