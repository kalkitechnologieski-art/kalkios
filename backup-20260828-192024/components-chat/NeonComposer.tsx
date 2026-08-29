'use client'

import { useState, useRef } from 'react'
import {
  Send,
  Sparkles,
  Image as ImageIcon,
  Video,
  Upload,
  X,
  Mic,
  Paperclip,
  Zap,
  Loader2
} from 'lucide-react'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { QuantumButton } from '@/components/ui/QuantumButton'
import { SetuButton } from '@/components/ui/SetuButton'
import { motion, AnimatePresence } from 'framer-motion'

type MediaMode = 'text' | 'image' | 'video' | 'audio' | 'file'

interface NeonComposerProps {
  onSend: (text: string, file?: File) => void
  isLoading: boolean
  onModeChange?: (mode: MediaMode) => void
  className?: string
}

export function NeonComposer({
  onSend,
  isLoading,
  onModeChange,
  className = '',
}: NeonComposerProps) {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<MediaMode>('text')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isQuantum, setIsQuantum] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleModeChange = (newMode: MediaMode) => {
    setMode(newMode)
    if (newMode !== 'text') {
      setFile(null)
      setPreviewUrl(null)
    }
    if (onModeChange) onModeChange(newMode)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreviewUrl(URL.createObjectURL(f))
    e.target.value = ''
  }

  const clearFile = () => {
    setFile(null)
    setPreviewUrl(null)
  }

  const handleSend = () => {
    if ((!text.trim() && !file) || isLoading) return
    onSend(text, file || undefined)
    setText('')
    setFile(null)
    setPreviewUrl(null)
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* Mode buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['text', 'image', 'video', 'audio', 'file'] as MediaMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`
              px-3 py-1.5 rounded-lg text-xs font-mono transition-all
              ${mode === m
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'bg-white/5 text-white/40 hover:text-white/70 hover:bg-white/10'
              }
            `}
          >
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
        <QuantumButton
          active={isQuantum}
          onToggle={() => setIsQuantum(!isQuantum)}
          label="⚛️ Quantum"
        />
        <SetuButton onClick={() => alert('SETU mode activated')} isActive={false} />
      </div>

      {/* File preview */}
      <AnimatePresence>
        {file && previewUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3 backdrop-blur-sm"
          >
            {mode === 'image' && (
              <img src={previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
            )}
            {mode === 'video' && (
              <video src={previewUrl} className="w-12 h-12 object-cover rounded-lg" muted />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{file.name}</p>
              <p className="text-xs text-white/30">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button
              onClick={clearFile}
              className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-2 focus-within:border-cyan-500/30 transition">
        {mode !== 'text' && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition"
          >
            <Upload className="w-4 h-4" />
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={mode === 'image' ? 'image/*' : mode === 'video' ? 'video/*' : mode === 'audio' ? 'audio/*' : '*'}
          onChange={handleFileUpload}
          className="hidden"
        />

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={mode === 'text' ? 'Type your message...' : `Describe your ${mode}...`}
          className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm px-2 min-h-[40px]"
          disabled={isLoading}
        />

        <LuxuryButton
          variant="primary"
          size="sm"
          onClick={handleSend}
          disabled={(!text.trim() && !file) || isLoading}
          className="min-w-[80px]"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
        </LuxuryButton>
      </div>
    </div>
  )
}
