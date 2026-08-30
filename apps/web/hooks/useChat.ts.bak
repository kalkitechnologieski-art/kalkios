import { useState, useCallback } from 'react'
import { chat, generateImage, generateVideo, webSearch, generateLeads, ChatMessage, SearchResult, Lead } from '@/lib/ai'
import { SIDDHI_SYSTEM_PROMPT, DEEP_THINK_SYSTEM } from '@/lib/ai/prompts'
import { buildMemoryContext } from '@/lib/ai/memory'
import { ensureString } from '@/lib/utils/string'
import { QuantumPendulum } from '@/lib/ai/quantum-pendulum'
import { PromptEnhancer } from '@/lib/ai/prompt-enhancer'
import { MultimodalRAG, FileAttachment } from '@/lib/ai/multimodal-rag'
import { ContextManager } from '@/lib/ai/context-manager'
import { SocraticDeepen } from '@/lib/ai/socratic-deepen'
import { AdvancedSearch } from '@/lib/ai/advanced-search'
import { MediaWorkflow } from '@/lib/ai/media-workflow'

export function useChat() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [pendingQuestions, setPendingQuestions] = useState<string[]>([])
  const contextManager = ContextManager.getInstance()

  const sendMessage = useCallback(async (
    text: string,
    options: { 
      deep?: boolean
      search?: boolean
      image?: boolean
      video?: boolean
      files?: File[]
      onQuestion?: (questions: string[]) => void
    } = {}
  ): Promise<{ content: string; reasoning?: string; tokens: number; provider: string }> => {
    setIsProcessing(true)
    try {
      // 1. Process files
      let attachments: FileAttachment[] = []
      if (options.files && options.files.length > 0) {
        const rag = MultimodalRAG.getInstance()
        attachments = await rag.processMultiple(options.files)
      }

      // 2. Update context
      contextManager.update({ role: 'user', content: text }, attachments)

      // 3. Enhance prompt
      const enhancer = PromptEnhancer.getInstance()
      const mode = options.image ? 'image' : options.video ? 'video' : options.search ? 'search' : 'chat'
      const enhanced = await enhancer.enhance(text, mode)

      // 4. Build system prompt with context
      const contextStr = contextManager.getContext()
      const systemPrompt = `${SIDDHI_SYSTEM_PROMPT}\n\n## Current Context\n${contextStr}`

      // 5. Special modes
      if (options.image && attachments.length > 0) {
        const mediaWorkflow = new MediaWorkflow()
        const url = await mediaWorkflow.imageToImage(enhanced.enhanced, attachments[0]!)
        return { content: `![Generated Image](${url})`, reasoning: 'Image generated from reference', tokens: 0, provider: 'media' }
      }
      if (options.video && attachments.length > 0) {
        const mediaWorkflow = new MediaWorkflow()
        const url = await mediaWorkflow.imageToVideo(enhanced.enhanced, attachments[0]!)
        return { content: `<video src="${url}" controls style="max-width:100%;border-radius:12px;" />`, reasoning: 'Video generated from image', tokens: 0, provider: 'media' }
      }
      if (options.search) {
        const advSearch = AdvancedSearch.getInstance()
        const result = await advSearch.searchWithAI(text)
        return { content: result.synthesis, reasoning: `Synthesized from ${result.results.length} sources`, tokens: 0, provider: 'search' }
      }

      // 6. Deep mode with Socratic
      if (options.deep) {
        const socratic = SocraticDeepen.getInstance()
        const questions = await socratic.generateQuestions(text, 3)
        if (questions.length > 0 && options.onQuestion) {
          options.onQuestion(questions.map(q => q.question))
        }
        // We'll still call AI with enhanced prompt
      }

      // 7. Standard chat with enhanced prompt
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: enhanced.enhanced }
      ]

      if (attachments.length > 0) {
        const rag = MultimodalRAG.getInstance()
        const attachmentContext = rag.buildContextFromAttachments(attachments)
        messages.push({ role: 'system', content: `## Attachments\n${attachmentContext}` })
      }

      const pendulum = new QuantumPendulum()
      const response = await chat(messages, {
        deep: options.deep || false,
        search: options.search || false,
        intent: options.image ? 'image' : options.video ? 'video' : 'chat',
        pendulum,
      })

      contextManager.update({ role: 'assistant', content: response.content })

      return {
        content: ensureString(response.content, 'No response received.'),
        reasoning: ensureString(response.reasoning, ''),
        tokens: typeof response.tokens === 'number' ? response.tokens : 0,
        provider: ensureString(response.provider, 'unknown'),
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      return {
        content: '⚠️ I encountered an issue. Please try again.',
        reasoning: 'Service temporarily unavailable.',
        tokens: 0,
        provider: 'error',
      }
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
      return await generateImage({ prompt, image: file, ...options })
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
      return await generateVideo({ prompt, image: file, ...options })
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const performWebSearch = useCallback(async (query: string): Promise<SearchResult[]> => {
    setIsProcessing(true)
    try {
      const advSearch = AdvancedSearch.getInstance()
      const results = await advSearch.search(query)
      return results
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
