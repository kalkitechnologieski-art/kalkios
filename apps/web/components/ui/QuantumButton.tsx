'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface QuantumButtonProps {
  active: boolean
  onToggle: () => void
  label: string | ReactNode
  className?: string
}

export function QuantumButton({ active, onToggle, label, className = '' }: QuantumButtonProps) {
  return (
    <motion.button
      onClick={onToggle}
      className={`
        relative px-4 py-2 rounded-xl font-mono text-sm font-bold
        transition-all duration-300
        ${active ? 'text-black' : 'text-white/60 hover:text-white'}
        ${className}
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="absolute inset-0 rounded-xl"
        animate={{
          background: active
            ? 'linear-gradient(90deg, #00ffff, #8b5cf6, #ff0066, #00ffff)'
            : 'rgba(255,255,255,0.05)',
          backgroundSize: active ? '300% 100%' : '100% 100%',
          boxShadow: active
            ? '0 0 40px rgba(0,255,255,0.2), 0 0 80px rgba(139,92,246,0.1)'
            : 'none',
        }}
        transition={{ duration: 0.5 }}
        style={{
          animation: active ? 'shimmer 2s linear infinite' : 'none',
        }}
      />
      <span className="relative z-10">{label}</span>
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
    </motion.button>
  )
}
