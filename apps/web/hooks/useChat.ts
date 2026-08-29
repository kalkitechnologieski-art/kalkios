'use client'

import { useCallback } from 'react'

const FALLBACK_RESPONSES = [
  "I'm processing your request. Please give me a moment.",
  "Working on that for you. I'll be right back.",
  "Your query is being analyzed. I'll respond shortly.",
]

export interface ChatResult {
  text: string
  reasoning?: string
  tokens: number
  timeMs: number
  provider: string
}

export function useChat() {
  const sendMessage = useCallback(async (text: string, file?: File): Promise<ChatResult> => {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: text }],
        }),
      })
      if (!response.ok) throw new Error('Cloud API failed')
      const data = await response.json()
      return {
        text: data.response || 'No response received.',
        reasoning: `Processed via ${data.provider || 'cloud'} AI`,
        tokens: data.usage?.total_tokens || 0,
        timeMs: data.timeMs || 0,
        provider: data.provider || 'cloud',
      }
    } catch {
      // ✅ Ensure fallback is always a string
      const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)] || "I'm here to help. Please try again."
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
