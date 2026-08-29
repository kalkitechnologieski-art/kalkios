'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ChevronDown, Brain, Sparkles } from 'lucide-react'
import { useState } from 'react'

interface ThinkingTraceProps {
  reasoning: string
  tokens: number
  timeMs: number
  status: 'thinking' | 'done' | 'idle'
  className?: string
}

export function ThinkingTrace({ reasoning, tokens, timeMs, status, className = '' }: ThinkingTraceProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const toggle = () => setIsExpanded(!isExpanded)

  return (
    <motion.div
      className={`
        bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm
        ${className}
      `}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-white/60 font-mono">Reasoning</span>
          {status === 'thinking' && (
            <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
          )}
          {status === 'done' && (
            <span className="text-[10px] text-green-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Done
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono">
          {status !== 'idle' && (
            <>
              <span>{tokens} tokens</span>
              <span>{timeMs}ms</span>
            </>
          )}
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 text-xs text-white/50 font-mono whitespace-pre-wrap border-t border-white/5">
              {reasoning || 'No reasoning provided.'}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
