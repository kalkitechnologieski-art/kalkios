'use client'

import { useCallback } from 'react'

export interface ChatResult {
  text: string
  reasoning?: string | null
  tokens: number
}

export function useChat() {
  const sendMessage = useCallback(async (text: string, file?: File): Promise<ChatResult> => {
    try {
      // Build request body
      const body: any = { messages: [{ role: 'user', content: text }] }
      if (file) {
        // Convert file to base64
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        const base64 = buffer.toString('base64')
        const dataUrl = `data:${file.type};base64,${base64}`
        // For simplicity, we'll just send the text and note the file
        body.file = { name: file.name, type: file.type, size: file.size }
        body.fileData = dataUrl
      }

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error('Chat API failed')
      const data = await response.json()

      return {
        text: data.response || 'No response',
        reasoning: data.reasoning || null,
        tokens: data.usage?.total_tokens || 0,
      }
    } catch {
      return {
        text: "I'm processing your request. Please give me a moment.",
        reasoning: 'Fallback (API unavailable)',
        tokens: 0,
      }
    }
  }, [])

  return { sendMessage }
}
