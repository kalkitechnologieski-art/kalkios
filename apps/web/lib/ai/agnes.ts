/**
 * Agnes AI – Enterprise Image & Video Generation
 * Documentation: https://apihub.agnes-ai.com/v1
 * Models:
 *   - agnes-image-2.1-flash: Image generation & editing
 *   - agnes-video-v2.0: Video generation (async)
 *   - agnes-2.5-flash: Chat & reasoning
 *
 * Fallback models:
 *   - Zhipu GLM-Image (image generation)
 *   - Groq (chat/reasoning)
 */

const AGNES_API_URL = 'https://apihub.agnes-ai.com/v1'
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4'

// ── Model catalogs ──
export const AGNES_MODELS = {
  chat: ['agnes-2.5-flash', 'agnes-2.0-flash'],
  image: ['agnes-image-2.1-flash', 'agnes-image-2.0-flash'],
  video: ['agnes-video-v2.0', 'agnes-video-2.5-flash'],
}

export interface ChatOptions {
  messages: Array<{ role: string; content: string }>
  temperature?: number
  maxTokens?: number
}

export interface ImageOptions {
  prompt: string
  image?: string // base64 or URL
  resolution?: '1K' | '2K' | '4K'
  negativePrompt?: string
  steps?: number
}

export interface VideoOptions {
  prompt: string
  image?: string // base64 or URL
  duration?: 3 | 5 | 10 | 18
  resolution?: '480p' | '720p' | '1080p'
  motion?: 1 | 2 | 3 | 4 | 5
}

export interface ChatResult {
  text: string
  reasoning?: string | null
  tokens?: number
}

export interface GenerationResult {
  url: string
  provider: string
}

// ── Helper: fetch with timeout ──
async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs: number = 30000): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...options, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timeout)
  }
}

// ── Helper: safe JSON parse ──
function safeJsonParse<T>(data: unknown): T {
  if (typeof data === 'string') {
    try { return JSON.parse(data) as T } catch { return {} as T }
  }
  return data as T
}

// ── CHAT: Primary Agnes + Fallback Groq ──
export async function generateChat(options: ChatOptions): Promise<ChatResult> {
  const errors: string[] = []

  // Try Agnes first
  if (process.env.AGNES_API_KEY) {
    for (const model of AGNES_MODELS.chat) {
      try {
        const response = await fetchWithTimeout(
          `${AGNES_API_URL}/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.AGNES_API_KEY}`,
            },
            body: JSON.stringify({
              model,
              messages: options.messages,
              temperature: options.temperature || 0.7,
              max_tokens: options.maxTokens || 2000,
            }),
          },
          30000
        )

        if (response.ok) {
          const data = await response.json()
          return {
            text: data.choices?.[0]?.message?.content || 'No response',
            reasoning: data.choices?.[0]?.message?.reasoning || null,
            tokens: data.usage?.total_tokens || 0,
          }
        }
        errors.push(`Agnes ${model}: ${response.status}`)
      } catch (e) {
        errors.push(`Agnes ${model}: ${e instanceof Error ? e.message : 'unknown error'}`)
      }
    }
  }

  // Fallback: Groq
  if (process.env.GROQ_API_KEY) {
    try {
      const response = await fetchWithTimeout(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: options.messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 2000,
          }),
        },
        30000
      )

      if (response.ok) {
        const data = await response.json()
        return {
          text: data.choices?.[0]?.message?.content || 'No response',
          reasoning: 'Processed via Groq (fallback)',
          tokens: data.usage?.total_tokens || 0,
        }
      }
      errors.push(`Groq: ${response.status}`)
    } catch (e) {
      errors.push(`Groq: ${e instanceof Error ? e.message : 'unknown error'}`)
    }
  }

  // Ultimate fallback
  return {
    text: "I'm processing your request. Please give me a moment.",
    reasoning: 'All providers failed: ' + errors.join(', '),
    tokens: 0,
  }
}

