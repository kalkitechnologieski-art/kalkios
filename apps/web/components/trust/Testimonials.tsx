// == KALKI OS — SOCIAL PROOF ==
// Public testimonials. Real approved quotes when the team has collected them;
// otherwise a verifiable-commitments panel. Never invented numbers.
// -----------------------------------------------------------------------------

import Link from 'next/link'
import { ArrowRight, BadgeCheck, Clock3, FileText, Quote, Star, Wallet } from 'lucide-react'
import type { Testimonial } from '@/lib/testimonials'

const COMMITMENTS = [
  {
    icon: FileText,
    title: 'A written scope before any work',
    body: 'You get a fixed-scope quote listing deliverables, revisions and the delivery date. If it is not written down, it is not promised.',
  },
  {
    icon: Wallet,
    title: '₹0 to start',
    body: 'No card, no payment link, no advance. You approve the quote first, then we schedule the work.',
  },
  {
    icon: Clock3,
    title: 'Reply within 24 hours',
    body: 'Every request is read by a person on the KALKI team, not sent into a queue that never answers.',
  },
  {
    icon: BadgeCheck,
    title: 'One direct line',
    body: 'You talk to the founder who builds the work — ceo@kalki-intelligence.in. No ticket portal, no account manager relay.',
  },
]

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating)
  return (
    <div className="flex gap-0.5" aria-label={`${rounded} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-3.5 h-3.5 ${s <= rounded ? 'fill-amber-400 text-amber-400' : 'text-white/20'}`}
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

export function Testimonials({ items, compact = false }: { items: Testimonial[]; compact?: boolean }) {
  if (items.length > 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {items.slice(0, compact ? 3 : 6).map((t) => (
          <figure
            key={t.id}
            className="kalki-panel rounded-2xl p-5 md:p-6 flex flex-col gap-4"
          >
            <Quote className="w-6 h-6 text-cyan-500/40" aria-hidden="true" />
            <blockquote className="text-white/80 text-sm leading-relaxed flex-1">“{t.quote}”</blockquote>
            <figcaption className="pt-1">
              <Stars rating={t.rating} />
              <p className="mt-2 text-white font-semibold text-sm">{t.authorName}</p>
              <p className="text-white/45 text-xs">
                {[t.authorRole, t.authorCompany, t.city].filter(Boolean).join(' · ')}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    )
  }

  return (
    <div className="kalki-panel rounded-2xl p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-white text-lg font-semibold">How we work, in writing</h3>
          <p className="text-white/50 text-sm mt-1 max-w-xl">
            We publish reviews from projects we have actually closed. Until then, here is what you can
            hold us to on day one.
          </p>
        </div>
        <Link
          href="/request"
          className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full bg-cyan-500 text-primary-foreground hover:opacity-90 transition"
        >
          Start with a free brief
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {COMMITMENTS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <Icon className="w-5 h-5 text-cyan-500" aria-hidden="true" />
            <p className="mt-3 text-white text-sm font-semibold leading-snug">{title}</p>
            <p className="mt-1.5 text-white/55 text-xs leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
