// == KALKI SERVICE REQUEST FORM ==
// Premium glassmorphism, no-payment submission. Pick one or more services,
// describe your project, and submit — an order + project are created server-side.
// -----------------------------------------------------------------------------

'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Search,
  X,
  Check,
  Plus,
  Loader2,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  User,
  Building2,
  Wallet,
  CalendarClock,
  ClipboardList,
  ShieldCheck,
  Clock,
  Star,
  MessageCircle,
} from 'lucide-react'
import type { PickerService } from './page'

const MAX_SERVICES = 5

const fieldClass =
  'w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20'

export function RequestForm({
  services,
  initialServiceId,
}: {
  services: PickerService[]
  initialServiceId?: string | null
}) {
  const [selected, setSelected] = useState<string[]>(
    initialServiceId ? [initialServiceId] : []
  )
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerPhone: '',
    company: '',
    budget: '',
    timeline: '',
    requirements: '',
  })
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const formWrapRef = useRef<HTMLDivElement>(null)

  const byId = useMemo(() => {
    const m: Record<string, PickerService> = {}
    for (const s of services) m[s.id] = s
    return m
  }, [services])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? services.filter((s) => `${s.name} ${s.category}`.toLowerCase().includes(q))
      : services
    return list.slice(0, 60)
  }, [services, query])

  const toggle = (id: string) => {
    setSelected((cur) => {
      if (cur.includes(id)) return cur.filter((x) => x !== id)
      if (cur.length >= MAX_SERVICES) return cur
      return [...cur, id]
    })
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  const canSubmit =
    selected.length > 0 &&
    form.buyerName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.buyerEmail.trim()) &&
    /^[0-9+\-\s()]{7,15}$/.test(form.buyerPhone.trim())

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selected.length === 0) {
      setError('Please choose at least one service.')
      formWrapRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    setStatus('loading')
    setError(null)
    try {
      const res = await fetch('/api/services/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceIds: selected, ...form }),
      })
      const data = (await res.json().catch(() => null)) as
        | { error?: string; requestId?: string }
        | null
      if (!res.ok) throw new Error(data?.error ?? 'We could not submit your request. Please try again.')
      setRequestId(data?.requestId ?? null)
      setStatus('success')
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return <SuccessCard requestId={requestId} selected={selected.map((id) => byId[id]?.name).filter(Boolean) as string[]} />
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm mb-5">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm text-white/70 font-medium">Request · No payment now</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-white leading-tight">
          Tell us what you want to build
        </h1>
        <p className="text-white/50 mt-4 text-base md:text-lg max-w-xl mx-auto">
          Pick your services and share a few details. You get a tailored quote and a free
          consultation within 24 hours — you only pay once you approve the proposal.
        </p>
      </motion.div>

      {/* How it works */}
      <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
        {[
          { icon: ClipboardList, label: 'Share your brief' },
          { icon: Clock, label: 'Quote in 24 hours' },
          { icon: ShieldCheck, label: 'Pay only after approval' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <div key={i} className="flex flex-col items-center gap-2 text-center rounded-2xl bg-white/[0.03] border border-white/10 px-2 py-4">
              <Icon className="w-5 h-5 text-cyan-400" />
              <span className="text-[11px] md:text-sm text-white/60 font-medium leading-tight">{s.label}</span>
            </div>
          )
        })}
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        {/* Step 1: services */}
        <section
          ref={formWrapRef}
          className="rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl p-5 md:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-base md:text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span className="text-cyan-400/70 text-sm">1.</span> Choose your services
            </h2>
            <span className="text-xs text-white/40">{selected.length}/{MAX_SERVICES} selected</span>
          </div>

          {services.length === 0 ? (
            <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 text-amber-200/80 text-sm flex items-start gap-2">
              <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                We couldn't load the catalog right now. You can still describe your needs —{' '}
                <Link href="/chat" className="underline text-cyan-300">ask Siddhi AI</Link> or{' '}
                <Link href="/contact" className="underline text-cyan-300">contact us</Link> and we'll help you directly.
              </div>
            </div>
          ) : (
            <>
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-white/30 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search 50+ services — website, app, SEO, dashboard…"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-white/30 outline-none focus:border-cyan-400/50 transition"
                />
              </div>

              {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  <AnimatePresence>
                    {selected.map((id) => {
                      const s = byId[id]
                      if (!s) return null
                      return (
                        <motion.button
                          key={id}
                          type="button"
                          layout
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                          onClick={() => toggle(id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-200 text-xs font-medium hover:bg-cyan-500/25 transition"
                        >
                          {s.name}
                          <X className="w-3.5 h-3.5" />
                        </motion.button>
                      )
                    })}
                  </AnimatePresence>
                </div>
              )}

              <div className="max-h-64 overflow-y-auto pr-1 space-y-1.5 -mr-1">
                {filtered.map((s) => {
                  const on = selected.includes(s.id)
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggle(s.id)}
                      className={`w-full flex items-center gap-3 text-left rounded-xl px-3 py-2.5 border transition ${
                        on
                          ? 'bg-cyan-500/10 border-cyan-400/40'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/5 hover:border-white/10'
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                          on ? 'bg-cyan-400 border-cyan-400 text-black' : 'border-white/20 text-white/30'
                        }`}
                      >
                        {on ? <Check className="w-4 h-4" strokeWidth={3} /> : <Plus className="w-4 h-4" />}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-white text-sm truncate">{s.name}</span>
                        <span className="block text-white/40 text-xs">{s.category}</span>
                      </span>
                      {s.price != null && (
                        <span className="flex-shrink-0 text-white/50 text-xs">from ₹{s.price.toLocaleString('en-IN')}</span>
                      )}
                    </button>
                  )
                })}
                {filtered.length === 0 && (
                  <p className="text-white/40 text-sm py-4 text-center">No services match “{query}”.</p>
                )}
              </div>
            </>
          )}
        </section>

        {/* Step 2: details */}
        <section className="rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl p-5 md:p-6 space-y-4">
          <h2 className="text-white font-bold text-base md:text-lg flex items-center gap-2">
            <User className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-400/70 text-sm">2.</span> Your details
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <IconField icon={User} placeholder="Full name *" value={form.buyerName} onChange={set('buyerName')} />
            <IconField icon={Mail} placeholder="Email *" type="email" value={form.buyerEmail} onChange={set('buyerEmail')} />
            <IconField icon={Phone} placeholder="Phone / WhatsApp *" type="tel" value={form.buyerPhone} onChange={set('buyerPhone')} />
            <IconField icon={Building2} placeholder="Company (optional)" value={form.company} onChange={set('company')} />
            <IconField icon={Wallet} placeholder="Budget range (optional) — e.g. ₹20k–₹50k" value={form.budget} onChange={set('budget')} />
            <IconField icon={CalendarClock} placeholder="Timeline (optional) — e.g. 2 weeks" value={form.timeline} onChange={set('timeline')} />
          </div>
          <div>
            <label className="flex items-center gap-2 text-white/70 text-sm mb-2">
              <ClipboardList className="w-4 h-4 text-cyan-400" />
              Project requirements
            </label>
            <textarea
              value={form.requirements}
              onChange={set('requirements')}
              rows={5}
              maxLength={4000}
              placeholder="Describe what you need — goal, pages/features, examples you like, anything we should know…"
              className={fieldClass + ' resize-y'}
            />
            <div className="flex justify-between items-center mt-1.5">
              <p className="text-white/30 text-xs">The more detail, the more accurate your quote.</p>
              <span className="text-white/30 text-xs">{form.requirements.length}/4000</span>
            </div>
          </div>
        </section>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 text-sm flex items-start gap-2"
          >
            <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="group w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold shadow-lg shadow-cyan-500/25 transition"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              Submit request — free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
        <p className="text-center text-white/40 text-xs flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          No payment, no card required. We'll never share your details.
        </p>
      </form>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
        <span className="text-white/40">Not sure which service fits?</span>
        <Link href="/chat" className="inline-flex items-center gap-2 text-cyan-300 hover:text-cyan-200 font-medium">
          <MessageCircle className="w-4 h-4" />
          Ask Siddhi AI for a recommendation
        </Link>
      </div>
    </div>
  )
}

