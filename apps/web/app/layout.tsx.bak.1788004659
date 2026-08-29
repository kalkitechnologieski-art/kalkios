import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { cn } from '@/lib/utils'
import { AppLayout } from '@/components/ui/AppLayout'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://kalkios.com'),
  title: { template: '%s | KALKI OS', default: 'KALKI OS — Temple of Technology' },
  description: 'Premium AI-powered digital services marketplace.',
  icons: { icon: '/favicon.svg', shortcut: '/favicon.ico' },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-black font-sans antialiased', inter.className)} suppressHydrationWarning>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
