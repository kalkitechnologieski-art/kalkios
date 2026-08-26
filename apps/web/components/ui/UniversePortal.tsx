'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ChoiceCard } from './ChoiceCard'

export function UniversePortal() {
  const [showChoices, setShowChoices] = useState(false)
  const [activeScene, setActiveScene] = useState(0)
  const scenes = [
    { bg: 'bg-gradient-to-br from-blue-900/40 to-purple-900/40', icon: '📢', label: 'Marketing' },
    { bg: 'bg-gradient-to-br from-purple-900/40 to-pink-900/40', icon: '🤖', label: 'AI & Automation' },
    { bg: 'bg-gradient-to-br from-green-900/40 to-blue-900/40', icon: '💻', label: 'Development' },
  ] as const

  useEffect(() => {
    const interval = setInterval(() => setActiveScene((p) => (p + 1) % 3), 3000)
    const timer = setTimeout(() => setShowChoices(true), 8000)
    return () => { clearInterval(interval); clearTimeout(timer) }
  }, [])

  const currentScene = scenes[activeScene]!

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] relative">
      <motion.div
        className={`absolute inset-0 rounded-3xl ${currentScene.bg} transition-all duration-1000`}
        animate={{ opacity: showChoices ? 0.3 : 1 }}
      />
      <motion.h1
        className="text-5xl font-bold text-center bg-gradient-to-r from-white to-purple-400 bg-clip-text text-transparent z-10"
        animate={{ opacity: showChoices ? 0 : 1, y: showChoices ? -20 : 0 }}
      >
        The Future of Digital Excellence
      </motion.h1>
      {showChoices && (
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4 mt-8 z-10 flex-wrap justify-center">
          <ChoiceCard href="/services/marketing" icon="📢" title="Marketing" desc="Make my brand famous" />
          <ChoiceCard href="/services/ai" icon="🤖" title="AI & Automation" desc="Make my business intelligent" />
          <ChoiceCard href="/services/development" icon="💻" title="Development" desc="Build my app" />
        </motion.div>
      )}
      <p className="text-white/30 text-sm mt-6 z-10">Tap a card to begin your journey</p>
    </div>
  )
}
