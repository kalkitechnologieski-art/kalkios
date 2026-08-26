import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const error = searchParams.get('error')

  // If there's an error or no code, redirect to home
  if (error || !code) {
    console.warn('Auth callback error or missing code:', error)
    return NextResponse.redirect(new URL('/', origin))
  }

  try {
    const supabase = await createClient()
    // Exchange the code for a session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      // flow_state_already_used means the callback was called twice
      // The user is likely already signed in, redirect to home
      if (exchangeError.message?.includes('flow_state_already_used')) {
        console.warn('State already used — user may already be signed in. Redirecting to home.')
        return NextResponse.redirect(new URL('/', origin))
      }
      console.error('Auth exchange error:', exchangeError)
      return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
    }

    // Success: redirect to home
    return NextResponse.redirect(new URL('/', origin))
  } catch (err) {
    console.error('Auth callback exception:', err)
    return NextResponse.redirect(new URL('/login?error=auth_failed', origin))
  }
}
