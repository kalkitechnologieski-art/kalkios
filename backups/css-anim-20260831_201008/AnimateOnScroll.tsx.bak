'use client'

import { useRef, useEffect, ReactNode } from 'react'

interface AnimateOnScrollProps {
  children: ReactNode
  className?: string
  delay?: number
}

export default function AnimateOnScroll({ children, className = '', delay = 0 }: AnimateOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Apply animation with delay
            setTimeout(() => {
              el.classList.add('animate-fade-up')
            }, delay)
            observer.unobserve(el)
          }
        })
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`opacity-0 translate-y-8 transition-all duration-700 ${className}`}
    >
      {children}
    </div>
  )
}
