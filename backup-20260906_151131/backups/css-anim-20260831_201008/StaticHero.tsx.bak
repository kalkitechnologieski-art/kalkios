'use client'

import { LuxuryButton } from './LuxuryButton'
import Link from 'next/link'

export function StaticHero() {
  return (
    <div className="relative h-[60vh] min-h-[400px] w-full overflow-hidden bg-gradient-to-br from-cyan-900/30 via-black to-purple-900/30 flex items-center justify-center">
      <div className="absolute inset-0 bg-[url('/images/grid.svg')] opacity-10" />
      <div className="relative z-10 text-center px-6 max-w-3xl">
        <p className="text-cyan-400/60 text-sm font-mono tracking-[0.3em] mb-2">
          ● KALKI INTELLIGENCE
        </p>
        <h1 className="text-4xl md:text-6xl font-bold text-white font-mono leading-tight">
          Welcome to the Temple of Technology
        </h1>
        <p className="text-white/60 text-lg md:text-xl mt-4 font-light">
          AI-Powered Solutions for the Future
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/chat">
            <LuxuryButton variant="primary" size="lg" label="Chat with Siddhi" />
          </Link>
          <Link href="/marketplace">
            <LuxuryButton variant="secondary" size="lg" label="Explore Services" />
          </Link>
        </div>
      </div>
    </div>
  )
}
