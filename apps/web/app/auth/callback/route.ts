import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // Use production URL if available, otherwise fallback to origin
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || origin

  if (error || !code) {
    console.warn('Auth callback error or missing code:', error)
    return NextResponse.redirect(new URL('/', baseUrl))
  }

  try {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      if (exchangeError.message?.includes('flow_state_already_used')) {
        console.warn('State already used — user may already be signed in.')
        return NextResponse.redirect(new URL('/', baseUrl))
      }
      console.error('Auth exchange error:', exchangeError)
      return NextResponse.redirect(new URL('/login?error=auth_failed', baseUrl))
    }

    // Redirect to dashboard after successful login
    return NextResponse.redirect(new URL('/dashboard', baseUrl))
  } catch (err) {
    console.error('Auth callback exception:', err)
    return NextResponse.redirect(new URL('/login?error=auth_failed', baseUrl))
  }
}
