'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { CyberpunkForm, CyberpunkInput, CyberpunkButton } from '@/components/ui/CyberpunkForm'
import { ROLE_ROUTES } from '@/lib/auth/role-routes'
import { Eye, EyeOff, Sparkles } from 'lucide-react'

function safeRedirectTarget(param: string | null): string | null {
  if (!param) return null
  if (!param.startsWith('/') || param.startsWith('//')) return null
  return param
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const roleRoute = useMemo(() => {
    const route = safeRedirectTarget(searchParams.get('redirect'))
    return async (userId: string) => {
      if (route) return route
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      const role = (profile as { role?: string } | null)?.role ?? 'client'
      return ROLE_ROUTES[role] ?? '/client'
    }
  }, [supabase, searchParams])

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        router.replace(await roleRoute(session.user.id))
      }
    })()
  }, [supabase, router, roleRoute])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError
      if (data.user) {
        router.replace(await roleRoute(data.user.id))
        router.refresh()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${siteUrl}/auth/callback` },
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-2xl animate-pulse" />
            <Image
              src="/images/logo.svg"
              alt="KALKI OS"
              width={96}
              height={96}
              className="object-contain relative z-10"
              priority
            />
          </div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
          KALKI OS
        </h1>
        <p className="text-cyan-400/40 text-sm font-mono tracking-wider">SECURE ACCESS</p>

        <CyberpunkForm onSubmit={handleEmailLogin}>
          <CyberpunkInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
            required
          />
          <div className="relative w-full">
            <CyberpunkInput
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 bottom-3 text-cyan-400/40 hover:text-cyan-400 transition"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
          <CyberpunkButton type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </CyberpunkButton>
        </CyberpunkForm>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-cyan-500/10" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-[#0A0A0F] text-cyan-400/30 font-mono">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 text-sm font-medium transition border border-white/10 flex items-center justify-center gap-2"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Sign in with Google
        </button>

        <p className="text-sm text-white/50">
          New to KALKI OS?{' '}
          <Link href="/register" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
