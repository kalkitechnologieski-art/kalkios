#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# RESTORE UI COMPONENTS – Fix input bar
# ============================================================================

ROOT_DIR="$(pwd)"
APP_DIR="${ROOT_DIR}/apps/web"
BACKUP_SUFFIX=".bak"
TIMESTAMP=$(date "+%Y%m%d_%H%M%S")
LOG_FILE="${ROOT_DIR}/restore_ui_${TIMESTAMP}.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

log "Restoring UI components..."

if [ ! -d "$APP_DIR" ]; then
  log "ERROR: $APP_DIR does not exist."
  exit 1
fi

cd "$APP_DIR"

# -----------------------------------------------------------------------------
# 1. Restore NeonComposer.tsx
# -----------------------------------------------------------------------------
log "Restoring NeonComposer.tsx..."
cat > "${APP_DIR}/components/chat/NeonComposer.tsx" << 'NEON_EOF'
'use client'

import { useState, useRef } from 'react'
import { ImageIcon, Video, Search, Brain, X, Loader2, Paperclip, Send } from 'lucide-react'
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
      <div className="flex flex-wrap items-center gap-3 px-1">
        <ModeToggleButton
          active={isDeepThink}
          onToggle={() => setIsDeepThink(!isDeepThink)}
          label="DeepThink"
          tooltip="Enable deep reasoning with Socratic questioning."
          colorScheme="gold"
        />
        <ModeToggleButton
          active={isSetuMode}
          onToggle={() => setIsSetuMode(!isSetuMode)}
          label="SETU"
          tooltip="Activate lead generation mode."
          colorScheme="red"
        />
        <div className="h-6 w-px bg-white/10 hidden sm:block" />
        <button
          onClick={() => setIsSearchMode(!isSearchMode)}
          className={`p-1.5 rounded-lg transition ${isSearchMode ? 'bg-blue-600/30 text-blue-400 border border-blue-500/30' : 'text-white/40 hover:text-white/70'}`}
          title="Web Search"
        >
          <Search className="w-4 h-4" />
        </button>
        <button
          onClick={() => onModeChange(mode === 'image' ? 'chat' : 'image')}
          className={`p-1.5 rounded-lg transition ${mode === 'image' ? 'bg-pink-600/30 text-pink-400 border border-pink-500/30' : 'text-white/40 hover:text-white/70'}`}
          title="Image Mode"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => onModeChange(mode === 'video' ? 'chat' : 'video')}
          className={`p-1.5 rounded-lg transition ${mode === 'video' ? 'bg-red-600/30 text-red-400 border border-red-500/30' : 'text-white/40 hover:text-white/70'}`}
          title="Video Mode"
        >
          <Video className="w-4 h-4" />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-lg hover:bg-white/5 text-white/40 hover:text-white/70 transition"
          title="Attach file"
        >
          <Paperclip className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*,.pdf,.doc,.docx,.txt,.md"
          onChange={handleFileUpload}
          className="hidden"
        />
        {onClear && (
          <button onClick={onClear} className="text-red-400/60 hover:text-red-400 transition text-xs font-mono px-2 py-1">
            ✕ Clear
          </button>
        )}
      </div>

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

      <CosmicPromptBar
        onSend={handleSend}
        isLoading={isLoading}
        placeholder={mode === 'image' ? 'Describe the image...' : mode === 'video' ? 'Describe the video...' : 'Ask Siddhi anything...'}
        mode={mode}
      />
    </div>
  )
}
NEON_EOF
log "NeonComposer.tsx restored"

# -----------------------------------------------------------------------------
# 2. Restore CosmicPromptBar.tsx (the actual input)
# -----------------------------------------------------------------------------
log "Restoring CosmicPromptBar.tsx..."
cat > "${APP_DIR}/components/ui/CosmicPromptBar.tsx" << 'COSMIC_EOF'
'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface CosmicPromptBarProps {
  onSend: (text: string) => void
  isLoading: boolean
  placeholder?: string
  className?: string
  mode?: 'chat' | 'image' | 'video'
}

