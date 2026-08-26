'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

interface ErrorPageProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    logger.error('Route-level error:', error.message, error.digest)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center">
      <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-4">
        <span className="text-3xl">⚠️</span>
      </div>
      <h2 className="text-xl font-bold text-white">Something went wrong</h2>
      <p className="text-white/50 text-sm mt-2 max-w-md">
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        onClick={reset}
        className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white text-sm font-medium transition"
      >
        Try again
      </button>
    </div>
  )
}
