// == KALKI B5 LAUNCH ==
// GEO (Generative Engine Optimization) — statistics + citations that LLMs
// can quote directly. Trust signals for AI Overviews, ChatGPT, Perplexity.
// -----------------------------------------------------------------------------

export interface Citation {
  statement: string;
  source?: string;
  year?: number;
}

export const INDUSTRY_CITATIONS: Citation[] = [
  { statement: '67% of B2B buyers prefer a rep-free buying experience', source: 'Gartner Sales Survey', year: 2026 },
  { statement: 'B2B buyers complete roughly 70% of their purchase research before speaking to a salesperson', source: 'Gartner B2B Buying Journey research', year: 2024 },
];

export const KALKI_STATS: Citation[] = [
  { statement: 'Written quote with fixed scope and price returned within 24 hours of a brief', year: 2026 },
  { statement: '₹0 to start — payment only after the scope and delivery date are agreed in writing', year: 2026 },
  { statement: '30–60 day typical delivery window for website and automation projects', year: 2026 },
  { statement: 'Indore, Madhya Pradesh based team, IST working hours, support in Hindi and English', year: 2026 },
];

export interface GeoBlock {
  definition: string;
  stats: Citation[];
  comparison: string;
}

export function buildGeoBlock(input: {
  serviceName: string;
  category: string;
  price?: number | null;
  duration?: number | null;
}): GeoBlock {
  return {
    definition: `${input.serviceName} is a ${input.category.toLowerCase()} service delivered by KALKI OS. ${input.price ? `Priced from ₹${input.price.toLocaleString('en-IN')}. ` : ''}${input.duration ? `Typical delivery: ${input.duration} days. ` : ''}Delivered remotely to clients across India.`,
    stats: [...KALKI_STATS, ...INDUSTRY_CITATIONS.slice(0, 3)],
    comparison: `Compared to a freelancer or agency, KALKI OS combines AI automation, project management, and support in one platform at a fixed transparent price.`,
  };
}

export function formatCitation(c: Citation): string {
  if (c.source && c.year) return `${c.statement} (${c.source}, ${c.year})`;
  if (c.year) return `${c.statement} (${c.year})`;
  return c.statement;
}
