import { useState, useCallback } from 'react'
import { chat, generateImage, generateVideo, webSearch, generateLeads, ChatMessage, ChatOptions, SearchResult, Lead } from '@/lib/ai'
import { SIDDHI_SYSTEM_PROMPT, DEEP_THINK_SYSTEM, SETU_SYSTEM } from '@/lib/ai/prompts'
import { buildMemoryContext } from '@/lib/ai/memory'

export function useChat() {
  const [isProcessing, setIsProcessing] = useState(false)

  const sendMessage = useCallback(async (
    text: string,
    options: { deep?: boolean; search?: boolean; image?: boolean; video?: boolean } = {}
  ): Promise<{ content: string; reasoning?: string; tokens: number; provider: string }> => {
    setIsProcessing(true)
    try {
      let systemPrompt = SIDDHI_SYSTEM_PROMPT
      if (options.deep) {
        systemPrompt = DEEP_THINK_SYSTEM + '\n' + systemPrompt
      }

      const baseMessages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ]

      // Build memory context if needed
      const messages = await buildMemoryContext(baseMessages, systemPrompt)

      const response = await chat(messages, {
        deep: options.deep || false,
        search: options.search || false,
        intent: options.image ? 'image' : options.video ? 'video' : 'chat'
      })
      return response
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const generateImageFromPrompt = useCallback(async (
    prompt: string,
    file?: File,
    options?: { size?: string; ratio?: string; negativePrompt?: string; steps?: number }
  ): Promise<string> => {
    setIsProcessing(true)
    try {
      return await generateImage({
        prompt,
        image: file,
        size: options?.size,
        ratio: options?.ratio,
        negativePrompt: options?.negativePrompt,
        steps: options?.steps,
      })
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const generateVideoFromPrompt = useCallback(async (
    prompt: string,
    file?: File,
    options?: { duration?: number; resolution?: string; motion?: number }
  ): Promise<string> => {
    setIsProcessing(true)
    try {
      return await generateVideo({
        prompt,
        image: file,
        duration: options?.duration,
        resolution: options?.resolution,
        motion: options?.motion,
      })
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const performWebSearch = useCallback(async (query: string): Promise<SearchResult[]> => {
    setIsProcessing(true)
    try {
      return await webSearch(query)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const runSETU = useCallback(async (query: string): Promise<Lead[]> => {
    setIsProcessing(true)
    try {
      return await generateLeads(query)
    } finally {
      setIsProcessing(false)
    }
  }, [])

  return {
    sendMessage,
    generateImage: generateImageFromPrompt,
    generateVideo: generateVideoFromPrompt,
    webSearch: performWebSearch,
    runSETU,
    isProcessing,
  }
}
