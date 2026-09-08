// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PUBLIC_ROUTES = [
  '/chat',
  '/',
  '/login',
  '/auth/callback',
  '/contact',
  '/careers',
  '/services',
  '/explore',
  '/marketplace',
  '/api/health',
  '/api/ai/chat',
  '/_next',
  '/favicon.ico',
]

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Allow public routes
  const isPublic = PUBLIC_ROUTES.some(route => {
    if (route === '/') return pathname === '/'
    return pathname === route || pathname.startsWith(route + '/')
  })

  if (isPublic) {
    return NextResponse.next()
  }

  // Redirect to login if not authenticated
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Role-based access control
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single() as any

    const role = profile?.role || 'client'

    // Admin routes
    if (pathname.startsWith('/admin') && !['ceo', 'admin', 'manager'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Employee routes
    if (pathname.startsWith('/employee') && !['ceo', 'admin', 'manager', 'developer', 'support', 'hr', 'employee'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Dashboard (client only)
    if (pathname.startsWith('/dashboard') && role !== 'client') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    // Add security headers
    const response = NextResponse.next()
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('X-Frame-Options', 'DENY')
    return response

  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhook (webhook endpoints)
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhook).*)',
  ],
}
