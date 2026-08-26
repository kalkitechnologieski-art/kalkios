'use client'
'use client'
import { useState, useEffect, useRef } from 'react'
import { Send, Loader2, Mic, Bot } from 'lucide-react'
import { QuantumPendulum } from '@/lib/ai/quantum-pendulum'
import { logger } from '@/lib/utils/logger'

declare global { interface Window { webkitSpeechRecognition: any; SpeechRecognition: any } }

type Message = { role: 'user' | 'assistant'; content: string; timestamp: Date }

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: "Namaste! I'm Siddhi, your AI concierge. How can I elevate your business today?", timestamp: new Date() }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const pendulum = useState(() => new QuantumPendulum())[0]
  const endRef = useRef<HTMLDivElement>(null)
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const startVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { alert('Voice not supported.'); return }
    const rec = new SR()
    rec.lang = 'en-IN'
    rec.continuous = false
    rec.interimResults = false
    setIsListening(true)
    rec.start()
    rec.onresult = (e: any) => {
      const t = e.results[0][0].transcript
      setInput(t)
      setIsListening(false)
      setTimeout(() => { if (t) handleSend(t) }, 300)
    }
    rec.onerror = () => setIsListening(false)
  }

  const handleSend = async (override?: string) => {
    const text = override || input
    if (!text.trim() || loading) return
    const userMsg: Message = { role: 'user', content: text, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      pendulum.update(text)
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg], pendulumState: pendulum.getState() })
      })
      if (!res.ok) throw new Error('AI error')
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response || 'I received your message.', timestamp: new Date() }])
    } catch (e) {
      logger.error('Chat error', e)
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() }])
    } finally { setLoading(false) }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-600/20 rounded-full border border-purple-500/30"><Bot className="w-6 h-6 text-purple-400" /></div>
        <div><h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Siddhi — AI Concierge</h1><p className="text-xs text-white/30">Powered by Quantum Pendulum AI</p></div>
        <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/20">● Active</span>
      </div>
      <div className="flex-1 overflow-y-auto space-y-3 pr-2">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-gradient-to-r from-purple-600/30 to-blue-600/30 border border-purple-500/20 text-white' : 'bg-white/5 border border-white/10 text-white/90'}`}>
              {m.content}
              <div className="text-[10px] text-white/25 mt-1 text-right">{m.timestamp.toLocaleTimeString()}</div>
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin text-purple-400" /><span className="text-white/40 text-sm">Thinking...</span></div></div>}
        <div ref={endRef} />
      </div>
      <div className="mt-4 flex items-center gap-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-2">
        <button onClick={startVoice} className={`p-2 rounded-full transition ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'hover:bg-white/10 text-white/60'}`}><Mic className="w-5 h-5" /></button>
        <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Type your message..." className="flex-1 bg-transparent text-white placeholder-white/30 outline-none text-sm px-2" disabled={loading} />
        <button onClick={() => handleSend()} disabled={!input.trim() || loading} className="p-2.5 rounded-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition text-white"><Send className="w-5 h-5" /></button>
      </div>
    </div>
  )
}
