'use client'

import { useEffect } from 'react'

const IGNORED_ERRORS = [
  'removeChild',
  'NotFoundError',
  'The node to be removed is not a child of this node',
  'Failed to execute \'removeChild\' on \'Node\'',
]

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    const message = error.message || ''
    const shouldIgnore = IGNORED_ERRORS.some((pattern) => message.includes(pattern))

    if (shouldIgnore) {
      if (process.env.NODE_ENV === 'development') {
        console.debug('[Silenced] GlobalError suppressed:', message)
      }
      reset()
      return
    }

    console.error('Unhandled error:', error)
  }, [error, reset])

  // Always return null – never show an error UI
  return null
}
