'use client'

import { useCallback } from 'react'
import { generateChat } from '@/lib/ai/agnes'

const FALLBACK_RESPONSES = [
  "I'm processing your request. Please give me a moment.",
  "Working on that for you. I'll be right back.",
  "Your query is being analyzed. I'll respond shortly.",
]

export interface ChatResult {
  text: string
  reasoning?: string | null
  tokens: number
  timeMs: number
}

export function useChat() {
  const sendMessage = useCallback(async (text: string, file?: File): Promise<ChatResult> => {
    const startTime = performance.now()

    try {
      const result = await generateChat({
        messages: [{ role: 'user', content: text }],
        temperature: 0.7,
        maxTokens: 2000,
      })

      return {
        text: result.text || 'No response received.',
        reasoning: result.reasoning || null,
        tokens: result.tokens || 0,
        timeMs: performance.now() - startTime,
      }
    } catch (error) {
      console.warn('Chat error, using fallback:', error)
      const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)] ?? "I'm here to help. Please try again."
      return {
        text: fallback,
        reasoning: 'Fallback response (service unavailable)',
        tokens: 0,
        timeMs: performance.now() - startTime,
      }
    }
  }, [])

  return { sendMessage }
}
