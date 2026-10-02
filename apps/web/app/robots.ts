// == KALKI B5 LAUNCH ==
// robots.txt — allows search engines + AI bots, disallows private routes.
// -----------------------------------------------------------------------------

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com';

  return {
    rules: [
      // ─── Search engines ─────────────────────────────────────
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/employee/',
          '/client/',
          '/_next/',
          '/unauthorized',
          '/settings/',
        ],
      },
      // ─── AI crawlers — allowed on public content ────────────
      { userAgent: 'GPTBot', allow: '/', disallow: ['/api/', '/admin/', '/employee/', '/client/'] },
      { userAgent: 'OAI-SearchBot', allow: '/' },
      { userAgent: 'ChatGPT-User', allow: '/' },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/api/', '/admin/', '/employee/', '/client/'] },
      { userAgent: 'Claude-Web', allow: '/' },
      { userAgent: 'anthropic-ai', allow: '/' },
      { userAgent: 'PerplexityBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
      { userAgent: 'Applebot-Extended', allow: '/' },
      { userAgent: 'CCBot', allow: '/' },
      { userAgent: 'Bytespider', allow: '/' },
      { userAgent: 'Amazonbot', allow: '/' },
      { userAgent: 'meta-externalagent', allow: '/' },
      // ─── Aggressive scrapers — blocked ──────────────────────
      { userAgent: 'SemrushBot', disallow: '/' },
      { userAgent: 'AhrefsBot', disallow: '/' },
      { userAgent: 'MJ12bot', disallow: '/' },
      { userAgent: 'DotBot', disallow: '/' },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
