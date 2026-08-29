'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface SplashScreenProps {
  children: React.ReactNode
}

export function SplashScreen({ children }: SplashScreenProps) {
  const [showSplash, setShowSplash] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const timer = setTimeout(() => {
      setShowSplash(false)
    }, 3000) // Show for 3 seconds, then fade out
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) {
    return children
  }

  return (
    <>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black text-white"
          >
            <div className="text-center px-6 max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2 }}
              >
                <p className="text-2xl md:text-4xl font-light tracking-[0.3em] text-cyan-400/60 font-mono">
                  WELCOME TO
                </p>
                <h1 className="text-4xl md:text-7xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono mt-4">
                  TEMPLE OF TECHNOLOGY
                </h1>
                <p className="text-xl md:text-3xl font-light text-white/70 mt-6 tracking-widest">
                  KALKI INTELLIGENCE
                </p>
                <div className="mt-8 flex justify-center gap-2">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                  <span className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <span className="w-2 h-2 bg-pink-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!showSplash && children}
    </>
  )
}
