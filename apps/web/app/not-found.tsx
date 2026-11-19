import type { Metadata } from 'next'
import Link from 'next/link'
import { Face404 } from '@/components/ui/Face404'
import { LuxuryButton } from '@/components/ui/LuxuryButton'

export const metadata: Metadata = {
  title: 'Page not found',
  description: 'This URL is not on KALKI Intelligence. The marketplace, notes, and contact page are linked below.',
  robots: { index: false, follow: true },
}

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
      <Face404 />
      <h1 className="text-2xl font-bold text-white mt-4 font-mono">This page is not on the site</h1>
      <p className="text-cyan-400/70 text-sm mt-2 max-w-md">
        The address does not match a service, an article, or a company page. Use one of the links below.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
        <Link href="/marketplace" className="text-cyan-300 hover:text-cyan-200">Marketplace</Link>
        <Link href="/insights" className="text-cyan-300 hover:text-cyan-200">Notes</Link>
        <Link href="/about" className="text-cyan-300 hover:text-cyan-200">About</Link>
        <Link href="/contact" className="text-cyan-300 hover:text-cyan-200">Contact</Link>
      </div>
      <Link href="/" className="mt-6">
        <LuxuryButton variant="cyber" size="default" label="Return home" />
      </Link>
    </div>
  )
}
