'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function NotFound() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="text-white/40 text-center py-20">Loading...</div>
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-xl font-bold text-white">Page not found</h2>
      <p className="text-white/50 text-sm mt-2">The page you are looking for does not exist.</p>
      <Link href="/" className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-full text-white text-sm font-medium transition">
        Go home
      </Link>
    </div>
  )
}
