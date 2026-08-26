import { createClient } from '@/lib/supabase/server'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { MapPin, Mail, Phone, Clock } from 'lucide-react'
import type { Metadata } from 'next'
import ContactForm from '@/components/ContactForm'

export const metadata: Metadata = {
  title: 'Contact KALKI OS — Indore, MP | Temple of Technology',
  description: 'Get in touch with KALKI OS. Visit us at 51, MOG Lines, Swastik Nagar, Indore. Email ceo@kalki-intelligence.in or team@kalki-intelligence.in.',
  keywords: 'contact, KALKI OS, Indore, Madhya Pradesh, AI company',
}

export default async function ContactPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-12">
      <ScrollReveal direction="up">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
            Get in Touch
          </h1>
          <p className="text-cyan-400/40 text-lg mt-4 max-w-2xl mx-auto font-mono">
            Visit the Temple of Technology. We're here to help.
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 space-y-6">
          <h2 className="text-xl font-bold text-white font-mono">📍 Visit Us</h2>
          <p className="text-cyan-400/60 text-sm font-mono leading-relaxed">
            51, MOG Lines,<br />
            Swastik Nagar,<br />
            Indore, Madhya Pradesh 452002<br />
            India
          </p>
          <div className="space-y-2">
            <p className="flex items-center gap-2 text-cyan-400/40 text-sm font-mono"><Mail className="w-4 h-4" /> ceo@kalki-intelligence.in</p>
            <p className="flex items-center gap-2 text-cyan-400/40 text-sm font-mono"><Mail className="w-4 h-4" /> team@kalki-intelligence.in</p>
          </div>
          <div className="flex items-center gap-2 text-cyan-400/30 text-xs font-mono border-t border-cyan-500/10 pt-4">
            <Clock className="w-3 h-3" /> Mon–Fri, 9:00 AM – 6:00 PM IST
          </div>
        </div>

        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white font-mono mb-4">✉️ Send a Message</h2>
          <ContactForm />
        </div>
      </div>

      <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 text-center text-cyan-400/20 text-xs font-mono">
        <p>🔹 Your message goes directly to our leadership team. We respond within 24 hours.</p>
      </div>
    </div>
  )
}
