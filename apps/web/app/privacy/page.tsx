import Link from 'next/link'
import { ScrollReveal } from '@/components/ui/ScrollReveal'

export const metadata = {
  title: 'Privacy Policy — KALKI OS',
  description:
    'How KALKI Intelligence LLP collects, uses, and protects your personal data across KALKI OS. India-based, DP Act compliant.',
  alternates: { canonical: 'https://kalkios.com/privacy' },
}

const SECTIONS: { h: string; p: string }[] = [
  {
    h: 'Who we are',
    p: 'KALKI OS is operated by KALKI Intelligence LLP, 51 MOG Lines, Swastik Nagar, Indore, Madhya Pradesh 452002, India. For any privacy question write to team@kalki-intelligence.in.',
  },
  {
    h: 'What we collect',
    p: 'We collect the details you submit when you request a service or create an account: name, email, phone, company, budget, timeline and your project requirements. We also collect usage metadata (pages visited, device type) to improve the platform.',
  },
  {
    h: 'How we use it',
    p: 'To prepare and deliver a tailored quote, manage your projects and invoices, provide support, and improve our services. We never sell your personal data.',
  },
  {
    h: 'Legal basis & retention',
    p: 'We process your data to fulfil our contract with you and on your consent, consistent with the Digital Personal Data Protection Act, 2023 (India). We retain request and project records only as long as needed to deliver the service or as required by law.',
  },
  {
    h: 'Cookies & storage',
    p: 'We use essential cookies for authentication and session security. Analytics cookies are used in aggregate to understand traffic. You can clear cookies in your browser at any time.',
  },
  {
    h: 'Third parties',
    p: 'We use vetted infrastructure providers (Supabase for data hosting, Groq/Z.AI/OpenRouter and Agnes for AI inference) strictly to operate the services you request. Each is bound by data-processing terms.',
  },
  {
    h: 'Security',
    p: 'Data is encrypted in transit (TLS) and at rest. Access is role-restricted. If a breach affects your data we will notify you and the relevant authority without undue delay.',
  },
  {
    h: 'Your rights',
    p: 'You may access, correct, export or request deletion of your personal data, and withdraw consent, by emailing team@kalki-intelligence.in. We respond within 30 days.',
  },
]

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <ScrollReveal direction="up">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono">
          Privacy Policy
        </h1>
        <p className="text-cyan-400/40 text-sm font-mono mt-2">Last updated: October 2026</p>

        <div className="mt-8 space-y-8">
          {SECTIONS.map((s) => (
            <section key={s.h}>
              <h2 className="text-white font-semibold text-lg mb-2">{s.h}</h2>
              <p className="text-white/60 leading-relaxed">{s.p}</p>
            </section>
          ))}
        </div>

        <p className="text-white/30 text-sm mt-10">
          Questions? Email{' '}
          <a href="mailto:team@kalki-intelligence.in" className="text-cyan-300 hover:underline">
            team@kalki-intelligence.in
          </a>{' '}
          or read our <Link href="/terms" className="text-cyan-300 hover:underline">Terms &amp; Conditions</Link>.
        </p>
      </ScrollReveal>
    </div>
  )
}
