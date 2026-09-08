'use client'

import { useEffect, ReactNode } from 'react'

export function GlobalErrorHandler({ children }: { children: ReactNode }) {
  useEffect(() => {
    const suppressError = (event: ErrorEvent | PromiseRejectionEvent): boolean => {
      let message = ''

      if (event instanceof ErrorEvent) {
        message = event.message || ''
      } else if (event instanceof PromiseRejectionEvent) {
        message = event.reason?.message || ''
      }

      const isRemoveChildError = message.includes('removeChild') ||
                                 message.includes('NotFoundError') ||
                                 message.includes('The node to be removed is not a child of this node')

      if (isRemoveChildError) {
        event.preventDefault()
        event.stopPropagation()
        if (process.env.NODE_ENV === 'development') {
          console.debug('[Silenced] removeChild error suppressed')
        }
        return true
      }
      return false
    }

    window.addEventListener('error', (e) => suppressError(e), { capture: true })
    window.addEventListener('unhandledrejection', (e) => suppressError(e), { capture: true })

    return () => {
      window.removeEventListener('error', (e) => suppressError(e), { capture: true })
      window.removeEventListener('unhandledrejection', (e) => suppressError(e), { capture: true })
    }
  }, [])

  return <>{children}</>
}
