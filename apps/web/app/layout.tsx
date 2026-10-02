// == KALKI B5 LAUNCH ==
// Root layout. Injects Organization + LocalBusiness JSON-LD.
// -----------------------------------------------------------------------------

import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/ui/AppLayout';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { Toaster } from 'sonner';
import { organizationSchema, localBusinessSchema } from '@/lib/seo/schema';
import { buildRootMetadata } from '@/lib/seo/metadata';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  preload: true,
  fallback: ['system-ui', 'Helvetica Neue', 'Arial', 'sans-serif'],
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-mono',
  preload: false,
  fallback: ['monospace', 'Courier New', 'Consolas'],
});

export const metadata: Metadata = buildRootMetadata();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#000000',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn('dark h-full scroll-smooth', inter.variable, mono.variable)}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.supabase.com" />
        <link rel="dns-prefetch" href="https://apihub.agnes-ai.com" />
        <link
          rel="preload"
          href="/images/logo.svg"
          as="image"
          type="image/svg+xml"
          fetchPriority="high"
        />
        <meta name="referrer" content="strict-origin-when-cross-origin" />

        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema()) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema()) }}
        />
      </head>

      <body
        className={cn(
          'min-h-screen-safe bg-black font-sans antialiased',
          'safe-area-padding safe-area-padding-top',
          'selection:bg-cyan-500/30 selection:text-white',
          'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10',
          'transition-colors duration-300'
        )}
        suppressHydrationWarning
      >
        <GlobalLoader />
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: 'glass-strong border-cyan-500/20 text-white',
            duration: 4000,
            style: {
              background: 'rgba(0, 0, 0, 0.92)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(0, 255, 255, 0.15)',
              color: '#fff',
            },
          }}
          closeButton
          richColors
        />
        <AppLayout>{children}</AppLayout>

        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-10"
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(0,255,255,0.05), transparent 40%), radial-gradient(circle at 80% 80%, rgba(139,92,246,0.03), transparent 50%)',
          }}
        />
      </body>
    </html>
  );
}
