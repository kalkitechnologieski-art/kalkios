'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, ChevronDown, Brain, Sparkles } from 'lucide-react'
import { useState } from 'react'

export function ThinkingTrace({ reasoning, tokens, timeMs, status, className = '' }: {
  reasoning: string; tokens: number; timeMs: number; status: 'thinking' | 'done' | 'idle'; className?: string
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const toggle = () => setIsExpanded(!isExpanded)

  return (
    <motion.div className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm ${className}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <button onClick={toggle} className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-white/60 font-mono">Reasoning</span>
          {status === 'thinking' && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
          {status === 'done' && <Sparkles className="w-3 h-3 text-green-400" />}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono">
          {status !== 'idle' && (<><span>{tokens} tokens</span><span>{timeMs}ms</span></>)}
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </button>
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-3 pt-0 text-xs text-white/50 font-mono whitespace-pre-wrap border-t border-white/5">{reasoning || 'No reasoning available.'}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
