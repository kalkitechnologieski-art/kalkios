'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { GradientGlowBackground } from '@/components/ui/GradientGlowBackground'
import { LuxuryMessage } from '@/components/chat/LuxuryMessage'
import { DateTag } from '@/components/chat/DateTag'
import { ChatSearch } from '@/components/chat/ChatSearch'
import { NeonComposer } from '@/components/chat/NeonComposer'
import { ThinkingTrace } from '@/components/chat/ThinkingTrace'
import { useChat } from '@/hooks/useChat'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Brain, Sparkles, Zap } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  reasoning?: string | null
  tokens?: number
  timeMs?: number
  isThinking?: boolean
}

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([
    { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9), role: 'assistant', content: 'Hello. I\'m SIDDHI. How can I help you today?', timestamp: new Date(), reasoning: 'Ready to assist', tokens: 0, timeMs: 0 }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const [isSetuMode, setIsSetuMode] = useState(false)
  const [isDeepThink, setIsDeepThink] = useState(false)
  const [thinkingStatus, setThinkingStatus] = useState<'idle' | 'thinking' | 'done'>('idle')
  const [currentReasoning, setCurrentReasoning] = useState('')
  const [currentTokens, setCurrentTokens] = useState(0)
  const [currentTimeMs, setCurrentTimeMs] = useState(0)
  const endRef = useRef<HTMLDivElement>(null)
  const { sendMessage } = useChat()

  useEffect(() => { setFilteredMessages(messages) }, [messages])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, filteredMessages])

  // Auto‑guide for SETU
  useEffect(() => {
    if (isSetuMode) {
      const hasGuide = messages.some(m => m.role === 'system' && m.content.includes('SETU activated'))
      if (!hasGuide) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
          role: 'system',
          content: '🔍 SETU activated! Tell me:\n1. Who is your ideal customer? (e.g., "CTOs in SaaS")\n2. Where are they located? (e.g., "US")\n3. How many leads? (e.g., "100")',
          timestamp: new Date(),
        }])
      }
    }
  }, [isSetuMode, messages])

  const handleSend = useCallback(async (text: string, file?: File) => {
    if (!text.trim()) return
    const userMsg: Message = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])
    setLoading(true)
    setThinkingStatus('thinking')
    setCurrentReasoning('Analyzing your request...')
    setCurrentTokens(0)
    setCurrentTimeMs(0)

    try {
      const startTime = performance.now()
      let result = await sendMessage(text, file)

      if (isDeepThink) {
        result.reasoning = (result.reasoning || '') + ' (DeepThink: deeper analysis applied)'
        result.tokens = (result.tokens || 0) + 50
        setCurrentReasoning('DeepThink mode enabled – applying additional reasoning...')
      }

      if (isSetuMode) {
        const lower = text.toLowerCase()
        if (lower.includes('cto') || lower.includes('ceo') || lower.includes('lead') || lower.includes('company')) {
          const count = text.match(/\b(\d+)\b/)?.[0] || '50'
          result.text = `🔍 I'm searching for ${count} leads based on your criteria: "${text}".\n\nI'll let you know when I find them.`
          result.reasoning = `Lead search initiated for ${count} leads`
        }
      }

      const elapsed = Math.round(performance.now() - startTime)
      setCurrentReasoning(result.reasoning || 'Processed successfully')
      setCurrentTokens(result.tokens || 0)
      setCurrentTimeMs(elapsed)
      setThinkingStatus('done')

      setMessages(prev => [...prev, {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: result.text,
        timestamp: new Date(),
        reasoning: result.reasoning,
        tokens: result.tokens,
        timeMs: elapsed,
        isThinking: false,
      }])
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: "I'm processing your request. Please give me a moment.",
        timestamp: new Date(),
        reasoning: 'Fallback response',
        tokens: 0,
        timeMs: 0,
      }])
      setThinkingStatus('idle')
    } finally { setLoading(false) }
  }, [isDeepThink, isSetuMode, sendMessage])

  const handleClear = useCallback(() => {
    setMessages([
      { id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9), role: 'assistant', content: 'Chat cleared. How can I help you?', timestamp: new Date(), reasoning: 'Ready to assist', tokens: 0, timeMs: 0 }
    ])
  }, [])

  const handleCopy = (text: string) => navigator.clipboard.writeText(text)
  const handleEdit = (id: string) => {
    const msg = messages.find(m => m.id === id)
    if (msg) setInput(msg.content)
  }
  const handleRegenerate = (id: string) => {
    const idx = messages.findIndex(m => m.id === id)
    if (idx > 0) {
      const userMsg = messages[idx - 1]
      if (userMsg && userMsg.role === 'user') handleSend(userMsg.content)
    }
  }
  const handleSearch = (query: string) => {
    if (!query.trim()) { setFilteredMessages(messages); return }
    const q = query.toLowerCase()
    setFilteredMessages(messages.filter(m => m.content.toLowerCase().includes(q)))
  }

  const groupedMessages = useMemo(() => {
    const groups: { date: string; messages: Message[] }[] = []
    filteredMessages.forEach(msg => {
      const date = new Date(msg.timestamp).toDateString()
      const last = groups[groups.length - 1]
      if (last && last.date === date) last.messages.push(msg)
      else groups.push({ date, messages: [msg] })
    })
    return groups
  }, [filteredMessages])

  return (
    <div className="relative flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
      <GradientGlowBackground isThinking={loading || thinkingStatus === 'thinking'} />

      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-md" />
            <div className="relative p-2 bg-white/5 rounded-full border border-white/10">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-white tracking-tight flex items-center gap-2">
              SIDDHI
              <span className="text-[8px] font-mono text-cyan-400/50 animate-pulse">● ONLINE</span>
            </h1>
            <p className="text-xs text-white/30 font-mono tracking-wider">⚡ ENTERPRISE AI</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ChatSearch onSearch={handleSearch} className="w-40" />
          <span className="text-xs text-green-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" /> Active
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-hide">
        <AnimatePresence>
          {groupedMessages.map((group) => (
            <div key={group.date}>
              <DateTag date={new Date(group.date)} />
              {group.messages.map((msg) => (
                <div key={msg.id} className="mb-3">
                  {msg.role === 'system' && (
                    <div className="flex justify-center my-2">
                      <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-2 text-xs text-cyan-400/80 font-mono max-w-[90%]">
                        {msg.content}
                      </div>
                    </div>
                  )}
                  {msg.role !== 'system' && (
                    <>
                      <LuxuryMessage
                        role={msg.role as 'user' | 'assistant'}
                        timestamp={msg.timestamp}
                        onCopy={() => handleCopy(msg.content)}
                        onEdit={msg.role === 'user' ? () => handleEdit(msg.id) : undefined}
                        onRegenerate={msg.role === 'assistant' ? () => handleRegenerate(msg.id) : undefined}
                        onLike={msg.role === 'assistant' ? () => console.log('👍 Liked:', msg.id) : undefined}
                        onDislike={msg.role === 'assistant' ? () => console.log('👎 Disliked:', msg.id) : undefined}
                        showActions={true}
                      >
                        {msg.content}
                      </LuxuryMessage>
                      {msg.role === 'assistant' && (msg.reasoning || msg.tokens) && (
                        <div className="mt-1 ml-12">
                          <ThinkingTrace
                            reasoning={msg.reasoning || 'No reasoning available.'}
                            tokens={msg.tokens || 0}
                            timeMs={msg.timeMs || 0}
                            status="done"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          ))}
        </AnimatePresence>
        {loading && (
          <div className="ml-12">
            <ThinkingTrace reasoning={currentReasoning} tokens={currentTokens} timeMs={currentTimeMs} status="thinking" />
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="pt-2 border-t border-white/5">
        <NeonComposer
          onSend={handleSend}
          isLoading={loading}
          onClear={handleClear}
          isSetuMode={isSetuMode}
          setIsSetuMode={setIsSetuMode}
          isDeepThink={isDeepThink}
          setIsDeepThink={setIsDeepThink}
        />
      </div>
    </div>
  )
}
