import type { NextConfig } from 'next'

const config: NextConfig = {
  cacheComponents: false,
  turbopack: {},
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
  },
  typescript: { ignoreBuildErrors: false },
  output: 'standalone',
}

export default config
