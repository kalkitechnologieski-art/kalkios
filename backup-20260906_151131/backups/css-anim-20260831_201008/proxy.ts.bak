import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function proxy(request: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const pathname = request.nextUrl.pathname

  const publicRoutes = ['/', '/login', '/auth/callback', '/contact', '/careers', '/services', '/explore', '/marketplace']
  if (publicRoutes.includes(pathname) || pathname.startsWith('/services/')) {
    return NextResponse.next()
  }

  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const role = profile?.role || 'client'

  const adminRoutes = ['/admin', '/admin/']
  const employeeRoutes = ['/employee', '/employee/']
  const clientRoutes = ['/dashboard', '/dashboard/']

  if (adminRoutes.some(r => pathname === r || pathname.startsWith(r))) {
    if (!['ceo', 'admin', 'manager'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  if (employeeRoutes.some(r => pathname === r || pathname.startsWith(r))) {
    if (!['ceo', 'admin', 'manager', 'developer', 'support', 'hr', 'employee'].includes(role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  if (clientRoutes.some(r => pathname === r || pathname.startsWith(r))) {
    if (role !== 'client') {
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  return response
}
