import type { Metadata } from 'next'
import { Mail, MessageSquare, MapPin } from 'lucide-react'
import Link from 'next/link'
import { ScrollReveal } from '@/components/ui/ScrollReveal'
import { AnimatedHeadline } from '@/components/motion/AnimatedHeadline'
import { AnimatedEyebrow } from '@/components/motion/AnimatedEyebrow'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { SiteFooter } from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'Support — AI Tech Company in Indore',
  description:
    'Get help with a KALKI OS project: email the team, chat with Siddhi, or meet us in Indore. Replies within 24 hours on working days.',
  alternates: { canonical: '/support' },
}

type Channel = {
  icon: typeof Mail
  title: string
  primary: string
  note: string
  accent: string
  href?: string
  cta?: string
}

const channels: Channel[] = [
  {
    icon: Mail,
    title: 'Email',
    primary: 'team@kalki-intelligence.in',
    note: 'Written reply within 24 hours on working days',
    accent: 'text-cyan-400',
  },
  {
    icon: MessageSquare,
    title: 'Chat with Siddhi',
    primary: 'Our AI concierge, in Hindi and English',
    note: 'Instant answers about scope, pricing and timelines',
    accent: 'text-purple-400',
    href: '/chat',
    cta: 'Open chat',
  },
  {
    icon: MapPin,
    title: 'Visit us',
    primary: '51, MOG Lines, Swastik Nagar, Indore, Madhya Pradesh 452002',
    note: 'Face-to-face meetings, Monday to Friday, 9:00–18:00 IST',
    accent: 'text-pink-400',
  },
]

export default function SupportPage() {
  return (
    <>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <ScrollReveal direction="up">
          <div className="mb-4">
            <AnimatedEyebrow label="We are here" />
          </div>
          <AnimatedHeadline
            as="h1"
            text="Support for your project"
            gradient
            className="text-4xl font-bold font-mono"
          />
          <p className="text-cyan-400/80 text-sm font-mono mt-3">
            One team in Indore answers email, chat and in-person questions about your KALKI OS work.
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {channels.map((channel) => (
              <div
                key={channel.title}
                className="bg-white/5 border border-cyan-500/15 rounded-xl p-6"
              >
                <h2 className="flex items-center gap-2 text-white font-mono text-lg">
                  <channel.icon className={`w-5 h-5 ${channel.accent}`} />
                  {channel.title}
                </h2>
                <p className="text-cyan-400/85 text-sm mt-2">{channel.primary}</p>
                <p className="text-cyan-400/65 text-xs mt-1">{channel.note}</p>
                {channel.href ? (
                  <Link href={channel.href}>
                    <LuxuryButton
                      variant="outline"
                      size="sm"
                      label={channel.cta ?? 'Open'}
                      className="mt-3"
                    />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
      <SiteFooter />
    </>
  )
}
