// == KALKI B5 LAUNCH ==
// llms.txt — a machine-readable catalogue for AI agents.
// Spec: https://llmstxt.org
// -----------------------------------------------------------------------------

import { createClient } from '@/lib/supabase/server';

export const revalidate = 3600;

interface ServiceRow {
  name: string;
  slug: string;
  category: string;
  description: string | null;
  price: number | null;
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com';

  let services: ServiceRow[] = [];
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createClient()) as any;
    const { data } = await supabase
      .from('services')
      .select('name, slug, category, description, price')
      .eq('is_active', true)
      .order('category');
    services = (data ?? []) as ServiceRow[];
  } catch {
    services = [];
  }

  const groupedByCategory = new Map<string, ServiceRow[]>();
  for (const s of services) {
    const list = groupedByCategory.get(s.category) ?? [];
    list.push(s);
    groupedByCategory.set(s.category, list);
  }

  const lines: string[] = [];
  lines.push('# KALKI OS — Enterprise AI Platform');
  lines.push('');
  lines.push('> KALKI OS is an AI-powered digital services marketplace and enterprise AI platform operated by KALKI Intelligence LLP, based in Indore, India. It offers web development, app development, marketing, design, media, AI automation, and AI chatbots with transparent INR pricing and 30–60 day delivery.');
  lines.push('');
  lines.push('## Company');
  lines.push('');
  lines.push('- Name: KALKI Intelligence LLP');
  lines.push('- Legal: KALKI Intelligence LLP');
  lines.push('- Location: 51, MOG Lines, Swastik Nagar, Indore, Madhya Pradesh 452002, India');
  lines.push('- Email: team@kalki-intelligence.in');
  lines.push('- Phone: +91-6261031710');
  lines.push('- Founded: 2025');
  lines.push('- Size: 11–50 employees');
  lines.push(`- Website: ${baseUrl}`);
  lines.push('');
  lines.push('## Services');
  lines.push('');

  for (const [category, list] of groupedByCategory) {
    lines.push(`### ${category}`);
    lines.push('');
    for (const s of list) {
      const price = s.price ? ` (from ₹${s.price.toLocaleString('en-IN')})` : '';
      const url = `${baseUrl}/marketplace/${encodeURIComponent(s.category)}/${encodeURIComponent(s.slug)}`;
      const desc = (s.description ?? '').replace(/\s+/g, ' ').trim();
      lines.push(`- [${s.name}](${url})${price}: ${desc}`);
    }
    lines.push('');
  }

  lines.push('## Capabilities');
  lines.push('');
  lines.push('- AI concierge (Siddhi): chat, deep reasoning, web search, image and video generation, lead generation (SETU), voice input/output');
  lines.push('- Enterprise-grade AI orchestration with automatic model fallback (device → Z.AI → Groq → OpenRouter)');
  lines.push('- Client dashboard with live project timeline, invoices, and referral rewards');
  lines.push('- SEO, AEO, and GEO-optimized product pages with JSON-LD structured data');
  lines.push('');
  lines.push('## Contact');
  lines.push('');
  lines.push(`- Website: ${baseUrl}`);
  lines.push('- Email: team@kalki-intelligence.in');
  lines.push('- Chat: /chat');
  lines.push('');
  lines.push('## Licence');
  lines.push('');
  lines.push('All services are commercial. Content on this site may be cited with attribution to KALKI Intelligence LLP.');
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
