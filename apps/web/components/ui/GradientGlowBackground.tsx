'use client'

import { motion } from 'framer-motion'

interface GradientGlowBackgroundProps {
  isThinking?: boolean
  className?: string
}

export function GradientGlowBackground({ isThinking = false, className = '' }: GradientGlowBackgroundProps) {
  return (
    <div className={`fixed inset-0 -z-10 overflow-hidden ${className}`}>
      <motion.div
        className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-3xl"
        animate={{
          background: isThinking
            ? 'radial-gradient(circle, rgba(0,255,255,0.15) 0%, rgba(139,92,246,0.10) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(0,255,255,0.05) 0%, rgba(139,92,246,0.03) 50%, transparent 70%)',
        }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-3xl"
        animate={{
          background: isThinking
            ? 'radial-gradient(circle, rgba(255,0,102,0.12) 0%, rgba(139,92,246,0.08) 50%, transparent 70%)'
            : 'radial-gradient(circle, rgba(255,0,102,0.04) 0%, rgba(139,92,246,0.02) 50%, transparent 70%)',
        }}
        transition={{ duration: 1.5, ease: 'easeInOut', delay: 0.3 }}
      />
    </div>
  )
}
