import type { Metadata } from 'next'
import { Sparkles } from 'lucide-react'
import ExploreClient from './ExploreClient'
import { AnimatedHeadline } from '@/components/motion/AnimatedHeadline'
import { AnimatedEyebrow } from '@/components/motion/AnimatedEyebrow'
import { SiteFooter } from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'Explore Services — Search Our AI Catalog',
  description:
    'Search every service offered by KALKI Intelligence, an AI tech company in Indore: websites, SEO, chatbots, automation, design and marketing. Fixed INR prices, written scope, quote within 24 hours.',
  keywords:
    'explore AI services, tech company Indore, web development services, AI chatbot services, SEO services India, KALKI OS',
  alternates: { canonical: '/explore' },
}

export default function ExplorePage() {
  return (
    <>
      <div className="max-w-3xl mx-auto px-4 py-8 flex flex-col gap-6">
        <div className="flex items-start gap-3">
          <Sparkles className="w-8 h-8 text-purple-400 mt-1 flex-shrink-0" />
          <div>
            <AnimatedEyebrow label="Service search" className="mb-3" />
            <AnimatedHeadline
              as="h1"
              text="Explore Tech Company Services"
              className="text-3xl font-bold text-white"
            />
            <p className="text-white/65 text-sm mt-1">
              Search the full catalog of KALKI Intelligence, an AI tech company in Indore serving businesses across India.
            </p>
          </div>
        </div>
        <ExploreClient />
      </div>
      <SiteFooter />
    </>
  )
}
