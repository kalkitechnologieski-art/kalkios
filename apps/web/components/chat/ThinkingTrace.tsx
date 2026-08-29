'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Sparkles, Zap, Clock, Cpu } from 'lucide-react'

interface ThinkingTraceProps {
  reasoning: string
  tokens?: number
  timeMs?: number
  status: 'thinking' | 'done' | 'idle'
  steps?: string[]
  provider?: string
  className?: string
}

export function ThinkingTrace({
  reasoning,
  tokens,
  timeMs,
  status,
  steps = [],
  provider,
  className = '',
}: ThinkingTraceProps) {
  const [expanded, setExpanded] = useState(false)

  const toggle = () => setExpanded(!expanded)

  const displaySteps = steps.length > 0 ? steps : reasoning.split('\n').filter(s => s.trim().length > 10)

  const providerColors: Record<string, string> = {
    zhipu: 'text-purple-400',
    agnes: 'text-cyan-400',
    groq: 'text-green-400',
    openrouter: 'text-blue-400',
    default: 'text-white/40',
  }

  return (
    <div className={`bg-white/5 border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm ${className}`}>
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-xs text-white/60 font-mono">Reasoning</span>
          {provider && (
            <span className={`text-[8px] font-mono ${providerColors[provider] || providerColors.default}`}>
              {provider}
            </span>
          )}
          {status === 'thinking' && (
            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-white/30 font-mono">
          {status !== 'idle' && (
            <>
              {tokens !== undefined && <span>{tokens} tokens</span>}
              {timeMs !== undefined && <span>{timeMs}ms</span>}
            </>
          )}
          {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </div>
      </button>

      {expanded && (
        <div className="p-3 pt-0 border-t border-white/5">
          <div className="mt-2 text-xs text-white/50 font-mono space-y-1 max-h-48 overflow-y-auto">
            {displaySteps.map((step, i) => (
              <div key={i} className="flex items-start gap-2 border-b border-white/5 pb-1">
                <span className="text-cyan-400">●</span>
                <span className="break-words">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
