'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Bot, Loader2 } from 'lucide-react'
import { LuxuryButton } from '@/components/ui/LuxuryButton'

const FAQ_DATA = [
  {
    id: 1,
    question: 'What is KALKI OS?',
    answer: 'KALKI OS is an AI-powered digital services marketplace that combines enterprise-grade AI, digital marketing, development, and cognitive solutions into one unified platform.'
  },
  {
    id: 2,
    question: 'How does Siddhi AI work?',
    answer: 'Siddhi is our quantum pendulum AI that understands your needs through conversation. It uses advanced reasoning to recommend the perfect service package for your business, adapting its thinking style to match your query.'
  },
  {
    id: 3,
    question: 'What services do you offer?',
    answer: 'We offer Enterprise SEO, AI Chatbot Development, E-commerce Websites, Predictive Analytics, Social Media Marketing, and Mobile App Development — all powered by cutting-edge AI.'
  },
  {
    id: 4,
    question: 'How long does delivery take?',
    answer: 'Most projects are delivered within 30‑60 days, depending on complexity. We provide regular updates and milestone tracking throughout the process.'
  },
  {
    id: 5,
    question: 'Do you provide ongoing support?',
    answer: 'Yes, we offer 24/7 support and maintenance plans for all our services. Our team is always ready to help you scale and optimize.'
  }
]

export function AIFAQChat() {
  const [messages, setMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
    { role: 'assistant', content: '👋 Hi! I\'m Siddhi. Ask me anything about our services.' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMsg = { role: 'user' as const, content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    // Find best matching FAQ
    const query = input.toLowerCase()
    const matched = FAQ_DATA.find(faq => 
      faq.question.toLowerCase().includes(query) || 
      query.includes(faq.question.toLowerCase().split(' ').slice(0, 2).join(' '))
    )

    let response = matched?.answer || 
      "I'm not sure about that specific question. Please check our FAQ or chat with our team directly."

    // Simulate thinking delay
    await new Promise(resolve => setTimeout(resolve, 800))

    setMessages(prev => [...prev, { role: 'assistant', content: response }])
    setLoading(false)
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
      <div className="p-4 border-b border-white/10 flex items-center gap-3">
        <div className="p-2 bg-cyan-500/10 rounded-full border border-cyan-500/20">
          <Bot className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h3 className="text-white font-mono text-sm font-bold">Ask Siddhi</h3>
          <p className="text-white/40 text-xs font-mono">Get instant answers about our services</p>
        </div>
        <span className="ml-auto text-[10px] text-green-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
          Online
        </span>
      </div>

      <div className="h-48 overflow-y-auto p-4 space-y-3 scrollbar-hide">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-cyan-500/20 text-white border border-cyan-500/20' 
                  : 'bg-white/5 text-white/90 border border-white/10'
              }`}>
                {msg.content}
              </div>
            </motion.div>
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                <span className="text-white/40 text-xs font-mono">thinking...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-white/10 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about our services..."
          className="flex-1 bg-black/40 border border-white/5 rounded-xl px-3 py-2 text-white placeholder-white/30 outline-none focus:border-cyan-500/30 transition text-sm"
          disabled={loading}
        />
        <LuxuryButton
          type="submit"
          variant="primary"
          size="sm"
          disabled={!input.trim() || loading}
          className="min-w-[60px]"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </LuxuryButton>
      </form>
    </div>
  )
}
