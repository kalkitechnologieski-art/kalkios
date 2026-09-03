'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Send, Mic, Paperclip, Image, Video, Music, X,
  Zap, Sparkles, Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export type MediaType = 'text' | 'image' | 'video' | 'audio' | 'document'

export interface Attachment {
  id: string
  file: File
  type: MediaType
  url: string
  preview?: string | undefined
  name: string
  size: number
}

interface MultimodalInputProps {
  onSend: (text: string, attachments: Attachment[]) => void
  onMediaModeChange: (mode: MediaType) => void
  isLoading: boolean
  isListening: boolean
  onVoiceToggle: () => void
  activeMode: MediaType
  placeholder?: string
  voiceTranscript?: string
  onVoiceTranscriptChange?: (text: string) => void
}

const MEDIA_BUTTONS: { type: MediaType; icon: any; label: string }[] = [
  { type: 'image', icon: Image, label: 'Image' },
  { type: 'video', icon: Video, label: 'Video' },
  { type: 'audio', icon: Music, label: 'Audio' },
  { type: 'document', icon: Paperclip, label: 'Document' },
]

export function MultimodalInput({
  onSend,
  onMediaModeChange,
  isLoading,
  isListening,
  onVoiceToggle,
  activeMode,
  placeholder = '>_ enter command...',
  voiceTranscript = '',
  onVoiceTranscriptChange,
}: MultimodalInputProps) {
  const [text, setText] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Update text when voice transcript changes
  useEffect(() => {
    if (voiceTranscript && isListening) {
      setText(voiceTranscript)
    }
  }, [voiceTranscript, isListening])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [text])

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return
    const newAttachments: Attachment[] = []
    for (const file of files) {
      const type = file.type.startsWith('image/') ? 'image'
        : file.type.startsWith('video/') ? 'video'
        : file.type.startsWith('audio/') ? 'audio'
        : 'document'
      const url = URL.createObjectURL(file)
      newAttachments.push({
        id: crypto.randomUUID(),
        file,
        type,
        url,
        preview: type === 'image' ? url : undefined,
        name: file.name,
        size: file.size,
      })
    }
    setAttachments(prev => [...prev, ...newAttachments])
    if (newAttachments.length > 0) {
      const first = newAttachments[0]
      if (first) {
        // Wrap in setTimeout to avoid setState during render
        setTimeout(() => onMediaModeChange(first.type), 0)
      }
    }
  }, [onMediaModeChange])

  const removeAttachment = useCallback((id: string) => {
    setAttachments(prev => {
      const filtered = prev.filter(a => a.id !== id)
      if (filtered.length === 0) {
        // Wrap in setTimeout to avoid setState during render
        setTimeout(() => onMediaModeChange('text'), 0)
      }
      return filtered
    })
  }, [onMediaModeChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileUpload(e.dataTransfer.files)
  }, [handleFileUpload])

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items
    if (!items) return
    const files: File[] = []
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }
    if (files.length > 0) {
      const dataTransfer = new DataTransfer()
      files.forEach(f => dataTransfer.items.add(f))
      handleFileUpload(dataTransfer.files)
    }
  }, [handleFileUpload])

  const handleSend = useCallback(() => {
    if ((!text.trim() && attachments.length === 0) || isLoading) return
    onSend(text, attachments)
    setText('')
    setAttachments([])
    if (onVoiceTranscriptChange) {
      onVoiceTranscriptChange('')
    }
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, attachments, isLoading, onSend, onVoiceTranscriptChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  const getModeColor = () => {
    switch (activeMode) {
      case 'image': return 'text-pink-400 border-pink-500/30'
      case 'video': return 'text-purple-400 border-purple-500/30'
      case 'audio': return 'text-blue-400 border-blue-500/30'
      case 'document': return 'text-cyan-400 border-cyan-500/30'
      default: return 'text-cyan-400 border-cyan-500/20'
    }
  }

  return (
    <div
      className="relative w-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-cyan-500/10 backdrop-blur-sm border-2 border-dashed border-cyan-400 rounded-2xl flex items-center justify-center"
          >
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-cyan-400 mx-auto mb-2" />
              <p className="text-cyan-400 font-mono text-sm">Drop files here</p>
              <p className="text-cyan-400/40 text-xs font-mono">Images, videos, audio, documents</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`
        relative bg-black/60 backdrop-blur-xl border rounded-2xl
        shadow-[0_0_40px_rgba(0,255,255,0.05)]
        transition-all duration-300
        ${isFocused ? 'border-cyan-500/40 shadow-[0_0_60px_rgba(0,255,255,0.1)]' : 'border-cyan-500/20'}
        ${getModeColor()}
      `}>
        <div className="absolute -top-3 left-4 px-3 py-0.5 bg-black/80 backdrop-blur-sm rounded-full border border-cyan-500/10">
          <span className="text-[8px] text-cyan-400/40 font-mono tracking-widest">
            {activeMode.toUpperCase()} MODE
          </span>
        </div>

        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 pb-0">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="relative group flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg p-2 pr-3"
              >
                {att.type === 'image' && att.preview && (
                  <img
                    src={att.preview}
                    alt={att.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                {att.type === 'video' && (
                  <video
                    src={att.url}
                    className="w-12 h-12 object-cover rounded"
                    muted
                  />
                )}
                {att.type === 'audio' && (
                  <div className="w-12 h-12 bg-cyan-500/10 rounded flex items-center justify-center">
                    <Music className="w-6 h-6 text-cyan-400" />
                  </div>
                )}
                {att.type === 'document' && (
                  <div className="w-12 h-12 bg-purple-500/10 rounded flex items-center justify-center">
                    <Paperclip className="w-6 h-6 text-purple-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-mono truncate max-w-[100px]">
                    {att.name}
                  </p>
                  <p className="text-cyan-400/30 text-[10px] font-mono">
                    {(att.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 rounded-full hover:bg-red-500/20 text-white/40 hover:text-red-400 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-1 p-2">
          <div className="flex items-center gap-0.5 border-r border-cyan-500/10 pr-1">
            {MEDIA_BUTTONS.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => {
                  onMediaModeChange(type)
                  fileInputRef.current?.click()
                }}
                className={`
                  p-1.5 rounded-lg transition-all duration-200 relative group
                  ${activeMode === type
                    ? `bg-${type === 'image' ? 'pink' : type === 'video' ? 'purple' : type === 'audio' ? 'blue' : 'cyan'}-500/20 text-${type === 'image' ? 'pink' : type === 'video' ? 'purple' : type === 'audio' ? 'blue' : 'cyan'}-400`
                    : 'text-cyan-400/30 hover:text-cyan-400/60 hover:bg-white/5'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[8px] text-cyan-400/20 opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                  {label}
                </span>
              </button>
            ))}
          </div>

          <button
            onClick={onVoiceToggle}
            className={`
              p-1.5 rounded-lg transition-all
              ${isListening
                ? 'bg-red-500/20 text-red-400 animate-pulse shadow-[0_0_20px_rgba(255,0,0,0.2)]'
                : 'text-cyan-400/40 hover:text-cyan-400 hover:bg-white/5'
              }
            `}
          >
            <Mic className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onPaste={handlePaste}
            placeholder={isListening ? '🎤 Listening...' : placeholder}
            className="flex-1 bg-transparent text-white placeholder-cyan-400/30 outline-none text-sm font-mono px-2 resize-none min-h-[40px] max-h-[120px] leading-relaxed"
            rows={1}
            disabled={isLoading}
          />

          <button
            onClick={handleSend}
            disabled={(!text.trim() && attachments.length === 0) || isLoading}
            className={`
              p-2 rounded-lg bg-gradient-to-r from-cyan-600 to-purple-600
              hover:from-cyan-700 hover:to-purple-700
              disabled:opacity-50 transition-all duration-300
              shadow-[0_0_30px_rgba(0,255,255,0.2)] hover:shadow-[0_0_40px_rgba(0,255,255,0.3)]
            `}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.md,.json,.xml"
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />

        <div className="flex items-center justify-between px-3 py-1 border-t border-cyan-500/5">
          <div className="flex items-center gap-2 text-[8px] text-cyan-400/20 font-mono tracking-widest">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {activeMode !== 'text' ? `${attachments.length} ${activeMode}(s) attached` : 'TEXT MODE'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[8px] text-cyan-400/20 font-mono">
            <span>⌘+Enter to send</span>
            <span className="text-cyan-400/10">|</span>
            <span>Drop files anywhere</span>
          </div>
        </div>
      </div>
    </div>
  )
}
