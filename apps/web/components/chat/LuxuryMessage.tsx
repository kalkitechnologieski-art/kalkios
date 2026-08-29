'use client'

import { motion } from 'framer-motion'
import { useState, ReactNode } from 'react'
import { Copy, Pencil, RotateCcw, ThumbsUp, ThumbsDown, Share2, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LuxuryMessageProps {
  children: ReactNode
  role: 'user' | 'assistant'
  timestamp?: Date
  className?: string
  isStreaming?: boolean
  onCopy?: () => void
  onEdit?: () => void
  onRegenerate?: () => void
  onLike?: () => void
  onDislike?: () => void
  onShare?: () => void
  showActions?: boolean
}

export function LuxuryMessage({
  children,
  role,
  timestamp,
  className = '',
  isStreaming = false,
  onCopy,
  onEdit,
  onRegenerate,
  onLike,
  onDislike,
  onShare,
  showActions = true,
}: LuxuryMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (onCopy) {
      onCopy()
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // User: Copy + Edit; Assistant: Copy + Like + Dislike + Regenerate
  const showEdit = role === 'user' && onEdit
  const showRegenerate = role === 'assistant' && onRegenerate
  const showLike = role === 'assistant' && onLike
  const showDislike = role === 'assistant' && onDislike

  return (
    <motion.div
      className={cn(
        `max-w-[85%] rounded-2xl px-4 py-3 relative`,
        role === 'user'
          ? 'ml-auto bg-gradient-to-r from-cyan-600/20 to-purple-600/20 border border-cyan-500/20 text-white shadow-[0_0_30px_rgba(0,255,255,0.05)]'
          : 'bg-white/5 border border-white/10 text-white/90 backdrop-blur-sm',
        isStreaming && 'border-cyan-500/40',
        className
      )}
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
    >
      {children}
      {timestamp && (
        <div className="text-[10px] text-white/30 mt-1 text-right">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}

      {showActions && !isStreaming && (
        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/5 justify-end">
          {onCopy && (
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition group"
              title="Copy"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          )}
          {showEdit && (
            <button
              onClick={onEdit}
              className="p-1 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition"
              title="Edit Prompt"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
          {showRegenerate && (
            <button
              onClick={onRegenerate}
              className="p-1 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition"
              title="Regenerate"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {showLike && (
            <button
              onClick={onLike}
              className="p-1 rounded hover:bg-white/5 text-white/30 hover:text-green-400 transition"
              title="Like"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
          )}
          {showDislike && (
            <button
              onClick={onDislike}
              className="p-1 rounded hover:bg-white/5 text-white/30 hover:text-red-400 transition"
              title="Dislike"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          )}
          {onShare && (
            <button
              onClick={onShare}
              className="p-1 rounded hover:bg-white/5 text-white/30 hover:text-white/60 transition"
              title="Share"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </motion.div>
  )
}
