import { ChatMessage, ChatOptions, ChatResponse, SearchResult, ImageGenerationOptions, VideoGenerationOptions, Lead } from './types'
import { generateChat as agnesChat, generateImage as agnesImage, generateVideo as agnesVideo } from './agnes'
import { generateChat as zhipuChat, webSearch as zhipuWebSearch, generateImageZhipu, generateVideoZhipu, performOCR } from './zhipu'
import { generateChatGroq } from './groq'
import { generateChatOpenRouter } from './openrouter'
import { ensureString } from '@/lib/utils/string'
import { QuantumPendulum } from './quantum-pendulum'
import { deepThink, DeepThinkResult } from './deep-think'

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

// Shared quantum pendulum instance (per request we can create new one, but we'll pass it)
export async function chat(
  messages: ChatMessage[],
  options: ChatOptions & { intent?: string; pendulum?: QuantumPendulum } = {}
): Promise<ChatResponse> {
  const { intent = 'chat', deep = false, search = false, pendulum, ...rest } = options

  // If deep mode is enabled, use deepThink with questioning
  if (deep) {
    const result: DeepThinkResult = await deepThink(messages, { ...options, pendulum })
    if (result.questions && result.questions.length > 0) {
      // Return the questions as the response (the caller will handle)
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
    try {
      const lastMsg = messages[messages.length - 1]?.content || ''
      const results = await zhipuWebSearch(lastMsg)
      const snippet = results.map(r => `- ${r.title}: ${r.snippet}`).join('\n')
      return {
        content: `I found the following information:\n${snippet}\n\nFor more details, visit: ${results.map(r => r.url).join(', ')}`,
        tokens: 0,
        provider: 'zhipu-search',
      }
    } catch (error) {
      throw new Error(`Web search failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  // Default chat: try Agnes first, then Zhipu, then Groq, then OpenRouter
  // Use quantum pendulum to adjust parameters
  const pendulumInstance = pendulum || new QuantumPendulum()
  const lastQuery = messages.filter(m => m.role === 'user').pop()?.content || ''
  pendulumInstance.update(lastQuery)
  const params = pendulumInstance.getModelParams()

  try {
    const response = await agnesChat(messages, { ...rest, temperature: params.temperature })
    return response
  } catch (error) {
    try {
      const response = await zhipuChat(messages, { ...rest, deep: false, temperature: params.temperature })
      return response
    } catch (error2) {
      try {
        const response = await generateChatGroq(messages, { ...rest, temperature: params.temperature })
        return response
      } catch (error3) {
        return await generateChatOpenRouter(messages, { ...rest, temperature: params.temperature })
      }
    }
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

  try {
    return await agnesImage(opts)
  } catch (error) {
    try {
      return await generateImageZhipu(opts)
    } catch (error2) {
      throw new Error(`Image generation failed on all providers: ${error2 instanceof Error ? error2.message : String(error2)}`)
    }
  }
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

  try {
    return await agnesVideo(opts)
  } catch (error) {
    try {
      return await generateVideoZhipu(opts)
    } catch (error2) {
      throw new Error(`Video generation failed on all providers: ${error2 instanceof Error ? error2.message : String(error2)}`)
    }
  }
}

export async function webSearch(query: string): Promise<SearchResult[]> {
  return await zhipuWebSearch(query)
}

export async function ocr(file: File): Promise<string> {
  return await performOCR(file)
}

export async function generateLeads(query: string): Promise<Lead[]> {
  const results = await zhipuWebSearch(query)
  const prompt = `Extract contact information (name, email, company, phone, job title) from these search results. Return JSON array with objects: { name, email, company, phone, jobTitle }.\n\nSearch results:\n${results.map(r => `- ${r.title}: ${r.snippet}`).join('\n')}`

  const messages: ChatMessage[] = [
    { role: 'system', content: 'You are a data extraction assistant. Return only valid JSON.' },
    { role: 'user', content: prompt },
  ]

  try {
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
  } catch {
    return []
  }
}
