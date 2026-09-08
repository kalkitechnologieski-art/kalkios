'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, ChevronDown, ChevronRight, Zap,
  Loader2, CheckCircle, Clock, AlertCircle,
  BarChart3, TrendingUp, Activity, Cpu
} from 'lucide-react'

export interface ThinkingStep {
  id: string
  type: 'reasoning' | 'analysis' | 'generation' | 'verification'
  title: string
  description: string
  status: 'pending' | 'active' | 'complete' | 'error'
  duration?: number
  confidence?: number
  tokens?: number
  timestamp: Date
}

interface ThinkingPanelProps {
  steps: ThinkingStep[]
  isExpanded: boolean
  onToggle: () => void
  isActive: boolean
  totalTokens?: number
}

const STEP_ICONS = {
  reasoning: Brain,
  analysis: BarChart3,
  generation: Zap,
  verification: CheckCircle,
}

const STEP_COLORS = {
  reasoning: 'text-purple-400 border-purple-500/20',
  analysis: 'text-blue-400 border-blue-500/20',
  generation: 'text-cyan-400 border-cyan-500/20',
  verification: 'text-green-400 border-green-500/20',
}

const STATUS_ICONS = {
  pending: Clock,
  active: Loader2,
  complete: CheckCircle,
  error: AlertCircle,
}

const STATUS_COLORS = {
  pending: 'text-cyan-400/30',
  active: 'text-cyan-400 animate-pulse',
  complete: 'text-green-400',
  error: 'text-red-400',
}

export function ThinkingPanel({
  steps,
  isExpanded,
  onToggle,
  isActive,
  totalTokens = 0,
}: ThinkingPanelProps) {
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set())

  useEffect(() => {
    const activeStep = steps.find(s => s.status === 'active')
    if (activeStep) {
      setExpandedSteps(prev => new Set([...prev, activeStep.id]))
    }
  }, [steps])

  const toggleStep = (id: string) => {
    setExpandedSteps(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const completedSteps = steps.filter(s => s.status === 'complete').length
  const totalSteps = steps.length
  const progress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

  return (
    <div className={`
      relative bg-black/40 backdrop-blur-xl border border-cyan-500/10 rounded-2xl
      transition-all duration-500 overflow-hidden
      ${isExpanded ? 'max-h-[600px]' : 'max-h-[48px]'}
    `}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-5 h-5 text-cyan-400" />
            {isActive && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full animate-ping" />
            )}
          </div>
          <span className="text-white font-mono text-sm tracking-wider">
            THINKING
          </span>
          <div className="flex items-center gap-2 text-xs text-cyan-400/30 font-mono">
            <span>{completedSteps}/{totalSteps} steps</span>
            <span className="text-cyan-400/10">|</span>
            <span>{totalTokens} tokens</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <span className="text-cyan-400/40 text-xs font-mono">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </span>
        </div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-3 pt-0 space-y-2 overflow-y-auto max-h-[500px]"
          >
            {steps.map((step) => {
              const Icon = STEP_ICONS[step.type]
              const StatusIcon = STATUS_ICONS[step.status]
              const isExpanded = expandedSteps.has(step.id)
              const colorClass = STEP_COLORS[step.type]
              const statusColor = STATUS_COLORS[step.status]

              return (
                <div
                  key={step.id}
                  className={`
                    border rounded-xl p-3 transition-all duration-300
                    ${colorClass} ${step.status === 'active' ? 'bg-white/5' : 'bg-white/2'}
                  `}
                >
                  <button
                    onClick={() => toggleStep(step.id)}
                    className="w-full flex items-start gap-3 text-left"
                  >
                    <div className="mt-0.5">
                      <Icon className={`w-4 h-4 ${step.status === 'active' ? 'text-cyan-400' : 'text-current'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-mono">
                          {step.title}
                        </span>
                        <span className={`text-[10px] font-mono ${statusColor}`}>
                          {step.status.toUpperCase()}
                        </span>
                      </div>
                      {isExpanded && step.description && (
                        <p className="text-cyan-400/40 text-xs font-mono mt-1">
                          {step.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-cyan-400/20 font-mono">
                        {step.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {step.duration}ms
                          </span>
                        )}
                        {step.confidence && (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {Math.round(step.confidence * 100)}% confidence
                          </span>
                        )}
                        {step.tokens && (
                          <span className="flex items-center gap-1">
                            <Cpu className="w-3 h-3" />
                            {step.tokens} tokens
                          </span>
                        )}
                      </div>
                    </div>
                    <StatusIcon className={`w-4 h-4 flex-shrink-0 ${statusColor}`} />
                  </button>

                  {isExpanded && step.status === 'active' && (
                    <div className="mt-2 ml-7 p-2 bg-cyan-500/5 rounded-lg border border-cyan-500/10">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[...Array(3)].map((_, i) => (
                            <span
                              key={i}
                              className="w-1 h-1 bg-cyan-400 rounded-full animate-bounce"
                              style={{ animationDelay: `${i * 150}ms` }}
                            />
                          ))}
                        </div>
                        <span className="text-cyan-400/40 text-xs font-mono animate-pulse">
                          processing...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}

            {isActive && steps.length > 0 && (
              <div className="flex items-center justify-center gap-2 py-2">
                <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-cyan-400/20 text-xs font-mono">
                  Quantum processing • {steps.filter(s => s.status === 'complete').length}/{steps.length} steps complete
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
