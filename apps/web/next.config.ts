import type { NextConfig } from 'next'

const config: NextConfig = {
  cacheComponents: true,
  turbopack: {}, // empty config to silence warnings
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'supabase.co', pathname: '/storage/v1/object/public/**' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  typescript: { ignoreBuildErrors: false },
  webpack: (config) => {
    config.externals.push('bufferutil', 'utf-8-validate')
    return config
  },
}
export default config
