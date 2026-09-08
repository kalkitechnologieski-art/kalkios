import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/ui/AppLayout";
import { GlobalLoader } from "@/components/ui/GlobalLoader";
import { Toaster } from "sonner";
import "@/styles/globals.css";

// ─── Fonts with preload optimization ────────────────────────────────────
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  preload: true,
  fallback: ["system-ui", "Helvetica Neue", "Arial", "sans-serif"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
  preload: false,
  fallback: ["monospace", "Courier New", "Consolas"],
});

// ─── Metadata ────────────────────────────────────────────────────────────
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://kalkios.com"),
  title: {
    template: "%s | KALKI OS",
    default: "KALKI OS — Temple of Technology",
  },
  description:
    "Enterprise-grade AI concierge, digital marketplace & lead generation platform for Indian enterprises.",
  keywords: [
    "AI",
    "enterprise",
    "digital services",
    "marketplace",
    "lead generation",
    "India",
    "Indore",
    "Siddhi",
  ],
  authors: [{ name: "KALKI Intelligence", url: "https://kalki-intelligence.in" }],
  creator: "KALKI Intelligence",
  publisher: "KALKI Intelligence",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "KALKI OS — Temple of Technology",
    description: "AI-powered digital services & enterprise solutions.",
    url: "https://kalkios.com",
    siteName: "KALKI OS",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "KALKI OS — Temple of Technology",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KALKI OS — Temple of Technology",
    description: "AI-powered digital services & enterprise solutions.",
    images: ["/images/og-image.jpg"],
    creator: "@kalki_intel",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "mask-icon",
        url: "/safari-pinned-tab.svg",
        color: "#00ffff",
      },
    ],
  },
  manifest: "/site.webmanifest",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || "",
  },
  category: "technology",
};

// ─── Viewport ────────────────────────────────────────────────────────────
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: "#000000",
  colorScheme: "dark",
};

// ─── Root Layout ────────────────────────────────────────────────────────
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={cn(
        "dark h-full scroll-smooth",
        inter.variable,
        mono.variable
      )}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://api.supabase.com" />
        <link rel="dns-prefetch" href="https://apihub.agnes-ai.com" />
        <link
          rel="preload"
          href="/images/logo.svg"
          as="image"
          type="image/svg+xml"
          fetchPriority="high"
        />
        <link
          rel="preload"
          href="/fonts/inter-latin-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <meta
          httpEquiv="Content-Security-Policy"
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https: wss:; media-src 'self' https: data:; frame-src 'self' https:;"
        />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
      </head>

      <body
        className={cn(
          "min-h-screen-safe bg-black font-sans antialiased",
          "safe-area-padding safe-area-padding-top",
          "selection:bg-cyan-500/30 selection:text-white",
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10",
          "transition-colors duration-300"
        )}
        suppressHydrationWarning
      >
        <GlobalLoader />
        <Toaster
          position="bottom-right"
          toastOptions={{
            className: "glass-strong border-cyan-500/20 text-white",
            duration: 4000,
            style: {
              background: "rgba(0, 0, 0, 0.92)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(0, 255, 255, 0.15)",
              boxShadow: "0 0 40px rgba(0, 255, 255, 0.05)",
              color: "#fff",
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
              "radial-gradient(circle at 20% 20%, rgba(0,255,255,0.05), transparent 40%), radial-gradient(circle at 80% 80%, rgba(139,92,246,0.03), transparent 50%)",
          }}
        />

        {process.env.NODE_ENV === "development" && (
          <div
            className="pointer-events-none fixed inset-0 z-50 opacity-5"
            style={{
              backgroundImage: `
                linear-gradient(rgba(0,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "20px 20px",
            }}
          />
        )}
      </body>
    </html>
  );
}
