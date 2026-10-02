// ═══ SIDDHI v4.0 BATCH 1 ═══
// Fixed webhook matcher path; public routes preserved; RBAC intact.
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const PUBLIC_ROUTES = [
  '/chat', '/', '/login', '/register', '/auth/callback', '/contact', '/careers',
  '/services', '/explore', '/marketplace', '/about', '/terms', '/support', '/unauthorized',
  '/api/health', '/api/ai/chat',
  '/_next', '/favicon.ico',
];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isPublic = PUBLIC_ROUTES.some((route) => {
    if (route === '/') return pathname === '/';
    return pathname === route || pathname.startsWith(route + '/');
  });

  if (isPublic) return NextResponse.next();

  let session: { user?: { id: string } } | null = null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getSession();
    session = data.session ?? null;
  } catch {
    session = null;
  }

  if (!session?.user) {
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

    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
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
