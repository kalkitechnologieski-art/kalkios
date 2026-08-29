'use client'

import { useState, useRef } from 'react'
import { Send, Image as ImageIcon, Video, Paperclip, Zap, Trash2, Loader2, X, Sparkles } from 'lucide-react'
import { LuxuryButton } from '@/components/ui/LuxuryButton'
import { QuantumButton } from '@/components/ui/QuantumButton'
import { motion, AnimatePresence } from 'framer-motion'

type MediaMode = 'text' | 'image' | 'video' | 'file'

interface NeonComposerProps {
  onSend: (text: string, file?: File) => void
  isLoading: boolean
  onClear?: () => void
  isSetuMode: boolean
  setIsSetuMode: (val: boolean) => void
  isDeepThink: boolean
  setIsDeepThink: (val: boolean) => void
  className?: string
}

export function NeonComposer({
  onSend, isLoading, onClear, isSetuMode, setIsSetuMode, isDeepThink, setIsDeepThink, className = ''
}: NeonComposerProps) {
  const [text, setText] = useState('')
  const [mode, setMode] = useState<MediaMode>('text')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [guideMessage, setGuideMessage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleModeChange = (newMode: MediaMode) => {
    setMode(newMode)
    if (newMode !== 'text') { setFile(null); setPreviewUrl(null) }
    if (newMode === 'image') {
      setGuideMessage('🖼️ Describe the image you want to generate or upload a reference.')
      onSend('🖼️ Image mode activated. Tell me what you want to create.')
    } else if (newMode === 'video') {
      setGuideMessage('🎬 Describe the video you want to generate or upload a reference.')
      onSend('🎬 Video mode activated. Tell me what you want to create.')
    } else if (newMode === 'file') {
      setGuideMessage('📎 Upload a file (PDF, DOC, TXT, etc.) and I\'ll analyze it.')
      onSend('📎 File mode activated. Upload a file and I\'ll analyze it.')
    } else {
      setGuideMessage(null)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); e.target.value = ''
    if (f.type.startsWith('image/')) {
      setMode('image'); setGuideMessage('🖼️ Image uploaded. Describe what you\'d like to do with it.')
      onSend(`📷 Image uploaded: ${f.name}. What would you like to do?`)
    } else if (f.type.startsWith('video/')) {
      setMode('video'); setGuideMessage('🎬 Video uploaded. Describe the output you want.')
      onSend(`🎬 Video uploaded: ${f.name}. What would you like to generate?`)
    } else {
      setGuideMessage('📎 File uploaded. I\'ll analyze it.')
      onSend(`📎 File uploaded: ${f.name}. I'll analyze it.`)
    }
  }

  const clearFile = () => { setFile(null); setPreviewUrl(null); setGuideMessage(null) }
  const handleSend = () => {
    if ((!text.trim() && !file) || isLoading) return
    onSend(text, file || undefined)
    setText(''); setFile(null); setPreviewUrl(null); setGuideMessage(null)
  }
  const handleClear = () => { if (onClear && window.confirm('Clear the entire conversation?')) onClear() }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-1 flex-wrap">
        <button onClick={() => handleModeChange('image')} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition" title="Generate Image"><ImageIcon className="w-4 h-4" /></button>
        <button onClick={() => handleModeChange('video')} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition" title="Generate Video"><Video className="w-4 h-4" /></button>
        <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition" title="Upload File"><Paperclip className="w-4 h-4" /></button>
        <div className="w-px h-6 bg-white/10 mx-1" />
        <button onClick={handleClear} className="p-2 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition" title="Clear Chat"><Trash2 className="w-4 h-4" /></button>
        <input ref={fileInputRef} type="file" accept="image/*,video/*,.pdf,.doc,.docx,.txt,.md" onChange={handleFileUpload} className="hidden" />
      </div>

      {guideMessage && <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2 text-xs text-cyan-400/80 font-mono">{guideMessage}</div>}

      <AnimatePresence>
        {file && previewUrl && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3 backdrop-blur-sm">
            {mode === 'image' && <img src={previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded-lg" />}
            {mode === 'video' && <video src={previewUrl} className="w-12 h-12 object-cover rounded-lg" muted />}
            <div className="flex-1 min-w-0"><p className="text-sm text-white truncate">{file.name}</p><p className="text-xs text-white/30">{(file.size/1024).toFixed(0)} KB</p></div>
            <button onClick={clearFile} className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition"><X className="w-4 h-4" /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/5 rounded-2xl p-2 focus-within:border-cyan-500/30 transition">
        <input type="text" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()} placeholder={mode === 'text' ? 'Type your message...' : `Describe your ${mode}...`} className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm px-2 min-h-[40px]" disabled={isLoading} />
        <LuxuryButton variant="primary" size="sm" onClick={handleSend} disabled={(!text.trim() && !file) || isLoading} className="min-w-[80px]">{isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</LuxuryButton>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <QuantumButton active={isSetuMode} onToggle={() => setIsSetuMode(!isSetuMode)} label={<span className="flex items-center gap-1"><Zap className="w-4 h-4" />SETU</span>} />
        <QuantumButton active={isDeepThink} onToggle={() => setIsDeepThink(!isDeepThink)} label={<span className="flex items-center gap-1"><Sparkles className="w-4 h-4" />DeepThink</span>} />
        <span className="text-[10px] text-white/30 font-mono">{isSetuMode ? '🟢 Lead gen' : isDeepThink ? '🧠 DeepThink' : 'Click to activate'}</span>
      </div>
    </div>
  )
}