function IconField({
  icon: Icon,
  placeholder,
  value,
  onChange,
  type = 'text',
}: {
  icon: React.ComponentType<{ className?: string }>
  placeholder: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  type?: string
}) {
  return (
    <div className="relative">
      <Icon className="w-4 h-4 text-white/25 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-white/30 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
      />
    </div>
  )
}

function SuccessCard({ requestId, selected }: { requestId: string | null; selected: string[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className="max-w-xl mx-auto rounded-3xl bg-white/[0.05] border border-white/10 backdrop-blur-xl p-8 md:p-10 text-center"
    >
      <div className="mx-auto w-16 h-16 rounded-2xl bg-green-500/15 border border-green-400/30 flex items-center justify-center mb-6">
        <Check className="w-8 h-8 text-green-400" strokeWidth={3} />
      </div>
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-3">Request received</h1>
      <p className="text-white/60 mb-6">
        Thanks! Our team is reviewing your brief for{' '}
        <span className="text-cyan-300">{selected.length > 0 ? selected.join(', ') : 'your project'}</span>.
        Expect a tailored quote and a call from us within 24 hours.
      </p>

      {requestId && (
        <div className="rounded-xl bg-black/30 border border-white/10 px-4 py-3 mb-6 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-white/40">Reference</span>
            <span className="font-mono text-white">{requestId.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      )}

      <div className="space-y-2 text-left mb-8">
        {[
          'We review your requirements and prepare a proposal.',
          'You get a fixed quote — discuss and adjust freely.',
          'Approve it, then pay — work starts right away.',
        ].map((line, i) => (
          <div key={i} className="flex items-start gap-3 text-sm text-white/70">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs flex items-center justify-center font-semibold">
              {i + 1}
            </span>
            {line}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/chat"
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-purple-600 text-white font-semibold hover:from-cyan-500 hover:to-purple-500 transition"
        >
          <Sparkles className="w-4 h-4" />
          Talk to Siddhi now
        </Link>
        <Link
          href="/marketplace"
          className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white/5 border border-white/10 text-white/80 font-medium hover:bg-white/10 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to services
        </Link>
      </div>
    </motion.div>
  )
}
