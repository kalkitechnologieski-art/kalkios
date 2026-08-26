import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import Link from 'next/link'

export const metadata = {
  title: 'Support — KALKI OS',
  description: 'Get help and support for KALKI OS services.',
}

export default function SupportPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <ScrollReveal direction="up">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
          Support
        </h1>
        <p className="text-cyan-400/40 text-sm font-mono mt-2">We're here to help</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6">
            <h2 className="text-white font-mono text-lg">📧 Email</h2>
            <p className="text-cyan-400/60 text-sm mt-2">team@kalki-intelligence.in</p>
            <p className="text-cyan-400/30 text-xs mt-1">Response within 24 hours</p>
          </div>
          <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6">
            <h2 className="text-white font-mono text-lg">💬 Chat</h2>
            <p className="text-cyan-400/60 text-sm mt-2">Talk to Siddhi AI</p>
            <Link href="/chat">
              <LuxuryButton variant="secondary" size="sm" label="Open Chat" className="mt-3" />
            </Link>
          </div>
          <div className="bg-white/5 border border-cyan-500/10 rounded-xl p-6 md:col-span-2">
            <h2 className="text-white font-mono text-lg">📍 Visit Us</h2>
            <p className="text-cyan-400/60 text-sm mt-2">
              51, MOG Lines, Swastik Nagar, Indore, Madhya Pradesh 452002
            </p>
          </div>
        </div>
      </ScrollReveal>
    </div>
  )
}
