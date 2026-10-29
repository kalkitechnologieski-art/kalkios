'use client'
import { useEffect, useRef } from 'react'
import { motion, useInView, useAnimation, useReducedMotion } from 'framer-motion'

interface ScrollRevealProps {
  children: React.ReactNode
  direction?: 'up' | 'down' | 'left' | 'right'
  delay?: number
  duration?: number
  className?: string
}

export function ScrollReveal({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.6,
  className,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const controls = useAnimation()
  const reduce = useReducedMotion()

  const directions = {
    up: { y: 60, x: 0 },
    down: { y: -60, x: 0 },
    left: { x: 60, y: 0 },
    right: { x: -60, y: 0 },
  }

  useEffect(() => {
    if (isInView && !reduce) {
      controls.start({
        opacity: 1,
        y: 0,
        x: 0,
        transition: { duration, delay, ease: 'easeOut' },
      })
    }
  }, [isInView, controls, duration, delay, reduce])

  if (reduce) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...directions[direction] }}
      animate={controls}
      className={className}
    >
      {children}
    </motion.div>
  )
}
