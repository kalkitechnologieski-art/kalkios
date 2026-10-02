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

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])

  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session) {
        router.replace(safeRedirectTarget(searchParams.get('redirect')) ?? '/client')
      }
    })()
  }, [supabase, router, searchParams])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setNotice(null)

    if (!/^[a-z0-9_]{3,30}$/.test(username)) {
      setError('Username must be 3-30 characters (lowercase letters, numbers, underscore)')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username, full_name: fullName } },
      })
      if (signUpError) throw signUpError

      if (!data.session || !data.user) {
        setNotice('Account created. Check your email to confirm, then sign in.')
        setLoading(false)
        return
      }

      try {
        await supabase.from('profiles').upsert(
          { id: data.user.id, username, full_name: fullName } as never,
          { onConflict: 'id' }
        )
      } catch {
        /* bootstrap handled by DB trigger */
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      const role = (profile as { role?: string } | null)?.role ?? 'client'
      router.replace(ROLE_ROUTES[role] ?? '/client')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
      setLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setLoading(true)
    setError(null)
    try {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${siteUrl}/auth/callback` },
      })
      if (oauthError) throw oauthError
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign up failed')
      setLoading(false)
    }
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
          Create Account
        </h1>
        <p className="text-cyan-400/40 text-sm font-mono tracking-wider">JOIN KALKI OS</p>

        <CyberpunkForm onSubmit={handleRegister}>
          <CyberpunkInput
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Full Name"
            autoComplete="name"
            required
          />
          <CyberpunkInput
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            placeholder="Username"
            autoComplete="username"
            minLength={3}
            maxLength={30}
            required
          />
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
              placeholder="Password (min 8 characters)"
              autoComplete="new-password"
              minLength={8}
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
          {notice && <p className="text-cyan-300 text-xs font-mono">{notice}</p>}
          <CyberpunkButton type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'Create Account'}
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
          onClick={handleGoogleRegister}
          disabled={loading}
          className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 text-sm font-medium transition border border-white/10 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Continue with Google
        </button>

        <p className="text-sm text-white/50">
          Already have an account?{' '}
          <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  )
}