export function CosmicPromptBar({
  onSend,
  isLoading,
  placeholder = 'Ask Siddhi anything...',
  className = '',
  mode = 'chat',
}: CosmicPromptBarProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    if (!text.trim() || isLoading) return
    onSend(text)
    setText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const buttonConfig = {
    chat: {
      label: 'Chat',
      bg: '#00d4ff',
      layerA: '#00d4ff',
      layerB: '#8b5cf6',
    },
    image: {
      label: 'Image',
      bg: '#ff0044',
      layerA: '#ff0044',
      layerB: '#ff66aa',
    },
    video: {
      label: 'Video',
      bg: '#8b5cf6',
      layerA: '#8b5cf6',
      layerB: '#00ccff',
    },
  }

  const config = buttonConfig[mode] || buttonConfig.chat

  return (
    <div className={`cosmic-wrapper relative ${className}`}>
      <div className={`galaxy-bg ${isLoading ? 'animate-twinkle' : ''}`} />

      <div id="cosmic-search-container" className="relative flex items-center">
        <div className="nebula-layer" />
        <div className="starfield-layer" />
        <div className="stardust-layer" />
        <div className="cosmic-ring-layer" />

        <div id="cosmic-main" className="relative flex items-center w-full">
          {/* Send Button – LEFT SIDE */}
          <div className="btn-wrapper flex-shrink-0 mr-2 z-10">
            <div className="light" />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '0s',
                animationDuration: '25s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA})`,
              }}
            />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '0.15s',
                animationDuration: '15.9s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB})`,
              }}
            />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '0.53s',
                animationDuration: '26.4s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA})`,
              }}
            />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '0.45s',
                animationDuration: '17.8s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB})`,
              }}
            />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '1.6s',
                animationDuration: '19.2s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA})`,
              }}
            />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '1.6s',
                animationDuration: '29.2s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB})`,
              }}
            />
            <div
              className="gradient-layer"
              style={{
                animationDelay: '1.6s',
                animationDuration: '20.2s',
                background: `radial-gradient(ellipse at 65% 180%, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA}, ${config.layerB}, ${config.layerA})`,
              }}
            />

            <button
              className="gradient-btn"
              onClick={handleSend}
              disabled={!text.trim() || isLoading}
              style={{
                backgroundColor: config.bg,
                boxShadow: `inset 0 0 10px 9px ${config.layerB}44`,
              }}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                config.label
              )}
            </button>
            <div className="text-overlay">{isLoading ? 'Sending...' : config.label}</div>
          </div>

          {/* Input – RIGHT SIDE */}
          <div className="relative flex-1 min-w-0">
            <input
              ref={inputRef}
              className="cosmic-input"
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? 'Siddhi is thinking...' : placeholder}
              disabled={isLoading}
            />
            <div id="cosmic-input-mask" />
            <div id="cosmic-glow" className={isLoading ? 'opacity-100' : 'opacity-0'} />
            <div className={`wormhole-border ${isLoading ? 'animate-rotate' : ''}`} />
          </div>
        </div>
      </div>

      <style jsx>{`
        .cosmic-wrapper {
          width: 100%;
          position: relative;
          padding: 4px 0;
        }
        .galaxy-bg {
          position: absolute;
          inset: -20px;
          z-index: 0;
          background-image: radial-gradient(#ffffff 1px, transparent 1px),
            radial-gradient(#ffffff 1px, transparent 1px);
          background-size: 50px 50px;
          background-position: 0 0, 25px 25px;
          opacity: 0;
          transition: opacity 0.8s ease;
          pointer-events: none;
          border-radius: 16px;
        }
        .galaxy-bg.animate-twinkle {
          opacity: 0.5;
          animation: twinkle 2s infinite;
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        #cosmic-search-container {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          z-index: 1;
          width: 100%;
        }
        .nebula-layer,
        .starfield-layer,
        .stardust-layer,
        .cosmic-ring-layer {
          position: absolute;
          max-height: 70px;
          max-width: 314px;
          height: 100%;
          width: 100%;
          overflow: hidden;
          z-index: -1;
          border-radius: 12px;
          filter: blur(3px);
          pointer-events: none;
        }
        .stardust-layer {
          max-height: 63px;
          max-width: 307px;
          border-radius: 10px;
          filter: blur(2px);
        }
        .stardust-layer::before {
          content: "";
          z-index: -2;
          text-align: center;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(83deg);
          position: absolute;
          width: 600px;
          height: 600px;
          background-repeat: no-repeat;
          background-position: 0 0;
          filter: brightness(1.4);
          background-image: conic-gradient(
            rgba(0, 0, 0, 0) 0%,
            #4d6dff,
            rgba(0, 0, 0, 0) 8%,
            rgba(0, 0, 0, 0) 50%,
            #6e8cff,
            rgba(0, 0, 0, 0) 58%
          );
          transition: all 2s;
        }
        .cosmic-ring-layer {
          max-height: 59px;
          max-width: 303px;
          border-radius: 11px;
          filter: blur(0.5px);
        }
        .cosmic-ring-layer::before {
          content: "";
          z-index: -2;
          text-align: center;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(70deg);
          position: absolute;
          width: 600px;
          height: 600px;
          filter: brightness(1.3);
          background-repeat: no-repeat;
          background-position: 0 0;
          background-image: conic-gradient(
            #05071b,
            #4d6dff 5%,
            #05071b 14%,
            #05071b 50%,
            #6e8cff 60%,
            #05071b 64%
          );
          transition: all 2s;
        }
        .starfield-layer {
          max-height: 65px;
          max-width: 312px;
        }
        .starfield-layer::before {
          content: "";
          z-index: -2;
          text-align: center;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(82deg);
          position: absolute;
          width: 600px;
          height: 600px;
          background-repeat: no-repeat;
          background-position: 0 0;
          background-image: conic-gradient(
            rgba(0, 0, 0, 0),
            #1c2452,
            rgba(0, 0, 0, 0) 10%,
            rgba(0, 0, 0, 0) 50%,
            #2a3875,
            rgba(0, 0, 0, 0) 60%
          );
          transition: all 2s;
        }
        .nebula-layer {
          overflow: hidden;
          filter: blur(30px);
          opacity: 0.4;
          max-height: 130px;
          max-width: 354px;
        }
        .nebula-layer::before {
          content: "";
          z-index: -2;
          text-align: center;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(60deg);
          position: absolute;
          width: 999px;
          height: 999px;
          background-repeat: no-repeat;
          background-position: 0 0;
          background-image: conic-gradient(
            #000,
            #4d6dff 5%,
            #000 38%,
            #000 50%,
            #6e8cff 60%,
            #000 87%
          );
          transition: all 2s;
        }
        #cosmic-search-container:hover .starfield-layer::before {
          transform: translate(-50%, -50%) rotate(-98deg);
        }
        #cosmic-search-container:hover .nebula-layer::before {
          transform: translate(-50%, -50%) rotate(-120deg);
        }
        #cosmic-search-container:hover .stardust-layer::before {
          transform: translate(-50%, -50%) rotate(-97deg);
        }
        #cosmic-search-container:hover .cosmic-ring-layer::before {
          transform: translate(-50%, -50%) rotate(-110deg);
        }
        #cosmic-search-container:focus-within .starfield-layer::before {
          transform: translate(-50%, -50%) rotate(442deg);
          transition: all 4s;
        }
        #cosmic-search-container:focus-within .nebula-layer::before {
          transform: translate(-50%, -50%) rotate(420deg);
          transition: all 4s;
        }
        #cosmic-search-container:focus-within .stardust-layer::before {
          transform: translate(-50%, -50%) rotate(443deg);
          transition: all 4s;
        }
        #cosmic-search-container:focus-within .cosmic-ring-layer::before {
          transform: translate(-50%, -50%) rotate(430deg);
          transition: all 4s;
        }
        #cosmic-main {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }
        .cosmic-input {
          background-color: #05071b;
          border: none;
          width: 100%;
          height: 56px;
          border-radius: 10px;
          color: #a9c7ff;
          padding-inline: 16px;
          font-size: 18px;
          font-family: inherit;
          position: relative;
          z-index: 2;
          outline: none;
          min-width: 0;
        }
        .cosmic-input::placeholder {
          color: #6e8cff;
        }
        .cosmic-input:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        #cosmic-input-mask {
          display: none;
        }
        #cosmic-glow {
          pointer-events: none;
          width: 30px;
          height: 20px;
          position: absolute;
          background: #4d6dff;
          top: 50%;
          transform: translateY(-50%);
          left: 5px;
          filter: blur(20px);
          transition: all 2s;
          z-index: 1;
          opacity: 0;
        }
        #cosmic-glow.opacity-100 {
          opacity: 0.4;
        }
        .wormhole-border {
          height: 42px;
          width: 40px;
          position: absolute;
          overflow: hidden;
          top: 50%;
          transform: translateY(-50%);
          right: 7px;
          border-radius: 10px;
          z-index: 1;
          opacity: 0;
          transition: opacity 0.5s ease;
        }
        .wormhole-border::before {
          content: "";
          text-align: center;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(90deg);
          position: absolute;
          width: 600px;
          height: 600px;
          background-repeat: no-repeat;
          background-position: 0 0;
          filter: brightness(1.35);
          background-image: conic-gradient(
            rgba(0, 0, 0, 0),
            #4d6dff,
            rgba(0, 0, 0, 0) 50%,
            rgba(0, 0, 0, 0) 50%,
            #6e8cff,
            rgba(0, 0, 0, 0) 100%
          );
        }
        .wormhole-border.animate-rotate {
          opacity: 0.8;
        }
        .wormhole-border.animate-rotate::before {
          animation: cosmic-rotate 4s linear infinite;
        }
        @keyframes cosmic-rotate {
          100% { transform: translate(-50%, -50%) rotate(450deg); }
        }
        /* Gradient Button */
        .btn-wrapper {
          --rad: 20px;
          --color-wrapper-border: transparent;
          --color-btn-bg: #00d4ff;
          --color-btn-text: #000;
          --color-btn-text-shadow: #fff;
          --color-btn-inset-shadow: #558;
          --color-layer-a: #00d4ff;
          --color-layer-b: #8b5cf6;
          --color-overlay-text: #000;
          --color-overlay-glow: #fff;
          --color-overlay-shadow: #0004;
          --color-overlay-highlight: #fff5;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: clip;
          overflow-clip-margin: 4px;
          border: 2px solid var(--color-wrapper-border);
          border-radius: var(--rad);
          font-family: "Inter", sans-serif;
          font-size: 0.8rem;
          font-weight: 600;
          filter: saturate(0.65) brightness(1.8);
          width: 70px;
          height: 40px;
          flex-shrink: 0;
        }
        .gradient-btn {
          position: relative;
          z-index: -1;
          padding: 4px 8px;
          border: none;
          border-radius: var(--rad);
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          letter-spacing: 0.05rem;
          color: var(--color-btn-text);
          background-color: var(--color-btn-bg);
          background-size: 200% 200%;
          box-shadow: inset 0 0 10px 9px var(--color-btn-inset-shadow);
          text-shadow: 0 1px 3px var(--color-btn-text-shadow);
          cursor: pointer;
          mix-blend-mode: color-dodge;
          transition: color 0.3s ease, text-shadow 0.3s ease;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gradient-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .gradient-btn::after {
          content: "";
          position: absolute;
          pointer-events: none;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          border-radius: var(--rad);
          background-size: 200% 200%;
          mix-blend-mode: difference;
          z-index: 1;
        }
        .gradient-layer {
          position: absolute;
          pointer-events: none;
          left: -160px;
          width: 500%;
          aspect-ratio: 1;
          background: radial-gradient(
            ellipse at 65% 180%,
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a),
            var(--color-layer-b),
            var(--color-layer-a)
          );
          mix-blend-mode: difference;
          animation: rotate 8s linear infinite;
        }
        .gradient-layer:last-child {
          mix-blend-mode: color-dodge;
        }
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .text-overlay {
          position: absolute;
          pointer-events: none;
          z-index: 2;
          padding: 4px 8px;
          border-radius: var(--rad);
          font-family: inherit;
          font-size: inherit;
          font-weight: inherit;
          letter-spacing: 0.05rem;
          color: var(--color-overlay-text);
          text-shadow: 0 0 4px var(--color-overlay-glow);
          box-shadow:
            inset 0 -4px 4px 0 var(--color-overlay-shadow),
            inset 0 4px 4px 0 var(--color-overlay-highlight);
          mix-blend-mode: multiply;
          transition: transform 0.3s ease;
          animation: opacityPulse 5s ease infinite;
          white-space: nowrap;
        }
        .btn-wrapper:hover .text-overlay {
          transform: scale(1.05);
        }
        .btn-wrapper:active .text-overlay {
          transform: scale(0.95);
        }
        .btn-wrapper:hover .gradient-btn {
          color: #0000;
          text-shadow: 0 0 0 #0000;
        }
        .btn-wrapper:active .gradient-btn {
          color: #0000;
          text-shadow: 0 0 0 #0000;
        }
        .light {
          position: absolute;
          pointer-events: none;
          z-index: 1;
          border-radius: 50px;
          width: 80%;
          height: 1.2rem;
          aspect-ratio: 1;
          background-color: #fff5;
          filter: blur(5px);
          animation: pulse 3s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.1; }
        }
        @keyframes opacityPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @media (max-width: 640px) {
          .cosmic-input {
            font-size: 14px;
            padding-inline: 12px;
            height: 48px;
          }
          .btn-wrapper {
            width: 60px;
            height: 36px;
            font-size: 0.7rem;
            margin-right: 6px;
          }
          .gradient-layer {
            left: -100px;
          }
          .text-overlay {
            font-size: 0.7rem;
            padding: 2px 6px;
          }
          .gradient-btn {
            padding: 2px 6px;
          }
          .nebula-layer, .starfield-layer, .stardust-layer, .cosmic-ring-layer {
            display: none;
          }
        }
        @media (max-width: 480px) {
          .btn-wrapper {
            width: 50px;
            height: 32px;
          }
          .cosmic-input {
            height: 40px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  )
}
COSMIC_EOF
log "CosmicPromptBar.tsx restored"

# -----------------------------------------------------------------------------
# 3. Restore ModeToggleButton.tsx
# -----------------------------------------------------------------------------
log "Restoring ModeToggleButton.tsx..."
cat > "${APP_DIR}/components/ui/ModeToggleButton.tsx" << 'MODE_EOF'
'use client'

import { useState, useRef, useEffect } from 'react'

interface ModeToggleButtonProps {
  active: boolean
  onToggle: () => void
  label: string
  tooltip: string
  colorScheme: 'gold' | 'red'
  className?: string
}

export function ModeToggleButton({
  active,
  onToggle,
  label,
  tooltip,
  colorScheme = 'gold',
  className = '',
}: ModeToggleButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const colors = {
    gold: {
      radialInner: '#ffd215',
      radialOuter: '#fff172',
      shadow: 'rgba(255, 223, 87, 0.5)',
      shadowInsetTop: 'rgba(255, 223, 52, 0.9)',
      shadowInsetBottom: 'rgba(255, 250, 215, 0.8)',
      cColor1: 'rgba(255, 163, 26, 0.7)',
      cColor2: '#1a23ff',
      cColor3: '#e21bda',
      cColor4: 'rgba(255, 232, 26, 0.7)',
    },
    red: {
      radialInner: '#ff0044',
      radialOuter: '#ff3366',
      shadow: 'rgba(255, 0, 68, 0.5)',
      shadowInsetTop: 'rgba(255, 0, 68, 0.9)',
      shadowInsetBottom: 'rgba(255, 100, 120, 0.8)',
      cColor1: 'rgba(255, 0, 68, 0.7)',
      cColor2: '#cc0033',
      cColor3: '#ff66aa',
      cColor4: 'rgba(255, 100, 120, 0.7)',
    },
  }

  const c = colors[colorScheme]

  const handleMouseEnter = () => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => {
      setShowTooltip(true)
    }, 2000)
  }

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    setShowTooltip(false)
  }

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      <button
        ref={buttonRef}
        className={`uiverse-mode-btn ${active ? 'active' : ''} ${className}`}
        onClick={onToggle}
        style={
          {
            '--c-radial-inner': c.radialInner,
            '--c-radial-outer': c.radialOuter,
            '--c-shadow': c.shadow,
            '--c-shadow-inset-top': c.shadowInsetTop,
            '--c-shadow-inset-bottom': c.shadowInsetBottom,
            '--c-color-1': c.cColor1,
            '--c-color-2': c.cColor2,
            '--c-color-3': c.cColor3,
            '--c-color-4': c.cColor4,
            '--duration': active ? '1400ms' : '0s',
          } as React.CSSProperties
        }
      >
        <div className="wrapper">
          <span>{label}</span>
          <div className={`circle circle-12 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-11 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-10 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-9 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-8 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-7 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-6 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-5 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-4 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-3 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-2 ${active ? 'animate' : ''}`}></div>
          <div className={`circle circle-1 ${active ? 'animate' : ''}`}></div>
        </div>
      </button>

      {showTooltip && (
        <div className="mode-tooltip">
          {tooltip}
        </div>
      )}

      <style jsx>{`
        .uiverse-mode-btn {
          --duration: 0s;
          --easing: linear;
          --c-color-1: rgba(255, 163, 26, 0.7);
          --c-color-2: #1a23ff;
          --c-color-3: #e21bda;
          --c-color-4: rgba(255, 232, 26, 0.7);
          --c-shadow: rgba(255, 223, 87, 0.5);
          --c-shadow-inset-top: rgba(255, 223, 52, 0.9);
          --c-shadow-inset-bottom: rgba(255, 250, 215, 0.8);
          --c-radial-inner: #ffd215;
          --c-radial-outer: #fff172;
          --c-color: #fff;
          -webkit-tap-highlight-color: transparent;
          -webkit-appearance: none;
          outline: none;
          position: relative;
          cursor: pointer;
          border: none;
          display: table;
          border-radius: 24px;
          padding: 0;
          margin: 0;
          text-align: center;
          font-weight: 600;
          font-size: 14px;
          letter-spacing: 0.02em;
          line-height: 1.5;
          color: var(--c-color);
          background: radial-gradient(
            circle,
            var(--c-radial-inner),
            var(--c-radial-outer) 80%
          );
          box-shadow: 0 0 14px var(--c-shadow);
          transition: all 0.3s ease;
          min-width: 100px;
          height: 42px;
        }
        .uiverse-mode-btn.active {
          --duration: 1400ms;
        }
        .uiverse-mode-btn:before {
          content: "";
          pointer-events: none;
          position: absolute;
          z-index: 3;
          left: 0;
          top: 0;
          right: 0;
          bottom: 0;
          border-radius: 24px;
          box-shadow:
            inset 0 3px 12px var(--c-shadow-inset-top),
            inset 0 -3px 4px var(--c-shadow-inset-bottom);
        }
        .uiverse-mode-btn .wrapper {
          -webkit-mask-image: -webkit-radial-gradient(white, black);
          overflow: hidden;
          border-radius: 24px;
          min-width: 100px;
          padding: 10px 16px;
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .uiverse-mode-btn .wrapper span {
          display: inline-block;
          position: relative;
          z-index: 1;
        }
        .uiverse-mode-btn .wrapper .circle {
          position: absolute;
          left: 0;
          top: 0;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          filter: blur(var(--blur, 8px));
          background: var(--background, transparent);
          transform: translate(var(--x, 0), var(--y, 0)) translateZ(0);
          animation: none;
          opacity: 0.6;
        }
        .uiverse-mode-btn.active .wrapper .circle {
          animation: var(--animation, none) var(--duration) var(--easing) infinite;
          opacity: 1;
        }
        .uiverse-mode-btn .wrapper .circle.circle-1,
        .uiverse-mode-btn .wrapper .circle.circle-9,
        .uiverse-mode-btn .wrapper .circle.circle-10 {
          --background: var(--c-color-4);
        }
        .uiverse-mode-btn .wrapper .circle.circle-3,
        .uiverse-mode-btn .wrapper .circle.circle-4 {
          --background: var(--c-color-2);
          --blur: 14px;
        }
        .uiverse-mode-btn .wrapper .circle.circle-5,
        .uiverse-mode-btn .wrapper .circle.circle-6 {
          --background: var(--c-color-3);
          --blur: 16px;
        }
        .uiverse-mode-btn .wrapper .circle.circle-2,
        .uiverse-mode-btn .wrapper .circle.circle-7,
        .uiverse-mode-btn .wrapper .circle.circle-8,
        .uiverse-mode-btn .wrapper .circle.circle-11,
        .uiverse-mode-btn .wrapper .circle.circle-12 {
          --background: var(--c-color-1);
          --blur: 12px;
        }
        .uiverse-mode-btn .wrapper .circle.circle-1 { --x: 0; --y: -40px; --animation: circle-1; }
        .uiverse-mode-btn .wrapper .circle.circle-2 { --x: 92px; --y: 8px; --animation: circle-2; }
        .uiverse-mode-btn .wrapper .circle.circle-3 { --x: -12px; --y: -12px; --animation: circle-3; }
        .uiverse-mode-btn .wrapper .circle.circle-4 { --x: 80px; --y: -12px; --animation: circle-4; }
        .uiverse-mode-btn .wrapper .circle.circle-5 { --x: 12px; --y: -4px; --animation: circle-5; }
        .uiverse-mode-btn .wrapper .circle.circle-6 { --x: 56px; --y: 16px; --animation: circle-6; }
        .uiverse-mode-btn .wrapper .circle.circle-7 { --x: 8px; --y: 28px; --animation: circle-7; }
        .uiverse-mode-btn .wrapper .circle.circle-8 { --x: 28px; --y: -4px; --animation: circle-8; }
        .uiverse-mode-btn .wrapper .circle.circle-9 { --x: 20px; --y: -12px; --animation: circle-9; }
        .uiverse-mode-btn .wrapper .circle.circle-10 { --x: 64px; --y: 16px; --animation: circle-10; }
        .uiverse-mode-btn .wrapper .circle.circle-11 { --x: 4px; --y: 4px; --animation: circle-11; }
        .uiverse-mode-btn .wrapper .circle.circle-12 { --blur: 14px; --x: 52px; --y: 4px; --animation: circle-12; }
        @keyframes circle-1 {
          33% { transform: translate(0px, 16px) translateZ(0); }
          66% { transform: translate(12px, 64px) translateZ(0); }
        }
        @keyframes circle-2 {
          33% { transform: translate(80px, -10px) translateZ(0); }
          66% { transform: translate(72px, -48px) translateZ(0); }
        }
        @keyframes circle-3 {
          33% { transform: translate(20px, 12px) translateZ(0); }
          66% { transform: translate(12px, 4px) translateZ(0); }
        }
        @keyframes circle-4 {
          33% { transform: translate(76px, -12px) translateZ(0); }
          66% { transform: translate(112px, -8px) translateZ(0); }
        }
        @keyframes circle-5 {
          33% { transform: translate(84px, 28px) translateZ(0); }
          66% { transform: translate(40px, -32px) translateZ(0); }
        }
        @keyframes circle-6 {
          33% { transform: translate(28px, -16px) translateZ(0); }
          66% { transform: translate(76px, -56px) translateZ(0); }
        }
        @keyframes circle-7 {
          33% { transform: translate(8px, 28px) translateZ(0); }
          66% { transform: translate(20px, -60px) translateZ(0); }
        }
        @keyframes circle-8 {
          33% { transform: translate(32px, -4px) translateZ(0); }
          66% { transform: translate(56px, -20px) translateZ(0); }
        }
        @keyframes circle-9 {
          33% { transform: translate(20px, -12px) translateZ(0); }
          66% { transform: translate(80px, -8px) translateZ(0); }
        }
        @keyframes circle-10 {
          33% { transform: translate(68px, 20px) translateZ(0); }
          66% { transform: translate(100px, 28px) translateZ(0); }
        }
        @keyframes circle-11 {
          33% { transform: translate(4px, 4px) translateZ(0); }
          66% { transform: translate(68px, 20px) translateZ(0); }
        }
        @keyframes circle-12 {
          33% { transform: translate(56px, 0px) translateZ(0); }
          66% { transform: translate(60px, -32px) translateZ(0); }
        }
        .mode-tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%);
          background: #1a1a2e;
          border: 1px solid rgba(0, 255, 255, 0.2);
          border-radius: 8px;
          padding: 8px 14px;
          color: #a9c7ff;
          font-size: 12px;
          font-weight: 400;
          white-space: nowrap;
          max-width: 220px;
          white-space: normal;
          text-align: center;
          z-index: 50;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5);
          backdrop-filter: blur(8px);
          pointer-events: none;
          animation: tooltipFade 0.2s ease-out;
        }
        .mode-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 6px solid transparent;
          border-top-color: #1a1a2e;
        }
        @keyframes tooltipFade {
          from { opacity: 0; transform: translateX(-50%) translateY(-4px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @media (max-width: 640px) {
          .uiverse-mode-btn {
            font-size: 12px;
            min-width: 80px;
            height: 36px;
          }
          .uiverse-mode-btn .wrapper {
            padding: 6px 12px;
            min-width: 80px;
          }
          .uiverse-mode-btn .wrapper .circle {
            width: 22px;
            height: 22px;
          }
          .mode-tooltip {
            font-size: 10px;
            max-width: 160px;
            padding: 6px 10px;
          }
        }
      `}</style>
    </div>
  )
}
MODE_EOF
log "ModeToggleButton.tsx restored"

# -----------------------------------------------------------------------------
# 4. Restore LuxuryButton.tsx
# -----------------------------------------------------------------------------
log "Restoring LuxuryButton.tsx..."
cat > "${APP_DIR}/components/ui/LuxuryButton.tsx" << 'LUX_EOF'
'use client'
import { cn } from '@/lib/utils'
import { forwardRef } from 'react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
  label?: string
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

export const LuxuryButton = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      className,
      children,
      label,
      icon,
      iconPosition = 'left',
      disabled,
      ...props
    },
    ref
  ) => {
    const variants = {
      primary:
        'bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-black font-semibold shadow-glow hover:shadow-glow-strong transition-all duration-200',
      secondary:
        'bg-white/10 hover:bg-white/15 active:bg-white/20 text-white border border-white/10 hover:border-white/20',
      tertiary:
        'text-white/50 hover:text-white/70 active:text-white hover:bg-white/5',
      destructive:
        'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white',
    }

    const sizes = {
      sm: 'px-4 py-1.5 text-sm min-h-[36px] min-w-[80px]',
      md: 'px-6 py-2.5 text-base min-h-[44px] min-w-[120px]',
      lg: 'px-8 py-3.5 text-lg min-h-[52px] min-w-[160px]',
    }

    const isDisabled = disabled || loading
    const content = label || children

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:ring-offset-2 focus:ring-offset-black',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          isDisabled && 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100',
          !isDisabled && 'active:scale-[0.98]',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            {content}
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </button>
    )
  }
)

LuxuryButton.displayName = 'LuxuryButton'
LUX_EOF
log "LuxuryButton.tsx restored"

# -----------------------------------------------------------------------------
# 5. Run type-check and build
# -----------------------------------------------------------------------------
log "Running TypeScript type check..."
npm run type-check || { log "Type check failed."; exit 1; }

log "Building project..."
npm run build || { log "Build failed."; exit 1; }

log "============================================================="
log "UI components restored. Input bar should work now."
log "Deploy to Vercel to see the changes."
log "Log file: $LOG_FILE"
log "============================================================="

exit 0