'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Bot, Shield, Cpu, Music } from 'lucide-react'
import { MultimodalInput, Attachment, MediaType } from '@/components/chat/MultimodalInput'
import { ThinkingPanel, ThinkingStep } from '@/components/chat/ThinkingPanel'
import { QuantumPendulum } from '@/lib/ai/quantum-pendulum'
import { logger } from '@/lib/utils/logger'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  attachments?: Attachment[]
  thinking?: ThinkingStep[]
  isStreaming?: boolean
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-cyan-500/10">
      <div className="flex gap-1">
        {[0, 200, 400].map((delay) => (
          <span
            key={delay}
            className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span className="text-cyan-400/40 text-xs font-mono tracking-wider animate-pulse">
        processing
      </span>
      <span className="text-cyan-400/20 text-xs font-mono">
        <Cpu className="w-3 h-3 inline animate-spin" />
      </span>
    </div>
  )
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-[85%] rounded-2xl px-4 py-3 relative
        ${isUser
          ? 'bg-gradient-to-r from-cyan-600/30 to-purple-600/30 border border-cyan-500/20 shadow-[0_0_30px_rgba(0,255,255,0.05)]'
          : 'bg-white/5 border border-white/10 backdrop-blur-sm'
        }
      `}>
        {!isUser && (
          <div className="absolute -top-2 -left-2 w-5 h-5 bg-cyan-600/20 rounded-full border border-cyan-500/30 flex items-center justify-center">
            <Bot className="w-3 h-3 text-cyan-400" />
          </div>
        )}
        <div className="text-sm font-mono leading-relaxed text-white/90 whitespace-pre-wrap">
          {message.content}
          {message.isStreaming && (
            <span className="inline-block w-1.5 h-4 bg-cyan-400 animate-pulse ml-0.5" />
          )}
        </div>
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att) => (
              <div key={att.id} className="relative">
                {att.type === 'image' && att.preview && (
                  <img src={att.preview} alt={att.name} className="w-16 h-16 object-cover rounded-lg" />
                )}
                {att.type === 'video' && (
                  <video src={att.url} className="w-16 h-16 object-cover rounded-lg" muted />
                )}
                {att.type === 'audio' && (
                  <div className="w-16 h-16 bg-cyan-500/10 rounded-lg flex items-center justify-center">
                    <Music className="w-6 h-6 text-cyan-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="text-[10px] text-cyan-400/20 mt-1 text-right font-mono">
          {message.timestamp.toLocaleTimeString()}
        </div>
        {!isUser && (
          <div className="absolute -bottom-1 -right-1 text-[8px] text-cyan-400/10 font-mono">
            ● encrypted
          </div>
        )}
      </div>
    </div>
  )
}

const STORAGE_KEY = 'kalki-chat-messages'

function loadMessages(): Message[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []
    const parsed = JSON.parse(data)
    return parsed.map((m: any) => ({
      ...m,
      timestamp: new Date(m.timestamp),
    }))
  } catch {
    return []
  }
}

function saveMessages(messages: Message[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = loadMessages()
    if (saved.length > 0) return saved
    return [{
      id: generateId(),
      role: 'assistant',
      content: '❖ SYSTEM ONLINE\n\nWelcome, operator. I am Siddhi, your quantum concierge. How may I elevate your business today?',
      timestamp: new Date(),
    }]
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [activeMode, setActiveMode] = useState<MediaType>('text')
  const [isThinkingExpanded, setIsThinkingExpanded] = useState(true)
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([])
  const [totalTokens, setTotalTokens] = useState(0)

  const pendulum = useState(() => new QuantumPendulum())[0]
  const endRef = useRef<HTMLDivElement>(null)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    saveMessages(messages)
  }, [messages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Voice recognition with real-time interim results
  const startVoiceRecognition = useCallback(() => {
    if (isListening) {
      // Stop if already listening
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      setIsListening(false)
      return
    }

    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) {
      alert('Voice input is not supported on this browser.')
      return
    }

    const recognition = new SR()
    recognition.lang = 'en-IN'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognitionRef.current = recognition

    recognition.onstart = () => {
      setIsListening(true)
      setVoiceTranscript('')
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = ''
      let isFinal = false
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result && result[0]) {
          transcript += result[0].transcript
          if (result.isFinal) {
            isFinal = true
          }
        }
      }
      setVoiceTranscript(transcript)
      
      // Auto-submit on final result with a short delay
      if (isFinal && transcript.trim()) {
        setTimeout(() => {
          // Submit the final transcript
          handleSend(transcript, [])
          setVoiceTranscript('')
        }, 300)
      }
    }

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      // If there's a partial transcript, submit it
      if (voiceTranscript.trim()) {
        handleSend(voiceTranscript, [])
        setVoiceTranscript('')
      }
    }

    recognition.start()
  }, [isListening, voiceTranscript])

  const handleSend = useCallback(async (text: string, attachments: Attachment[]) => {
    if (!text.trim() && attachments.length === 0) return

    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text || '📎 ' + attachments.map(a => a.name).join(', '),
      timestamp: new Date(),
    }
    if (attachments.length > 0) {
      userMsg.attachments = attachments
    }

    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    const steps: ThinkingStep[] = [
      { id: generateId(), type: 'reasoning', title: 'Analyzing Query', description: 'Parsing intent and context...', status: 'pending', timestamp: new Date() },
      { id: generateId(), type: 'analysis', title: 'Retrieving Knowledge', description: 'Accessing quantum memory...', status: 'pending', timestamp: new Date() },
      { id: generateId(), type: 'generation', title: 'Generating Response', description: 'Synthesizing optimal answer...', status: 'pending', timestamp: new Date() },
      { id: generateId(), type: 'verification', title: 'Verifying Output', description: 'Checking for coherence and accuracy...', status: 'pending', timestamp: new Date() },
    ]
    setThinkingSteps(steps)
    setIsThinkingExpanded(true)

    try {
      pendulum.update(text)
      const updateStep = (index: number, status: ThinkingStep['status']) => {
        setThinkingSteps(prev => prev.map((s, i) =>
          i === index ? { ...s, status, timestamp: new Date() } : s
        ))
      }

      updateStep(0, 'active')
      await new Promise(r => setTimeout(r, 300))
      updateStep(0, 'complete')

      updateStep(1, 'active')
      await new Promise(r => setTimeout(r, 400))
      updateStep(1, 'complete')

      updateStep(2, 'active')

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          pendulumState: pendulum.getState(),
          attachments: attachments.map(a => ({ name: a.name, type: a.type, size: a.size })),
        }),
      })

      const data = await response.json()
      const reply = data.response || 'Acknowledged. How can I assist further?'
      
      updateStep(2, 'complete')

      updateStep(3, 'active')
      await new Promise(r => setTimeout(r, 200))
      updateStep(3, 'complete')

      const assistantMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: reply,
        timestamp: new Date(),
        thinking: steps.map(s => ({ ...s, timestamp: new Date(s.timestamp) })),
      }
      setMessages(prev => [...prev, assistantMsg])
      setTotalTokens(data.usage?.total_tokens || 0)

    } catch (error) {
      logger.error('Chat error', error)
      const errorMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: '⚠️ ERROR: Quantum link disrupted. Please re-initialize connection.',
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
      setActiveMode('text')
    }
  }, [messages, pendulum])

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] bg-[#0A0A0F] relative">
      {/* Cyberpunk Header */}
      <div className="flex items-center gap-3 p-4 border-b border-cyan-500/20 flex-shrink-0">
        <div className="p-2 bg-cyan-600/20 rounded-full border border-cyan-500/30 shadow-[0_0_30px_rgba(0,255,255,0.1)]">
          <Bot className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent font-mono tracking-tight">
            SIDDHI
          </h1>
          <div className="flex items-center gap-2 text-xs text-cyan-400/40 font-mono">
            <span className="inline-block w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            QUANTUM ACTIVE
            <span className="text-cyan-400/20">|</span>
            <Cpu className="w-3 h-3" />
            <span className="text-cyan-400/20">|</span>
            {messages.length} messages
          </div>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs text-cyan-400/30 font-mono border border-cyan-500/10 px-2 py-1 rounded-full">
          <Shield className="w-3 h-3" />
          <span>SECURE</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={endRef} />
      </div>

      {/* Thinking Panel */}
      {thinkingSteps.length > 0 && (
        <div className="px-4 pb-2 flex-shrink-0">
          <ThinkingPanel
            steps={thinkingSteps}
            isExpanded={isThinkingExpanded}
            onToggle={() => setIsThinkingExpanded(!isThinkingExpanded)}
            isActive={isLoading}
            totalTokens={totalTokens}
          />
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-cyan-500/20 flex-shrink-0">
        <MultimodalInput
          onSend={handleSend}
          onMediaModeChange={setActiveMode}
          isLoading={isLoading}
          isListening={isListening}
          onVoiceToggle={startVoiceRecognition}
          activeMode={activeMode}
          placeholder={isListening ? '🎤 Listening...' : '>_ enter command...'}
          voiceTranscript={voiceTranscript}
          onVoiceTranscriptChange={setVoiceTranscript}
        />
      </div>
    </div>
  )
}
