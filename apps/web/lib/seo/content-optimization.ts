// == KALKI B6 ENTERPRISE AEO/GEO ==
// Content optimization utilities for answer engines and generative search
// -----------------------------------------------------------------------------

/**
 * Generate conversational Q&A pairs from content
 * Optimized for People Also Ask and voice search
 */
export function generateConversationalPairs(topic: string, content: string): Array<{
  question: string;
  answer: string;
}> {
  // Extract key phrases and generate natural language questions
  const patterns = [
    { type: 'what', template: `What is ${topic}?` },
    { type: 'how', template: `How does ${topic} work?` },
    { type: 'why', template: `Why choose ${topic} for your business?` },
    { type: 'cost', template: `How much does ${topic} cost in India?` },
    { type: 'best', template: `What are the best ${topic} services in Indore?` },
    { type: 'benefits', template: `What are the benefits of ${topic}?` },
  ];

  return patterns.map((pattern) => ({
    question: pattern.template,
    answer: extractRelevantAnswer(content, pattern.type),
  }));
}

/**
 * Extract concise answers optimized for featured snippets (40-60 words)
 */
function extractRelevantAnswer(content: string, type: string): string {
  // In production, use AI to generate optimal snippet-length answers
  // For now, return first 50 words as placeholder
  const words = content.split(' ').slice(0, 50);
  return words.join(' ') + (words.length >= 50 ? '...' : '');
}

/**
 * Build entity-rich content for Knowledge Graph optimization
 */
export interface EntityData {
  name: string;
  type: string;
  description: string;
  attributes: Record<string, string>;
  relatedEntities: string[];
}

export function buildEntityContent(entity: EntityData): string {
  return `
# ${entity.name}

${entity.description}

## Key Attributes
${Object.entries(entity.attributes)
  .map(([key, value]) => `- **${key}**: ${value}`)
  .join('\n')}

## Related Topics
${entity.relatedEntities.join(', ')}

---

*This content is part of KALKI Intelligence's knowledge base about ${entity.type}.*
`;
}

/**
 * Generate E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) signals
 */
export function buildEEATSignals(context: {
  author?: string;
  credentials?: string[];
  experience?: string;
  lastUpdated?: string;
  sources?: string[];
}): string {
  return `
<!-- E-E-A-T Signals -->
<meta name="author" content="${context.author || 'KALKI Intelligence'}" />
<meta name="credentials" content="${context.credentials?.join(', ') || ''}" />
<meta name="experience" content="${context.experience || '5+ years in AI and digital services'}" />
<meta name="last-reviewed" content="${context.lastUpdated || new Date().toISOString()}" />
<meta name="sources" content="${context.sources?.join(', ') || ''}" />
<!-- End E-E-A-T -->
`;
}

/**
 * Create knowledge panel content for brand authority
 */
export function buildBrandKnowledgePanel(): EntityData {
  return {
    name: 'KALKI Intelligence',
    type: 'Organization',
    description:
      'KALKI Intelligence is a leading enterprise AI platform based in Indore, India, providing comprehensive digital services including web development, SEO, AI chatbots, lead generation, and business automation solutions.',
    attributes: {
      Founded: '2024',
      Headquarters: 'Indore, Madhya Pradesh, India',
      CEO: 'KALKI Team',
      Employees: '50-100',
      Industry: 'Artificial Intelligence, Digital Services, SaaS',
      Website: 'https://kalkios.com',
      Phone: '+91-XXX-XXXXXXX',
      Email: 'contact@kalkios.com',
    },
    relatedEntities: [
      'Siddhi AI Concierge',
      'SETU Lead Generation',
      'KALKI OS Platform',
      'Indore Tech Hub',
      'Indian AI Startups',
    ],
  };
}

/**
 * Optimize content for voice search queries
 */
export function optimizeForVoiceSearch(content: string): {
  spokenVersion: string;
  keyPhrases: string[];
} {
  // Convert written content to more conversational, spoken format
  const spokenVersion = content
    .replace(/\b(e\.g\.|i\.e\.|etc\.)/g, (match) => {
      const expansions: Record<string, string> = {
        'e.g.': 'for example',
        'i.e.': 'that is',
        'etc.': 'and so on',
      };
      return expansions[match] || match;
    })
    .replace(/&/g, 'and')
    .replace(/\d+/g, (num) => num.toString()); // Keep numbers for clarity

  // Extract key phrases that voice assistants look for
  const keyPhrases = [
    'KALKI Intelligence',
    'AI platform in Indore',
    'digital services India',
    'lead generation tool',
    'AI chatbot Siddhi',
    'enterprise automation',
  ];

  return { spokenVersion, keyPhrases };
}

/**
 * Generate local SEO content with geo-modifiers
 */
export function buildLocalSEOContent(service: string, location: string): {
  title: string;
  description: string;
  content: string;
  keywords: string[];
} {
  const city = location.split(',')[0];
  const state = location.split(',')[1] || '';

  return {
    title: `${service} in ${city}${state ? `, ${state}` : ''} | KALKI Intelligence`,
    description: `Professional ${service.toLowerCase()} services in ${location}. AI-powered solutions by KALKI Intelligence. Serving ${city} and surrounding areas. Free consultation!`,
    content: `
Looking for expert ${service.toLowerCase()} in ${location}? 

KALKI Intelligence provides top-tier ${service.toLowerCase()} services tailored for businesses in ${city}${state ? ` and ${state}` : ''}. Our team combines cutting-edge AI technology with deep understanding of the local market.

Why choose us for ${service.toLowerCase()} in ${location}?
✓ Based in ${city} - we understand local business needs
✓ AI-powered solutions for better results
✓ Transparent pricing starting at ₹499
✓ Free consultation and support in Hindi & English
✓ Serving all of ${state || 'Madhya Pradesh'} and beyond

Contact us today to discuss your ${service.toLowerCase()} requirements!
    `.trim(),
    keywords: [
      `${service} ${city}`,
      `${service} ${location}`,
      `${service.toLowerCase()} near me`,
      `best ${service.toLowerCase()} in ${city}`,
      `${service.toLowerCase()} price ${location}`,
      'KALKI Intelligence',
    ],
  };
}
