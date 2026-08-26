'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LuxuryButton } from '@/components/ui/LuxuryButton'

export default function ContactForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase
        .from('leads')
        .insert({ name, email, phone, subject, message, source: 'contact' })
      if (error) throw error
      setSuccess(true)
      setName(''); setEmail(''); setPhone(''); setSubject(''); setMessage('')
    } catch (err: any) {
      setError(err.message || 'Submission failed')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return <p className="text-green-400 font-mono text-sm">✅ Thank you! We'll be in touch shortly.</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full Name" required className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono" />
      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono" />
      <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" required className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono" />
      <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" rows={4} required className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono resize-none" />
      {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
      <LuxuryButton type="submit" variant="primary" size="lg" label={loading ? 'Sending...' : 'Send Message'} fullWidth disabled={loading} />
    </form>
  )
}
