// == KALKI B6 ENTERPRISE SEO ==
// RSS/Atom feeds for content syndication and WebSub/PubSubHubbub
// -----------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { fetchServices } from '@/lib/services';
import { serviceHref } from '@/lib/services/href';
import { siteOrigin } from '@/lib/seo/site-url';

const SITE = siteOrigin();

export async function GET() {
  const services = (await fetchServices())
    .slice()
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
    .slice(0, 50);

  const rss = buildRSS({
    title: 'KALKI Intelligence — services and notes',
    description: 'Services from KALKI Intelligence for astrologers, vastu consultants and businesses in every industry. Written scope, fixed price, ₹0 advance.',
    link: SITE,
    language: 'en-IN',
    items: services.map((service) => ({
      title: `${service.name} - ${service.category}`,
      description: service.description || '',
      link: `${SITE}${serviceHref(service)}`,
      guid: service.id,
      pubDate: new Date(service.created_at).toUTCString(),
      lastBuildDate: new Date(service.updated_at || service.created_at).toUTCString(),
      category: service.category,
    })),
  });

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=7200',
      'X-Robots-Tag': 'noindex',
    },
  });
}

interface RSSFeedOptions {
  title: string;
  description: string;
  link: string;
  language?: string;
  items: Array<{
    title: string;
    description: string;
    link: string;
    guid: string;
    pubDate: string;
    lastBuildDate?: string;
    category?: string;
  }>;
}

function buildRSS(options: RSSFeedOptions): string {
  const now = new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${escapeXml(options.title)}</title>
    <description>${escapeXml(options.description)}</description>
    <link>${options.link}</link>
    <language>${options.language || 'en'}</language>
    <lastBuildDate>${now}</lastBuildDate>
    <ttl>60</ttl>
    
    <!-- Atom link for WebSub -->
    <atom:link href="${options.link}/rss.xml" rel="self" type="application/rss+xml"/>
    <atom:link href="https://pubsubhubbub.appspot.com/" rel="hub"/>
    
    <!-- WebSub hub discovery -->
    <atom:link rel="hub" href="https://pubsubhubbub.appspot.com/"/>
    
    ${options.items.map((item) => buildItem(item)).join('\n    ')}
  </channel>
</rss>`;
}

function buildItem(item: RSSFeedOptions['items'][number]): string {
  return `<item>
      <title>${escapeXml(item.title)}</title>
      <description>${escapeXml(item.description)}</description>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
      ${item.lastBuildDate ? `<lastBuildDate>${item.lastBuildDate}</lastBuildDate>` : ''}
      ${item.category ? `<category>${escapeXml(item.category)}</category>` : ''}
    </item>`;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