// ── IMAGE: Primary Agnes + Fallback Zhipu GLM-Image ──
export async function generateImage(options: ImageOptions): Promise<GenerationResult> {
  const errors: string[] = []

  // Try Agnes first
  if (process.env.AGNES_API_KEY) {
    for (const model of AGNES_MODELS.image) {
      try {
        const body: Record<string, unknown> = {
          model,
          prompt: options.prompt,
          resolution: options.resolution || '1K',
          negative_prompt: options.negativePrompt || '',
          steps: options.steps || 30,
        }
        if (options.image) {
          body.image = options.image
        }

        const response = await fetchWithTimeout(
          `${AGNES_API_URL}/images/generations`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.AGNES_API_KEY}`,
            },
            body: JSON.stringify(body),
          },
          60000
        )

        if (response.ok) {
          const data = await response.json()
          const url = data.data?.[0]?.url || data.url
          if (url) {
            return { url, provider: `agnes-${model}` }
          }
        }
        errors.push(`Agnes ${model}: ${response.status}`)
      } catch (e) {
        errors.push(`Agnes ${model}: ${e instanceof Error ? e.message : 'unknown error'}`)
      }
    }
  }

  // Fallback: Zhipu GLM-Image
  if (process.env.ZHIPU_API_KEY) {
    try {
      const response = await fetchWithTimeout(
        `${ZHIPU_API_URL}/generations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'glm-image',
            prompt: options.prompt,
            size: options.resolution === '4K' ? '2048x2048' : '1024x1024',
          }),
        },
        60000
      )

      if (response.ok) {
        const data = await response.json()
        const url = data.output?.url || data.data?.[0]?.url
        if (url) {
          return { url, provider: 'zhipu-glm-image' }
        }
      }
      errors.push(`Zhipu GLM-Image: ${response.status}`)
    } catch (e) {
      errors.push(`Zhipu GLM-Image: ${e instanceof Error ? e.message : 'unknown error'}`)
    }
  }

  // Ultimate fallback: placeholder
  return {
    url: `https://picsum.photos/seed/${Date.now()}/1024/768`,
    provider: 'fallback',
  }
}

// ── VIDEO: Primary Agnes (async) ──
export async function generateVideo(options: VideoOptions): Promise<GenerationResult> {
  const errors: string[] = []

  // Try Agnes video
  if (process.env.AGNES_API_KEY) {
    for (const model of AGNES_MODELS.video) {
      try {
        const body: Record<string, unknown> = {
          model,
          prompt: options.prompt,
          duration: options.duration || 5,
          resolution: options.resolution || '720p',
          motion: options.motion || 3,
        }
        if (options.image) {
          body.image = options.image
        }

        const response = await fetchWithTimeout(
          `${AGNES_API_URL}/videos`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.AGNES_API_KEY}`,
            },
            body: JSON.stringify(body),
          },
          60000
        )

        if (response.ok) {
          const data = await response.json()
          // Video is async — poll for result
          const videoId = data.id || data.video_id
          if (videoId) {
            const result = await pollVideoResult(videoId)
            if (result) {
              return { url: result, provider: `agnes-${model}` }
            }
          }
          // Direct URL if available
          const url = data.url || data.data?.url
          if (url) {
            return { url, provider: `agnes-${model}` }
          }
        }
        errors.push(`Agnes ${model}: ${response.status}`)
      } catch (e) {
        errors.push(`Agnes ${model}: ${e instanceof Error ? e.message : 'unknown error'}`)
      }
    }
  }

  // Fallback: placeholder video
  return {
    url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    provider: 'fallback',
  }
}

// ── Poll video result ──
async function pollVideoResult(videoId: string, maxAttempts: number = 30, delayMs: number = 2000): Promise<string | null> {
  if (!process.env.AGNES_API_KEY) return null

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(
        `${AGNES_API_URL}/videos/${videoId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.AGNES_API_KEY}`,
          },
        },
        10000
      )

      if (response.ok) {
        const data = await response.json()
        if (data.status === 'completed' && data.url) {
          return data.url
        }
        if (data.status === 'failed') {
          return null
        }
      }
    } catch {
      // Continue polling
    }
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  return null
}

// ── Legacy exports for backward compatibility ──
export async function generateImageLegacy(options: ImageOptions) {
  const result = await generateImage(options)
  return { data: [{ url: result.url }] }
}

export async function generateVideoLegacy(options: VideoOptions) {
  const result = await generateVideo(options)
  return { data: { url: result.url } }
}
