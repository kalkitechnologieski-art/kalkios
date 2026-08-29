import { ChatMessage, ChatOptions, ChatResponse, SearchResult, ImageGenerationOptions, VideoGenerationOptions, Lead } from './types'
import { generateChat as agnesChat, generateImage as agnesImage, generateVideo as agnesVideo } from './agnes'
import { generateChat as zhipuChat, webSearch as zhipuWebSearch, generateImageZhipu, generateVideoZhipu, performOCR } from './zhipu'
import { generateChatGroq } from './groq'
import { generateChatOpenRouter } from './openrouter'

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

export async function chat(
  messages: ChatMessage[],
  options: ChatOptions & { intent?: string } = {}
): Promise<ChatResponse> {
  const { intent = 'chat', deep = false, search = false, ...rest } = options

  if (search) {
    const lastMsg = messages[messages.length - 1]?.content || ''
    const results = await zhipuWebSearch(lastMsg)
    const snippet = results.map(r => `- ${r.title}: ${r.snippet}`).join('\n')
    return {
      content: `I found the following information:\n${snippet}\n\nFor more details, visit: ${results.map(r => r.url).join(', ')}`,
      tokens: 0,
      provider: 'zhipu-search',
    }
  }

  // Deep thinking: try Zhipu first
  if (deep) {
    try {
      return await zhipuChat(messages, { ...rest, deep: true })
    } catch (e) {
      try {
        return await agnesChat(messages, rest)
      } catch (e2) {
        try {
          return await generateChatGroq(messages, rest)
        } catch (e3) {
          return await generateChatOpenRouter(messages, rest)
        }
      }
    }
  }

  // Default chat: Agnes → Zhipu → Groq → OpenRouter
  try {
    return await agnesChat(messages, rest)
  } catch (e) {
    try {
      return await zhipuChat(messages, { ...rest, deep: false })
    } catch (e2) {
      try {
        return await generateChatGroq(messages, rest)
      } catch (e3) {
        return await generateChatOpenRouter(messages, rest)
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
  } catch (e) {
    try {
      return await generateImageZhipu(opts)
    } catch (e2) {
      // Ultimate fallback: a placeholder
      console.warn('All image providers failed, returning placeholder.')
      return `https://picsum.photos/seed/${Date.now()}/1024/768`
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
  } catch (e) {
    try {
      return await generateVideoZhipu(opts)
    } catch (e2) {
      // Ultimate fallback: a sample video
      console.warn('All video providers failed, returning sample video.')
      return 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4'
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
    const data = JSON.parse(response.content)
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
