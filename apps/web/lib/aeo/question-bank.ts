// == KALKI B5 LAUNCH ==
// Category-aware question bank. Used to auto-fill FAQs and AEO blocks.
// -----------------------------------------------------------------------------

export interface CategorizedQ {
  question: string;
  answerTemplate: string; // {service} replaced at runtime
}

const GENERIC: CategorizedQ[] = [
  { question: 'What does {service} include?', answerTemplate: 'See the features list above. Every {service} package includes a defined scope, delivery timeline, and at least one revision round.' },
  { question: 'Who is {service} for?', answerTemplate: '{service} is designed for Indian businesses that want AI-grade execution without hiring an in-house team.' },
  { question: 'How does payment work for {service}?', answerTemplate: 'You pay upfront via Instamojo. You receive a GST invoice instantly. All amounts are in INR.' },
  { question: 'Do you provide support after {service} delivery?', answerTemplate: 'Yes. Every {service} includes 30 days of post-delivery support. Extended support is available on request.' },
];

const CATEGORY_SPECIFIC: Record<string, CategorizedQ[]> = {
  'Web Development': [
    { question: 'Is the website responsive on mobile?', answerTemplate: 'Yes. Every website we build is mobile-first, tested on iOS, Android, and desktop.' },
    { question: 'Do you provide hosting?', answerTemplate: 'We deploy to Vercel or your preferred provider. Hosting is billed separately at cost.' },
    { question: 'Will my site rank on Google?', answerTemplate: 'We build with SEO best practices. Full SEO strategy is available as an add-on.' },
  ],
  'App Development': [
    { question: 'Do you build for both iOS and Android?', answerTemplate: 'Yes. We use React Native for cross-platform apps.' },
    { question: 'Will you publish to the App Store?', answerTemplate: 'We handle submission to both stores as part of the delivery.' },
  ],
  'Marketing': [
    { question: 'What channels do you cover?', answerTemplate: 'Instagram, Facebook, YouTube, Google Ads, and email — depending on the package.' },
    { question: 'Do you guarantee results?', answerTemplate: 'We guarantee best-practice execution and transparent reporting. Specific ROAS guarantees are available at enterprise tiers.' },
  ],
  'Design': [
    { question: 'Do I own the design files?', answerTemplate: 'Yes. You receive full source files (Figma, SVG, PNG, PDF) with commercial rights.' },
  ],
  'AI Automation': [
    { question: 'Do I need technical staff to maintain it?', answerTemplate: 'No. We fully host and manage the automation. You only need a browser.' },
    { question: 'Which AI models do you use?', answerTemplate: 'We select the best model for each task and provide unified access through KALKI OS. Zero vendor lock-in.' },
  ],
  'AI Chatbots': [
    { question: 'Can the bot handle my product catalogue?', answerTemplate: 'Yes. We train on your website, documents, and knowledge base.' },
    { question: 'Does it support Hindi?', answerTemplate: 'Yes. Multi-language support including Hindi, English, and Hinglish.' },
  ],
};

export function getQuestionBank(category: string, serviceName: string): CategorizedQ[] {
  const specific = CATEGORY_SPECIFIC[category] ?? [];
  const combined = [...specific, ...GENERIC];
  // De-duplicate and rewrite template with service name
  const seen = new Set<string>();
  const out: CategorizedQ[] = [];
  for (const q of combined) {
    const question = q.question.replace('{service}', serviceName);
    if (seen.has(question)) continue;
    seen.add(question);
    out.push({
      question,
      answerTemplate: q.answerTemplate.replace(/\{service\}/g, serviceName),
    });
  }
  return out;
}
