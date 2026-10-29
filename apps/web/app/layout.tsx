// == KALKI B5 LAUNCH ==
// Root layout. Injects Organization + LocalBusiness JSON-LD.
// -----------------------------------------------------------------------------

import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/ui/AppLayout';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { Toaster } from 'sonner';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { organizationSchema, localBusinessSchema } from '@/lib/seo/schema';
import { buildRootMetadata } from '@/lib/seo/metadata';
import '@/styles/globals.css';

// Applies the stored theme before first paint so a dark-mode visitor never
// sees a bright flash. Defaults to the light theme when nothing is stored.
const THEME_BOOTSTRAP_SCRIPT = `try{if(localStorage.getItem('kalki-theme')==='dark'){document.documentElement.classList.add('dark')}}catch(e){}`;

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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F2F6FB' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  colorScheme: 'light dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn('h-full scroll-smooth', inter.variable, mono.variable)}
      suppressHydrationWarning
    >
      <head>
        <script
          // Runs before paint so a dark-mode visitor never sees a bright flash.
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }}
        />
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
          'min-h-screen-safe bg-background text-foreground font-sans antialiased',
          'safe-area-padding safe-area-padding-top',
          'selection:bg-cyan-500/30 selection:text-white',
          'scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10',
          'transition-colors duration-300'
        )}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <GlobalLoader />
          <Toaster
            position="bottom-right"
            toastOptions={{
              className: 'border-white/10',
              duration: 4000,
              style: {
                background: 'var(--kalki-chrome)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                border: '1px solid var(--kalki-hairline-strong)',
                color: 'var(--color-foreground)',
                boxShadow: '0 18px 48px -20px var(--kalki-shadow-strong)',
              },
            }}
            closeButton
            richColors
          />
          <AppLayout>{children}</AppLayout>

          <div className="kalki-ambient pointer-events-none fixed inset-0 z-0" />
        </ThemeProvider>
      </body>
    </html>
  );
}
