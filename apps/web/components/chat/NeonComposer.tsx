'use client'

import { useState, useRef } from 'react'
import { ImageIcon, Video, Search, Brain, X, Loader2, Paperclip } from 'lucide-react'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { motion, AnimatePresence } from 'framer-motion'
import { CosmicPromptBar } from '@/components/ui/CosmicPromptBar'
import { ModeToggleButton } from '@/components/ui/ModeToggleButton'

interface NeonComposerProps {
  onSend: (text: string, file?: File) => void
  isLoading: boolean
  mode: 'chat' | 'image' | 'video'
  onModeChange: (mode: 'chat' | 'image' | 'video') => void
  isDeepThink: boolean
  setIsDeepThink: (val: boolean) => void
  isSetuMode: boolean
  setIsSetuMode: (val: boolean) => void
  isSearchMode: boolean
  setIsSearchMode: (val: boolean) => void
  onClear?: () => void
  className?: string
}

export function NeonComposer({
  onSend,
  isLoading,
  mode,
  onModeChange,
  isDeepThink,
  setIsDeepThink,
  isSetuMode,
  setIsSetuMode,
  isSearchMode,
  setIsSearchMode,
  onClear,
  className = '',
}: NeonComposerProps) {
  const [text, setText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleSend = (textToSend: string) => {
    if ((!textToSend.trim() && !file) || isLoading) return
    onSend(textToSend, file || undefined)
    setText('')
    setFile(null)
    setPreviewUrl(null)
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Mode toggle row with Uiverse buttons */}
      <div className="flex flex-wrap items-center gap-3 px-1">
        {/* DeepThink button */}
        <ModeToggleButton
          active={isDeepThink}
          onToggle={() => setIsDeepThink(!isDeepThink)}
          label="DeepThink"
          tooltip="Enable deep reasoning with expanded thinking traces. Uses Zhipu's advanced reasoning model for complex analysis."
          colorScheme="gold"
        />

        {/* SETU button */}
        <ModeToggleButton
          active={isSetuMode}
          onToggle={() => setIsSetuMode(!isSetuMode)}
          label="SETU"
          tooltip="Activate lead generation mode. Siddhi will search the web and extract contact information for your target prospects."
          colorScheme="red"
        />

        {/* Divider */}
        <div className="h-6 w-px bg-white/10 hidden sm:block" />

        {/* Other mode toggles (small icons) */}
        <button
          onClick={() => setIsSearchMode(!isSearchMode)}
          className={`p-1.5 rounded-lg transition-all duration-200 ${isSearchMode ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30 shadow-glow' : 'text-white/40 hover:text-white/70'}`}
          title="Web Search"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={() => onModeChange(mode === 'image' ? 'chat' : 'image')}
          className={`p-1.5 rounded-lg transition-all duration-200 ${mode === 'image' ? 'bg-pink-600/30 text-pink-400 border border-pink-500/30 shadow-glow' : 'text-white/40 hover:text-white/70'}`}
          title="Image Mode"
        >
          <ImageIcon className="w-4 h-4" />
        </button>

        <button
          onClick={() => onModeChange(mode === 'video' ? 'chat' : 'video')}
          className={`p-1.5 rounded-lg transition-all duration-200 ${mode === 'video' ? 'bg-red-600/30 text-red-400 border border-red-500/30 shadow-glow' : 'text-white/40 hover:text-white/70'}`}
          title="Video Mode"
        >
          <Video className="w-4 h-4" />
        </button>

        <div className="flex-1" />

        {onClear && (
          <button onClick={onClear} className="text-red-400/60 hover:text-red-400 transition text-xs font-mono px-2 py-1">
            ✕ Clear
          </button>
        )}
      </div>

      {/* File preview */}
      <AnimatePresence>
        {file && previewUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-3 flex items-center gap-3"
          >
            {file.type.startsWith('image/') && (
              <img src={previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />
            )}
            {file.type.startsWith('video/') && (
              <video src={previewUrl} className="w-12 h-12 object-cover rounded-lg" muted />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{file.name}</p>
              <p className="text-xs text-white/30">{(file.size / 1024).toFixed(0)} KB</p>
            </div>
            <button onClick={clearFile} className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt bar */}
      <CosmicPromptBar
        onSend={handleSend}
        isLoading={isLoading}
        placeholder={mode === 'image' ? 'Describe the image...' : mode === 'video' ? 'Describe the video...' : 'Ask Siddhi anything...'}
        mode={mode}
      />
    </div>
  )
}
