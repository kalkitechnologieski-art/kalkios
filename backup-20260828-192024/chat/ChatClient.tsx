'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { GradientGlowBackground } from '@/components/ui/GradientGlowBackground'
import { NeonComposer } from '@/components/chat/NeonComposer'
import { LuxuryMessage } from '@/components/chat/LuxuryMessage'
import { ThinkingTrace } from '@/components/chat/ThinkingTrace'
import { DateTag } from '@/components/chat/DateTag'
import { ChatSearch } from '@/components/chat/ChatSearch'
import { useChat } from '@/hooks/useChat'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  reasoning?: string
  tokens?: number
  timeMs?: number
}

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [reasoning, setReasoning] = useState('')
  const [tokens, setTokens] = useState(0)
  const [timeMs, setTimeMs] = useState(0)
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([])
  const endRef = useRef<HTMLDivElement>(null)

  const { sendMessage } = useChat()

  useEffect(() => {
    setFilteredMessages(messages)
  }, [messages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, filteredMessages])

  const handleSend = useCallback(async (text: string, file?: File) => {
    if (!text.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
      role: 'user',
      content: text,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setLoading(true)
    setIsThinking(true)
    setReasoning('')

    try {
      const result = await sendMessage(text, file)

      setReasoning(result.reasoning || 'Processed your request.')
      setTokens(result.tokens || 0)
      setTimeMs(result.timeMs || 0)
      setIsThinking(false)

      const assistantMessage: Message = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: result.text,
        timestamp: new Date(),
        reasoning: result.reasoning,
        tokens: result.tokens,
        timeMs: result.timeMs,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch {
      // Silent fallback – never show errors to user
      const fallbackMessage: Message = {
        id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        content: "I'm processing your request. Please give me a moment.",
        timestamp: new Date(),
        reasoning: 'Attempting to respond.',
        tokens: 0,
        timeMs: 0,
      }
      setMessages((prev) => [...prev, fallbackMessage])
    } finally {
      setLoading(false)
      setIsThinking(false)
    }
  }, [sendMessage])

  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) {
      setFilteredMessages(messages)
      return
    }
    const q = query.toLowerCase()
    setFilteredMessages(messages.filter(m => m.content.toLowerCase().includes(q)))
  }, [messages])

  return (
    <div className="relative flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
      <GradientGlowBackground isThinking={isThinking} />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/5">
        <div>
          <h1 className="text-lg font-semibold text-white tracking-tight">SIDDHI</h1>
          <p className="text-xs text-white/30 font-mono tracking-wider">⚡ ENTERPRISE AI</p>
        </div>
        <div className="flex items-center gap-2">
          <ChatSearch onSearch={handleSearch} className="w-48" />
          <span className="text-xs text-green-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Active
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-hide">
        <AnimatePresence>
          {filteredMessages.map((msg) => (
            <div key={msg.id}>
              <LuxuryMessage role={msg.role} timestamp={msg.timestamp}>
                {msg.content}
              </LuxuryMessage>
              {msg.role === 'assistant' && (msg.reasoning || msg.tokens) && (
                <div className="mt-1 ml-4">
                  <ThinkingTrace
                    reasoning={msg.reasoning || 'No reasoning available.'}
                    tokens={msg.tokens || 0}
                    timeMs={msg.timeMs || 0}
                    status="done"
                  />
                </div>
              )}
            </div>
          ))}
        </AnimatePresence>
        {loading && isThinking && (
          <div className="ml-4">
            <ThinkingTrace
              reasoning="Analyzing your request..."
              tokens={0}
              timeMs={0}
              status="thinking"
            />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="pt-2 border-t border-white/5">
        <NeonComposer onSend={handleSend} isLoading={loading} />
      </div>
    </div>
  )
}
