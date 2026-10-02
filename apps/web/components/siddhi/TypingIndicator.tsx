'use client';

import { motion } from 'framer-motion';
import { Brain, Sparkles } from 'lucide-react';

interface TypingIndicatorProps {
  provider?: string;
  stage?: 'thinking' | 'reasoning' | 'generating' | 'finalizing';
}

export function TypingIndicator({ provider = 'Siddhi', stage = 'thinking' }: TypingIndicatorProps) {
  const stageMessages = {
    thinking: 'Analyzing your request...',
    reasoning: 'Building response...',
    generating: 'Crafting answer...',
    finalizing: 'Polishing response...',
  };

  return (
    <div className="flex items-start gap-3 p-4">
      {/* Avatar */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0"
      >
        <Brain className="w-4 h-4 text-white" />
      </motion.div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="glass rounded-xl rounded-tl-none px-4 py-3 inline-block">
          {/* Stage label */}
          <p className="text-white/60 text-xs font-medium mb-2">{stageMessages[stage]}</p>

          {/* Animated dots */}
          <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.3, y: 0 }}
                animate={{
                  opacity: [0.3, 1, 0.3],
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeInOut',
                }}
                className="w-2 h-2 rounded-full bg-cyan-400"
              />
            ))}
          </div>
        </div>

        {/* Provider badge */}
        {provider && (
          <div className="flex items-center gap-1 mt-2 ml-1">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span className="text-white/30 text-[10px] font-mono">{provider}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Streaming text cursor animation for real-time token display
 */
export function StreamingCursor() {
  return (
    <motion.span
      animate={{ opacity: [1, 0] }}
      transition={{ duration: 0.8, repeat: Infinity, ease: 'steps(1)' }}
      className="inline-block w-0.5 h-4 bg-cyan-400 ml-0.5 align-middle"
    />
  );
}

/**
 * Thought bubble for reasoning traces
 */
export function ThoughtBubble({ children, expanded = false }: { children: React.ReactNode; expanded?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="my-2 border-l-2 border-cyan-500/30 pl-3"
    >
      <div className="text-xs text-white/50 font-mono leading-relaxed">
        {children}
      </div>
    </motion.div>
  );
}
