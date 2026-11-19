// ═══ SIDDHI v4.0 BATCH 1 ═══
// Fixed webhook matcher path; public routes preserved; RBAC intact.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { normKey } from '@/lib/services/href';

const PUBLIC_ROUTES = [
  '/chat', '/', '/login', '/register', '/auth/callback', '/contact', '/careers',
  '/services', '/explore', '/marketplace', '/about', '/terms', '/support', '/unauthorized',
  '/request', '/privacy', '/insights',
  '/api/health', '/api/services/request', '/api/inquiries', '/api/reviews',
  // Social cards are fetched by Googlebot and crawlers that have no session.
  '/api/og',
  // Crawler files must answer 200 to bots that are not logged in.
  '/robots.txt', '/sitemap.xml', '/rss.xml', '/llms.txt',
  // Tokenised, no-index proposal links — clients must open them without an account.
  '/p',
  '/_next', '/favicon.ico',
];

const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

function withSecurityHeaders<T extends NextResponse>(response: T): T {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(key, value);
  return response;
}

// Slugs replaced after they were published. The new URL is the page that
// now owns the query. Category on the old URL is ignored.
const RETIRED_SERVICE: Record<string, string> = {
  'rag-application-development': '/marketplace/ai/rag-chatbot-development',
  'custom-api-integration': '/marketplace/development/api-integration-services',
  'ai-meeting-notes-setup': '/marketplace/ai/ai-knowledge-base-development',
  'multimodal-ai-application': '/marketplace/ai/llm-application-integration',
  'whatsapp-broadcast-operations': '/marketplace/ai-automation/whatsapp-commerce-catalog',
  'agentic-storefront-setup': '/marketplace/web-development/shopify-store-development',
  'cold-email-system': '/marketplace/marketing/lead-generation-services',
  'lifecycle-marketing-automation': '/marketplace/marketing/email-marketing-automation',
  'product-analytics-implementation': '/marketplace/marketing/marketing-analytics-setup',
  'data-quality-setup': '/marketplace/development/data-pipeline-development',
  'cloud-cost-review': '/marketplace/development/cloud-landing-zone',
  'ux-audit': '/marketplace/development/ui-ux-design',
  'mobile-app-ui-design': '/marketplace/development/ui-ux-design',
  'hr-onboarding-portal': '/marketplace/development/standard-admin-dashboard',
}

function retiredServicePath(pathname: string): string | null {
  const parts = pathname.split('/')
  if (parts[1] !== 'marketplace' || !parts[3]) return null
  let slug = parts[3]
  try {
    slug = decodeURIComponent(parts[3])
  } catch {
    slug = parts[3]
  }
  return RETIRED_SERVICE[normKey(slug)] ?? null
}

function canonicalMarketplacePath(pathname: string): string | null {
  const parts = pathname.split('/');
  if (parts[1] !== 'marketplace' || !parts[2]) return null;
  let decoded = parts[2];
  try {
    decoded = decodeURIComponent(parts[2]);
  } catch {
    decoded = parts[2];
  }
  const slug = normKey(decoded);
  if (!slug || parts[2] === slug) return null;
  const next = [...parts];
  next[2] = slug;
  return next.join('/') || '/marketplace';
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const retired = retiredServicePath(pathname);
  if (retired) {
    const url = request.nextUrl.clone();
    url.pathname = retired;
    return withSecurityHeaders(NextResponse.redirect(url, 301));
  }

  const canonical = canonicalMarketplacePath(pathname);
  if (canonical) {
    const url = request.nextUrl.clone();
    url.pathname = canonical;
    return withSecurityHeaders(NextResponse.redirect(url, 301));
  }

  // Files under public/ are world-readable by design; gating them on a session
  // made every product image 307 to /login for signed-out visitors.
  const lastSegment = pathname.slice(pathname.lastIndexOf('/') + 1);
  if (lastSegment.includes('.')) return NextResponse.next();

  const isPublic = PUBLIC_ROUTES.some((route) => {
    if (route === '/') return pathname === '/';
    return pathname === route || pathname.startsWith(route + '/');
  });

  // Only account and admin areas require a session. Any other unknown URL
  // must reach Next.js so it can answer 404 instead of a login redirect.
  const PRIVATE_PREFIXES = ['/admin', '/employee', '/client', '/dashboard', '/settings', '/profile', '/cart', '/checkout'];
  const needsSession = PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + '/'))
    || (pathname.startsWith('/api/') && !isPublic);

  if (!needsSession) return withSecurityHeaders(NextResponse.next());

  let session: { user?: { id: string } } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getSession();
    session = data.session ?? null;
  } catch {
    session = null;
  }

  if (!session?.user) {
    // API callers need a JSON 401 they can render, not an HTML login redirect
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Please log in to use this feature.' },
        { status: 401, headers: { 'WWW-Authenticate': 'Session' } }
      );
    }
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single() as unknown as { data: { role?: string } | null };

    const role = profile?.role ?? 'client';

    if (pathname.startsWith('/admin') && !['ceo', 'admin', 'manager'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (
      pathname.startsWith('/employee') &&
      !['ceo', 'admin', 'manager', 'developer', 'support', 'hr', 'employee'].includes(role)
    ) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (pathname.startsWith('/dashboard') && role !== 'client') {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
    if (pathname.startsWith('/client') && !['client', 'ceo', 'admin'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }

    const response = withSecurityHeaders(NextResponse.next());

    // CORS for API routes
    if (pathname.startsWith('/api/')) {
      const origin = request.headers.get('origin') || '';
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
      if (allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        response.headers.set('Access-Control-Max-Age', '86400');
      }
    }
    
    return response;
  } catch {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/payments/webhook).*)',
  ],
};
