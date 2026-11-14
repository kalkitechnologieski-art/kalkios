import { Metadata } from 'next'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { AnimatedHeadline } from '@/components/motion/AnimatedHeadline'
import { AnimatedEyebrow } from '@/components/motion/AnimatedEyebrow'
import { MapPin, Mail, Phone, Clock, Building } from 'lucide-react'
import { ContactFormClient } from './ContactFormClient'

export const metadata: Metadata = {
  title: 'Contact an AI Tech Company in Indore',
  description: 'Talk to KALKI Intelligence, an AI tech company in Indore, about a website, automation or growth project. Written quote within 24 hours, ₹0 to start. 52, MOG Lines, Swastik Nagar, Indore.',
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
      <ScrollReveal direction="up">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <AnimatedEyebrow label="Within 24 hours" />
          </div>
          <AnimatedHeadline
            as="h1"
            text="Contact KALKI Intelligence"
            className="text-4xl md:text-5xl font-bold font-mono leading-tight"
            gradient
          />
          <p className="text-cyan-400/85 text-lg mt-4 max-w-2xl mx-auto font-mono">
            Send the brief — get a written scope, a fixed price and a delivery date back
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
                    KALKI Intelligence<br />
                    52, MOG Lines, Swastik Nagar,<br />
                    Indore, Madhya Pradesh 452002<br />
                    India
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <div>
                  <a href="mailto:ceo@kalki-intelligence.in" className="block text-white/85 hover:text-cyan-300 text-sm font-mono transition">ceo@kalki-intelligence.in</a>
                  <a href="mailto:team@kalki-intelligence.in" className="block text-white/70 hover:text-cyan-300 text-sm font-mono transition">team@kalki-intelligence.in</a>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <a href="tel:+916261031710" className="text-white/85 hover:text-cyan-300 text-sm font-mono transition">+91 62610 31710</a>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <p className="text-white/60 text-sm font-mono">Mon–Fri, 9:00 AM – 6:00 PM IST</p>
              </div>
            </div>
            <div className="pt-4 border-t border-cyan-500/10">
              <p className="text-cyan-400/75 text-xs font-mono">
                🔹 We respond to all inquiries within 24 hours.
              </p>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal direction="right">
          <ContactFormClient />
        </ScrollReveal>
      </div>

      <ScrollReveal direction="up">
        <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-4 text-center text-cyan-400/70 text-xs font-mono">
          <p>🔹 Your message goes directly to our leadership team. We respond within 24 hours.</p>
        </div>
      </ScrollReveal>
    </div>
  )
}
