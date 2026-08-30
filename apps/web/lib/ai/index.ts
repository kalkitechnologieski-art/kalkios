import { ChatMessage, ChatOptions, ChatResponse, SearchResult, ImageGenerationOptions, VideoGenerationOptions, Lead } from './types'
import { generateChat as agnesChat, generateImage as agnesImage, generateVideo as agnesVideo } from './agnes'
import { generateChat as zhipuChat, webSearch as zhipuWebSearch, generateImageZhipu, generateVideoZhipu, performOCR } from './zhipu'
import { generateChatGroq } from './groq'
import { generateChatOpenRouter } from './openrouter'
import { ensureString } from '@/lib/utils/string'
import { QuantumPendulum } from './quantum-pendulum'
import { deepThink, DeepThinkResult } from './deep-think'
import { getAvailableProviders } from './check-env'

export * from './types'

// Helper to convert File to base64 string
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
  })
}

function isFile(value: any): value is File {
  return value && typeof value === 'object' && 'name' in value && 'size' in value && 'type' in value
}

function isBlob(value: any): value is Blob {
  return value && typeof value === 'object' && 'size' in value && 'type' in value && !('name' in value)
}

// Built‑in providers list
const providers = getAvailableProviders()

export async function chat(
  messages: ChatMessage[],
  options: ChatOptions & { intent?: string; pendulum?: QuantumPendulum } = {}
): Promise<ChatResponse> {
  const { intent = 'chat', deep = false, search = false, pendulum, ...rest } = options

  // Deep thinking mode
  if (deep) {
    const result: DeepThinkResult = await deepThink(messages, { ...options, pendulum })
    if (result.questions && result.questions.length > 0) {
      return {
        content: "I need some clarification:\n\n" + result.questions.map((q, i) => `${i+1}. ${q}`).join('\n'),
        reasoning: 'Asking clarifying questions',
        tokens: 0,
        provider: 'deep-think-question',
      }
    }
    return {
      content: result.finalAnswer,
      reasoning: result.reasoning,
      tokens: result.tokens,
      provider: result.provider,
    }
  }

  // Web Search mode
  if (search) {
    const lastMsg = messages[messages.length - 1]?.content || ''
    try {
      const results = await zhipuWebSearch(lastMsg)
      const snippet = results.map(r => `- ${r.title}: ${r.snippet}`).join('\n')
      return {
        content: `I found the following information:\n${snippet}\n\nFor more details, visit: ${results.map(r => r.url).join(', ')}`,
        tokens: 0,
        provider: 'zhipu-search',
      }
    } catch (error) {
      return {
        content: 'Search failed. Please try again with a different query.',
        reasoning: `Error: ${error instanceof Error ? error.message : 'Unknown'}`,
        tokens: 0,
        provider: 'search-error',
      }
    }
  }

  // Default chat: try providers in order
  const pendulumInstance = pendulum || new QuantumPendulum()
  const lastQuery = messages.filter(m => m.role === 'user').pop()?.content || ''
  pendulumInstance.update(lastQuery)
  const params = pendulumInstance.getModelParams()

  // Attempt each provider sequentially
  const errors: string[] = []

  // 1. Try Agnes (primary)
  if (process.env.AGNES_API_KEY) {
    try {
      const response = await agnesChat(messages, { ...rest, temperature: params.temperature })
      return response
    } catch (e) {
      errors.push(`Agnes: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // 2. Try Zhipu
  if (process.env.ZHIPU_API_KEY) {
    try {
      const response = await zhipuChat(messages, { ...rest, deep: false, temperature: params.temperature })
      return response
    } catch (e) {
      errors.push(`Zhipu: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // 3. Try Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await generateChatGroq(messages, { ...rest, temperature: params.temperature })
      return response
    } catch (e) {
      errors.push(`Groq: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // 4. Try OpenRouter
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const response = await generateChatOpenRouter(messages, { ...rest, temperature: params.temperature })
      return response
    } catch (e) {
      errors.push(`OpenRouter: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // All providers failed
  const errorMsg = errors.join('; ')
  return {
    content: `⚠️ I encountered an issue: ${errorMsg || 'No AI provider available.'} Please check your API keys and try again.`,
    reasoning: `All providers failed: ${errorMsg}`,
    tokens: 0,
    provider: 'error',
  }
}

export async function generateImage(options: ImageGenerationOptions & { image?: string | File }): Promise<string> {
  let imageData = options.image
  if (isFile(imageData)) {
    imageData = await fileToBase64(imageData)
  } else if (isBlob(imageData)) {
    const file = new File([imageData], 'image.png', { type: imageData.type })
    imageData = await fileToBase64(file)
  }
  const opts: ImageGenerationOptions = {
    ...options,
    image: imageData as string | undefined,
  }

  // Try Agnes first
  if (process.env.AGNES_API_KEY) {
    try {
      return await agnesImage(opts)
    } catch (e) {
      console.warn('Agnes image failed:', e)
    }
  }

  // Fallback to Zhipu
  if (process.env.ZHIPU_API_KEY) {
    try {
      return await generateImageZhipu(opts)
    } catch (e) {
      console.warn('Zhipu image failed:', e)
    }
  }

  throw new Error('No image provider available. Please set AGNES_API_KEY or ZHIPU_API_KEY.')
}

export async function generateVideo(options: VideoGenerationOptions & { image?: string | File }): Promise<string> {
  let imageData = options.image
  if (isFile(imageData)) {
    imageData = await fileToBase64(imageData)
  } else if (isBlob(imageData)) {
    const file = new File([imageData], 'video.png', { type: imageData.type })
    imageData = await fileToBase64(file)
  }
  const opts: VideoGenerationOptions = {
    ...options,
    image: imageData as string | undefined,
  }

  // Try Agnes first
  if (process.env.AGNES_API_KEY) {
    try {
      return await agnesVideo(opts)
    } catch (e) {
      console.warn('Agnes video failed:', e)
    }
  }

  // Fallback to Zhipu
  if (process.env.ZHIPU_API_KEY) {
    try {
      return await generateVideoZhipu(opts)
    } catch (e) {
      console.warn('Zhipu video failed:', e)
    }
  }

  throw new Error('No video provider available. Please set AGNES_API_KEY or ZHIPU_API_KEY.')
}

export async function webSearch(query: string): Promise<SearchResult[]> {
  if (!process.env.ZHIPU_API_KEY) {
    throw new Error('ZHIPU_API_KEY is not set. Web search requires Zhipu.')
  }
  return await zhipuWebSearch(query)
}

export async function ocr(file: File): Promise<string> {
  if (!process.env.ZHIPU_API_KEY) {
    throw new Error('ZHIPU_API_KEY is not set. OCR requires Zhipu.')
  }
  return await performOCR(file)
}

export async function generateLeads(query: string): Promise<Lead[]> {
  if (!process.env.ZHIPU_API_KEY) {
    console.warn('ZHIPU_API_KEY not set, returning empty leads.')
    return []
  }
  try {
    const results = await zhipuWebSearch(query)
    const prompt = `Extract contact information (name, email, company, phone, job title) from these search results. Return JSON array with objects: { name, email, company, phone, jobTitle }.\n\nSearch results:\n${results.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}`

    const messages: ChatMessage[] = [
      { role: 'system', content: 'You are a data extraction assistant. Return only valid JSON.' },
      { role: 'user', content: prompt },
    ]

    const response = await chat(messages, { intent: 'deep', deep: true })
    const data = JSON.parse(ensureString(response.content, '[]'))
    const leads: Lead[] = data.map((item: any) => ({
      name: item.name || null,
      email: item.email || null,
      phone: item.phone || null,
      company: item.company || null,
      jobTitle: item.jobTitle || null,
      linkedinUrl: item.linkedinUrl || null,
      twitterUrl: item.twitterUrl || null,
      city: item.city || null,
      country: item.country || null,
      verified: false,
      confidence: 0.7,
      source: 'zhipu-web-search',
    }))
    return leads
  } catch (error) {
    console.error('Lead generation error:', error)
    return []
  }
}
