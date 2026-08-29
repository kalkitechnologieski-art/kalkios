import { Metadata } from 'next'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { MapPin, Mail, Phone, Clock, Building, Globe } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Contact KALKI Intelligence — Indore, MP',
  description: 'Get in touch with KALKI Intelligence. Visit us at 52, Swastik Nagar, Indore. Email ceo@kalki-intelligence.in or team@kalki-intelligence.in.',
  keywords: 'contact, KALKI Intelligence, Indore, Madhya Pradesh, AI company, digital marketing',
}

export default function ContactPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      <ScrollReveal direction="up">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
            Contact Us
          </h1>
          <p className="text-cyan-400/40 text-lg mt-4 max-w-2xl mx-auto font-mono">
            Get in touch with the Temple of Technology
          </p>
        </div>
      </ScrollReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ScrollReveal direction="left">
          <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 space-y-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white font-mono flex items-center gap-2">
              <Building className="w-5 h-5 text-cyan-400" />
              Visit Us
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="text-white/60 text-sm font-mono leading-relaxed">
                    52, Swastik Nagar,<br />
                    Indore, Madhya Pradesh 452002<br />
                    India
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div>
                  <p className="text-white/60 text-sm font-mono">ceo@kalki-intelligence.in</p>
                  <p className="text-white/40 text-sm font-mono">team@kalki-intelligence.in</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <p className="text-white/60 text-sm font-mono">+91 98765 43210</p>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <p className="text-white/60 text-sm font-mono">Mon–Fri, 9:00 AM – 6:00 PM IST</p>
              </div>
            </div>
            <div className="pt-4 border-t border-cyan-500/10">
              <p className="text-cyan-400/30 text-xs font-mono">
                🔹 We respond to all inquiries within 24 hours.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right">
          <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-white font-mono mb-4">Send a Message</h2>
            <form className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono"
              />
              <input
                type="email"
                placeholder="Email"
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono"
              />
              <input
                type="text"
                placeholder="Subject"
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono"
              />
              <textarea
                placeholder="Message"
                rows={4}
                className="w-full bg-black/40 border border-cyan-500/20 rounded-xl px-4 py-3 text-white placeholder-cyan-400/30 outline-none focus:border-cyan-500/50 transition text-sm font-mono resize-none"
              />
              <LuxuryButton
                type="submit"
                variant="primary"
                size="lg"
                label="Send Message"
                fullWidth
              />
            </form>
          </div>
        </ScrollReveal>
      </div>

      <ScrollReveal direction="up">
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 text-center text-cyan-400/20 text-xs font-mono">
          <p>🔹 Your message goes directly to our leadership team. We respond within 24 hours.</p>
        </div>
      </ScrollReveal>
    </div>
  )
}
