'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export function GSAPCleanupProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // On route change, kill all ScrollTriggers to prevent removeChild errors
    // This is the most reliable fix for GSAP + Next.js routing issues
    ScrollTrigger.getAll().forEach(st => st.kill())
  }, [pathname])

  return <>{children}</>
}
