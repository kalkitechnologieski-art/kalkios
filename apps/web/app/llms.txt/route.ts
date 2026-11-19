import { fetchServices } from '@/lib/services';
import { categoryHref, serviceHref } from '@/lib/services/href';
import { INSIGHTS } from '@/lib/content/insights';
import { siteOrigin } from '@/lib/seo/site-url';

export const revalidate = 3600;

export async function GET() {
  const baseUrl = siteOrigin();
  const services = await fetchServices();

  const groupedByCategory = new Map<string, typeof services>();
  for (const service of services) {
    const list = groupedByCategory.get(service.category) ?? [];
    list.push(service);
    groupedByCategory.set(service.category, list);
  }

  const lines: string[] = [];
  lines.push('# KALKI Intelligence — Temple of technology');
  lines.push('');
  lines.push('> KALKI Intelligence LLP is an AI and development tech partner for astrologers, vastu consultants, other spiritual practitioners, and businesses in every industry. Delivery is worldwide from a studio in Indore. Every project has a written scope, a fixed price and ₹0 advance. AI is used in the work, and a person is accountable for the quote. Rankings, view counts and AI citations are not promised.');
  lines.push('');
  lines.push('## Company');
  lines.push('');
  lines.push('- Name: KALKI Intelligence');
  lines.push('- Legal: KALKI Intelligence LLP');
  lines.push('- Tagline: Temple of technology');
  lines.push('- Office: 52, MOG Lines, Swastik Nagar, Indore, Madhya Pradesh 452002, India');
  lines.push('- Service area: Worldwide');
  lines.push('- Email: team@kalki-intelligence.in');
  lines.push('- Phone: +91-6261031710');
  lines.push('- Founded: 2025');
  lines.push('- Founder & CEO: Nikhil Singh (https://www.linkedin.com/in/nikhil-singh-8a4338298)');
  lines.push('- Company LinkedIn: https://www.linkedin.com/company/kalki-intelligence');
  lines.push(`- Website: ${baseUrl}`);
  lines.push('- Principles: written scope, fixed pricing, ₹0 advance, AI-assisted and human-accountable');
  lines.push('');
  lines.push('## Pages');
  lines.push('');
  lines.push(`- [Home](${baseUrl}): AI and development partner for astrologers and businesses in every industry.`);
  lines.push(`- [Marketplace](${baseUrl}/marketplace): Service catalog with INR starting prices.`);
  lines.push(`- [Industries](${baseUrl}/industries): Hubs for clinics, commerce, finance, hospitality, manufacturing, and other verticals. Astrology and vastu are one hub.`);
  lines.push(`- [Notes](${baseUrl}/insights): Explanatory articles. Not case studies.`);
  lines.push(`- [Full context](${baseUrl}/llms-full.txt): Longer description of the offer, the prices, and the boundaries.`);
  lines.push(`- [Request a service](${baseUrl}/request): Brief form. No payment to start. Written quote within 24 hours.`);
  lines.push(`- [Siddhi AI chat](${baseUrl}/chat): Conversational assistant.`);
  lines.push(`- [Explore](${baseUrl}/explore): Search the catalog.`);
  lines.push(`- [About](${baseUrl}/about): Who the studio works with, and what it will not claim.`);
  lines.push(`- [Contact](${baseUrl}/contact): Office address and the brief form.`);
  lines.push(`- [Privacy Policy](${baseUrl}/privacy): How personal data is handled.`);
  lines.push(`- [Terms](${baseUrl}/terms): Terms of service.`);
  lines.push('');
  lines.push('## Notes');
  lines.push('');
  for (const article of INSIGHTS) {
    lines.push(`- [${article.title}](${baseUrl}/insights/${article.slug}): ${article.description}`);
  }
  lines.push('');
  lines.push('## Categories');
  lines.push('');
  for (const [category, list] of groupedByCategory) {
    lines.push(`- [${category}](${baseUrl}${categoryHref(category)}): ${list.length} service${list.length === 1 ? '' : 's'}.`);
  }
  lines.push('');
  lines.push('## Services');
  lines.push('');
  for (const [category, list] of groupedByCategory) {
    lines.push(`### ${category}`);
    lines.push('');
    for (const service of list) {
      const price = service.price ? ` (from ₹${Number(service.price).toLocaleString('en-IN')})` : '';
      const url = `${baseUrl}${serviceHref(service)}`;
      const desc = (service.description ?? '').replace(/\s+/g, ' ').trim();
      lines.push(`- [${service.name}](${url})${price}: ${desc}`);
    }
    lines.push('');
  }

  lines.push('## Boundaries');
  lines.push('');
  lines.push('- A search engagement does not include a promised position on Google.');
  lines.push('- No view, subscriber, or viral guarantee.');
  lines.push('- No fabricated reviews, client counts, or case studies.');
  lines.push('- A listed price is a starting figure. The written quote is the price.');
  lines.push('');
  lines.push('## Contact');
  lines.push('');
  lines.push(`- Website: ${baseUrl}`);
  lines.push('- Email: team@kalki-intelligence.in');
  lines.push('- Chat: /chat');
  lines.push('');

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
