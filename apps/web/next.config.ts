// ═══ SIDDHI v4.0 BATCH 1 ═══
// Turbopack-safe config: image patterns, no node:async_hooks leak,
// server-external packages explicitly listed.
// ─────────────────────────────────────────────────────────────────────────────

import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'apihub.agnes-ai.com' },
      { protocol: 'https', hostname: '**.agnes-ai.com' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96],
    formats: ['image/webp'],
    minimumCacheTTL: 60,
  },
  typescript: { ignoreBuildErrors: false },
  output: 'standalone',
  // Node-only packages that should never be bundled for the client.
  // Turbopack respects this for the client graph.
  serverExternalPackages: ['node:async_hooks'],
  // Belt-and-suspenders: ensure Turbopack does not try to resolve
  // `node:async_hooks` for the browser graph.
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve = config.resolve ?? {};
      config.resolve.fallback = {
        ...(config.resolve.fallback ?? {}),
        'node:async_hooks': false,
        async_hooks: false,
      };
    }
    return config;
  },
};

export default config;
