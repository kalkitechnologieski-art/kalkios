'use client'

import { useCallback } from 'react'
import { SLMService } from '@/lib/ai/webllm/loader'

interface ChatResult {
  text: string
  reasoning?: string
  tokens?: number
  timeMs?: number
  provider: string
}

// Fallback responses – never show errors
const FALLBACK_RESPONSES: string[] = [
  "I'm processing your request. Please give me a moment.",
  "Working on that for you. I'll be right back.",
  "Your query is being analyzed. I'll respond shortly.",
  "Let me think about that and get back to you.",
  "I'm here to help. Please hold on while I process your request.",
]

export function useChat() {
  const sendMessage = useCallback(async (text: string, file?: File): Promise<ChatResult> => {
    // 1. Try WebLLM if available
    if (SLMService.isLoaded()) {
      try {
        const result = await SLMService.reason(text)
        return {
          text: result.text || 'No response from local model.',
          reasoning: 'Processed using WebLLM (local model)',
          tokens: result.tokens || 0,
          timeMs: result.timeMs,
          provider: 'webllm',
        }
      } catch {
        // fall through to cloud
      }
    }

    // 2. Try cloud providers (Groq, OpenRouter, etc.)
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
          useSlm: false,
        }),
      })
      if (!response.ok) throw new Error('Cloud API failed')
      const data = await response.json()
      return {
        text: data.response || 'No response received from cloud.',
        reasoning: `Processed via ${data.provider || 'cloud'}`,
        tokens: data.usage?.total_tokens || 0,
        timeMs: 0,
        provider: data.provider || 'cloud',
      }
    } catch {
      // 3. Ultimate fallback – never throw
      const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)] || FALLBACK_RESPONSES[0] || 'I am processing your request. Please wait.'
      return {
        text: fallback,
        reasoning: 'Fallback response (service unavailable)',
        tokens: 0,
        timeMs: 0,
        provider: 'fallback',
      }
    }
  }, [])

  return { sendMessage }
}
