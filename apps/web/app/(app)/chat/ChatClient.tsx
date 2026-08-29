'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useChat } from '@/hooks/useChat'
import { useMemory } from '@/hooks/useMemory'
import { LuxuryMessage } from '@/components/chat/LuxuryMessage'
import { ThinkingTrace } from '@/components/chat/ThinkingTrace'
import { NeonComposer } from '@/components/chat/NeonComposer'
import { GradientGlowBackground } from '@/components/ui/GradientGlowBackground'
import { ThinkingLoader } from '@/components/ui/ThinkingLoader'
import { MediaGenerationLoader } from '@/components/ui/MediaGenerationLoader'
import { Bot, Brain, Search, Image as ImageIcon, Video, Users, Sparkles, Zap, Activity } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message {
  id: string | number
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  reasoning?: string
  tokens?: number
  timeMs?: number
  steps?: string[]
  provider?: string
  isMedia?: boolean
}

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [isThinking, setIsThinking] = useState(false)
  const [reasoning, setReasoning] = useState('')
  const [tokens, setTokens] = useState(0)
  const [timeMs, setTimeMs] = useState(0)
  const [provider, setProvider] = useState<string>('')
  const [steps, setSteps] = useState<string[]>([])
  const [mode, setMode] = useState<'chat' | 'image' | 'video'>('chat')
  const [deepThink, setDeepThink] = useState(false)
  const [setuMode, setSetuMode] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  const [generatingMedia, setGeneratingMedia] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(true)
  const { sendMessage, generateImage, generateVideo, webSearch, runSETU, isProcessing } = useChat()
  const { loadMemory, saveMemory, clearMemory } = useMemory()
  const endRef = useRef<HTMLDivElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Load memory
  useEffect(() => {
    setIsMounted(true)
    const load = async () => {
      const saved = await loadMemory()
      if (saved && saved.length > 0) {
        setMessages(saved)
        setShowOnboarding(false)
      } else {
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: `👋 I'm **Siddhi**, your AI concierge. I can help with:
  • 💬 Chat & reasoning
  • 🖼️ Generate images (Agnes/Zhipu)
  • 🎬 Create videos
  • 🔎 Web search (real‑time)
  • 🧠 Deep thinking for complex analysis
  • 🔍 Lead generation (SETU)

  Tap a mode below or just ask!`,
          timestamp: new Date(),
        }])
        setShowOnboarding(true)
      }
    }
    load()
  }, [loadMemory])

  useEffect(() => {
    if (isMounted && messages.length > 1) {
      saveMemory(messages)
    }
  }, [messages, saveMemory, isMounted])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (text: string, file?: File) => {
    if (!text.trim() && !file) return

    const userMsg: Message = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])

    // Determine if we are generating media
    const isMediaMode = mode === 'image' || mode === 'video'
    if (isMediaMode) {
      setGeneratingMedia(true)
    } else {
      setIsThinking(true)
    }

    setReasoning('')
    setTokens(0)
    setTimeMs(0)
    setProvider('')
    setSteps([])
    const start = performance.now()

    try {
      let response: { content: string; reasoning?: string; tokens: number; provider: string; steps?: string[] }

      if (mode === 'image') {
        const imageUrl = await generateImage(text, file)
        response = {
          content: `![Generated Image](${imageUrl})`,
          reasoning: 'Image generated using AI',
          tokens: 0,
          provider: 'image',
        }
      } else if (mode === 'video') {
        const videoUrl = await generateVideo(text, file)
        response = {
          content: `<video src="${videoUrl}" controls style="max-width:100%;border-radius:12px;"></video>`,
          reasoning: 'Video generated using AI',
          tokens: 0,
          provider: 'video',
        }
      } else if (searchMode) {
        const results = await webSearch(text)
        const snippet = results.map(r => `- **${r.title}** (${r.source}): ${r.snippet}\n  [Link](${r.url})`).join('\n\n')
        response = {
          content: `**Search results for:** "${text}"\n\n${snippet}`,
          reasoning: `Found ${results.length} results`,
          tokens: 0,
          provider: 'search',
        }
      } else if (setuMode) {
        const leads = await runSETU(text)
        const leadList = leads.map(l => `- ${l.name || 'Unknown'} (${l.email || 'no email'}) - ${l.company || ''}`).join('\n')
        response = {
          content: `**🔍 SETU Lead Generation**\n\nFound ${leads.length} leads:\n${leadList}`,
          reasoning: `Generated ${leads.length} leads`,
          tokens: 0,
          provider: 'setu',
        }
      } else {
        const result = await sendMessage(text, { deep: deepThink })
        response = result
        if (response.reasoning) {
          const rawSteps = response.reasoning.split('\n').filter(s => s.trim().length > 10)
          setSteps(rawSteps)
          response.steps = rawSteps
        }
        setProvider(response.provider || '')
      }

      const elapsed = Math.round(performance.now() - start)
      setReasoning(response.reasoning || 'Processed')
      setTokens(response.tokens || 0)
      setTimeMs(elapsed)
      setProvider(response.provider || '')
      setIsThinking(false)
      setGeneratingMedia(false)

      const assistantMsg: Message = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        reasoning: response.reasoning,
        tokens: response.tokens,
        timeMs: elapsed,
        steps: response.steps,
        provider: response.provider,
        isMedia: isMediaMode,
      }
      setMessages(prev => [...prev, assistantMsg])
    } catch (error) {
      setIsThinking(false)
      setGeneratingMedia(false)
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        content: '⚠️ Something went wrong. Please try again.',
        timestamp: new Date(),
      }])
    }
  }

  const handleClear = async () => {
    await clearMemory()
    setMessages([])
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `👋 I'm **Siddhi**, your AI concierge. How can I help you today?`,
      timestamp: new Date(),
    }])
    setShowOnboarding(true)
  }

  if (!isMounted) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="text-white/40">Loading Siddhi...</div></div>
  }

  return (
    <div className="relative flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto px-2">
      <GradientGlowBackground isThinking={isThinking || isProcessing || generatingMedia} />

      {/* Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-white/5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md animate-pulse" />
            <Bot className="w-6 h-6 text-cyan-400 relative" />
          </div>
          <span className="text-white font-semibold text-sm md:text-base">Siddhi</span>
          <span className="text-[10px] text-green-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Online
          </span>
          {provider && (
            <span className="text-[8px] text-cyan-400/30 font-mono border border-cyan-500/10 px-1.5 py-0.5 rounded-full">
              {provider}
            </span>
          )}
        </div>
        <div className="flex gap-1 flex-wrap">
          <CyberToggle active={deepThink} onClick={() => setDeepThink(!deepThink)} icon={Brain} label="Deep" color="purple" />
          <CyberToggle active={searchMode} onClick={() => setSearchMode(!searchMode)} icon={Search} label="Search" color="blue" />
          <CyberToggle active={setuMode} onClick={() => setSetuMode(!setuMode)} icon={Users} label="SETU" color="amber" />
          <CyberToggle active={mode === 'image'} onClick={() => setMode(mode === 'image' ? 'chat' : 'image')} icon={ImageIcon} label="Image" color="pink" />
          <CyberToggle active={mode === 'video'} onClick={() => setMode(mode === 'video' ? 'chat' : 'video')} icon={Video} label="Video" color="red" />
        </div>
      </div>

      {/* Onboarding */}
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/5 border border-cyan-500/20 rounded-xl p-3 mb-2 text-xs text-white/60 flex items-center justify-between"
          >
            <span>💡 Tap <span className="text-cyan-400">Deep</span> for reasoning, <span className="text-amber-400">SETU</span> for leads, or just chat!</span>
            <button onClick={() => setShowOnboarding(false)} className="text-white/30 hover:text-white/70">✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-hide">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {msg.role === 'system' ? (
              <div className="flex justify-center my-2">
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2 text-xs text-cyan-400/80 font-mono max-w-[90%] backdrop-blur-sm">
                  {msg.content}
                </div>
              </div>
            ) : (
              <LuxuryMessage role={msg.role} timestamp={msg.timestamp}>
                <div dangerouslySetInnerHTML={{ __html: msg.content }} />
              </LuxuryMessage>
            )}
            {msg.role === 'assistant' && msg.reasoning && (
              <div className="ml-12 mt-1">
                <ThinkingTrace
                  reasoning={msg.reasoning}
                  tokens={msg.tokens}
                  timeMs={msg.timeMs}
                  status="done"
                  steps={msg.steps}
                  provider={msg.provider}
                />
              </div>
            )}
          </motion.div>
        ))}

        {/* Thinking Loader (for chat/deep/search/SETU) */}
        {isThinking && (
          <div className="ml-12 mt-2">
            <ThinkingLoader
              status="thinking"
              reasoning={reasoning}
              tokens={tokens}
              timeMs={timeMs}
              steps={steps}
              provider={provider}
            />
          </div>
        )}

        {/* Media Generation Loader (for image/video) */}
        {generatingMedia && (
          <div className="flex justify-center my-4">
            <MediaGenerationLoader type={mode === 'image' ? 'image' : 'video'} />
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input bar */}
      <div className="pt-2 border-t border-white/5">
        <NeonComposer
          onSend={handleSend}
          isLoading={isThinking || isProcessing || generatingMedia}
          mode={mode}
          onModeChange={setMode}
          isDeepThink={deepThink}
          setIsDeepThink={setDeepThink}
          isSetuMode={setuMode}
          setIsSetuMode={setSetuMode}
          isSearchMode={searchMode}
          setIsSearchMode={setSearchMode}
          onClear={handleClear}
        />
      </div>
    </div>
  )
}

// CyberToggle component (same as before)
function CyberToggle({ active, onClick, icon: Icon, label, color }: any) {
  const colors: any = {
    purple: 'active:bg-purple-600/30 active:text-purple-400 active:border-purple-500/30',
    blue: 'active:bg-blue-600/30 active:text-blue-400 active:border-blue-500/30',
    amber: 'active:bg-amber-600/30 active:text-amber-400 active:border-amber-500/30',
    pink: 'active:bg-pink-600/30 active:text-pink-400 active:border-pink-500/30',
    red: 'active:bg-red-600/30 active:text-red-400 active:border-red-500/30',
  }
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-all duration-200 ${active ? colors[color] + ' shadow-glow' : 'text-white/40 hover:text-white/70'}`}
      title={label}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}
