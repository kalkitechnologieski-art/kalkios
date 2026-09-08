'use client'

import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

interface SetuButtonProps {
  onClick: () => void
  isActive?: boolean
  className?: string
}

export function SetuButton({ onClick, isActive = false, className = '' }: SetuButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative px-5 py-2.5 rounded-xl font-mono text-sm font-bold
        flex items-center gap-2 transition-all duration-300
        ${isActive ? 'text-black' : 'text-white/60 hover:text-white'}
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{
          background: isActive
            ? 'linear-gradient(135deg, #00ffff, #8b5cf6, #ff0066)'
            : 'rgba(255,255,255,0.05)',
          boxShadow: isActive
            ? '0 0 40px rgba(0,255,255,0.2)'
            : 'none',
        }}
        transition={{ duration: 0.4 }}
      />
      <Zap className="w-4 h-4 relative z-10" />
      <span className="relative z-10">SETU</span>
    </motion.button>
  )
}
