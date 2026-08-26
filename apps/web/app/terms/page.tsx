import { ScrollReveal } from '@/components/ui/ScrollReveal'

export const metadata = {
  title: 'Terms & Conditions — KALKI OS',
  description: 'Terms and conditions for using KALKI OS services.',
}

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <ScrollReveal direction="up">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
          Terms & Conditions
        </h1>
        <p className="text-cyan-400/40 text-sm font-mono mt-2">Last updated: August 2026</p>
        <div className="mt-8 space-y-6 text-cyan-400/60 font-mono text-sm leading-relaxed">
          <p>By using KALKI OS, you agree to the following terms...</p>
          <p>1. You are responsible for maintaining the security of your account.</p>
          <p>2. All services are provided "as is" with no warranty.</p>
          <p>3. We reserve the right to update these terms at any time.</p>
          <p className="text-cyan-400/30 text-xs mt-8">For full terms, please contact team@kalki-intelligence.in</p>
        </div>
      </ScrollReveal>
    </div>
  )
}
