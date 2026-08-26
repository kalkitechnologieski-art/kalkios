'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error.message, error.digest)
    logger.error('Global error:', error.message, error.digest)
  }, [error])

  return (
    <html>
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0F] text-white p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
            <span className="text-3xl">🚨</span>
          </div>
          <h1 className="text-2xl font-bold font-mono text-cyan-400">
            System Anomaly
          </h1>
          <p className="text-white/50 text-sm mt-2 max-w-md">
            {error.message || 'The application encountered a critical error.'}
          </p>
          <div className="mt-6 flex gap-3">
            <button
              onClick={reset}
              className="px-6 py-2 bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 rounded-full text-white text-sm font-medium transition shadow-[0_0_20px_rgba(0,255,255,0.2)]"
            >
              Reload
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 text-sm font-medium transition"
            >
              Refresh Page
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
