import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { Suspense } from 'react'
import { ScrollProvider } from '@/components/providers/ScrollProvider'
import { GSAPProvider } from '@/components/providers/GSAPProvider'
import { AppLayout } from '@/components/ui/AppLayout'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.kalki-intelligence.in'),
  title: { template: '%s | KALKI OS', default: 'KALKI OS — Temple of Technology' },
  description: 'Premium AI-powered digital services marketplace.',
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="google" content="notranslate" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className={inter.className}>
        {/* SINGLE SUSPENSE BOUNDARY — fixes insertBefore error */}
        <Suspense fallback={<div className="min-h-screen bg-[#0A0A0F]" />}>
          <div className="app-root min-h-screen bg-[#0A0A0F]">
            <ScrollProvider>
              <GSAPProvider>
                <AppLayout>{children}</AppLayout>
              </GSAPProvider>
            </ScrollProvider>
          </div>
        </Suspense>
      </body>
    </html>
  )
}
