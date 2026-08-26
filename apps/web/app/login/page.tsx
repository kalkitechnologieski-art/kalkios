'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { Eye, EyeOff, LogIn, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single()
        const role = profile?.role || 'client'
        const routes: Record<string, string> = {
          ceo: '/admin', admin: '/admin', manager: '/admin',
          developer: '/employee', support: '/employee', hr: '/employee',
          employee: '/employee', client: '/dashboard',
        }
        router.push(routes[role] || '/')
      }
    }
    checkSession()
  }, [supabase, router])

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
      if (data.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
        const role = profile?.role || 'client'
        const routes: Record<string, string> = {
          ceo: '/admin', admin: '/admin', manager: '/admin',
          developer: '/employee', support: '/employee', hr: '/employee',
          employee: '/employee', client: '/dashboard',
        }
        router.push(routes[role] || '/')
      }
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
      <div className="max-w-md w-full space-y-8">
        <div className="flex justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full bg-cyan-500/30 blur-2xl animate-pulse" />
            <Image src="/images/logo.svg" alt="KALKI OS" width={96} height={96} className="object-contain relative z-10" priority />
          </div>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
          KALKI OS
        </h1>
        <p className="text-cyan-400/40 text-sm font-mono tracking-wider">● SECURE ACCESS ●</p>

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div className="text-left">
            <label className="text-cyan-400/60 text-xs font-mono tracking-wider">EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="text-left">
            <label className="text-cyan-400/60 text-xs font-mono tracking-wider">PASSWORD</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono pr-12"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cyan-400/40 hover:text-cyan-400 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

          <LuxuryButton
            type="submit"
            variant="primary"
            size="lg"
            label={loading ? 'Signing in...' : 'Sign In'}
            icon={<LogIn className="w-4 h-4" />}
            iconPosition="right"
            fullWidth
            disabled={loading}
          />
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-cyan-500/10" /></div>
          <div className="relative flex justify-center text-xs"><span className="px-2 bg-[#0A0A0F] text-cyan-400/30 font-mono">or</span></div>
        </div>

        <LuxuryButton
          variant="secondary"
          size="lg"
          label="Sign in with Google"
          icon={<Sparkles className="w-4 h-4" />}
          iconPosition="left"
          fullWidth
          onClick={handleGoogleLogin}
        />
      </div>
    </div>
  )
}
