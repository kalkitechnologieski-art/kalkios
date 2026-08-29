/**
 * Agnes AI – Enterprise Multi‑Provider Service
 * Base URL: https://apihub.agnes-ai.com/v1
 *
 * Model Fallback Chain:
 *   Chat:    Agnes-2.5-Flash → Agnes-2.0-Flash → Groq → Fallback
 *   Image:   Agnes-Image-2.1 → Agnes-Image-2.0 → Zhipu GLM-Image → Placeholder
 *   Video:   Agnes-Video-2.0 → Agnes-Video-2.5 → Placeholder
 */

const AGNES_BASE_URL = 'https://apihub.agnes-ai.com/v1'
const ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4'

// ── Types ──
export interface ChatOptions {
  messages: Array<{ role: string; content: string }>
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ImageOptions {
  prompt: string
  image?: string          // base64 or URL
  size?: '1K' | '2K' | '3K' | '4K'
  ratio?: '1:1' | '3:4' | '4:3' | '16:9' | '9:16' | '2:3' | '3:2' | '21:9'
  negativePrompt?: string
  steps?: number
}

export interface VideoOptions {
  prompt: string
  image?: string
  duration?: 3 | 5 | 10 | 18
  resolution?: '480p' | '720p' | '1080p'
  motion?: 1 | 2 | 3 | 4 | 5
  numFrames?: number
  frameRate?: number
}

export interface ChatResult {
  text: string
  reasoning?: string | null
  tokens: number
}

export interface GenerationResult {
  url: string
  provider: string
}

// ── Helpers ──
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs = 60000
): Promise<Response> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...options, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

function getAgnesKey(): string {
  return process.env.AGNES_API_KEY || ''
}

function getGroqKey(): string {
  return process.env.GROQ_API_KEY || ''
}

function getZhipuKey(): string {
  return process.env.ZHIPU_API_KEY || ''
}

// ── 1. Chat ──
export async function generateChat(options: ChatOptions): Promise<ChatResult> {
  const agnesKey = getAgnesKey()
  const groqKey = getGroqKey()
  const errors: string[] = []

  // 1. Try Agnes
  if (agnesKey) {
    for (const model of ['agnes-2.5-flash', 'agnes-2.0-flash']) {
      try {
        const resp = await fetchWithTimeout(
          `${AGNES_BASE_URL}/chat/completions`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${agnesKey}`,
            },
            body: JSON.stringify({
              model,
              messages: options.messages,
              temperature: options.temperature ?? 0.7,
              max_tokens: options.maxTokens ?? 2000,
            }),
          },
          30000
        )

        if (resp.ok) {
          const data = await resp.json()
          return {
            text: data.choices?.[0]?.message?.content || 'No response',
            reasoning: data.choices?.[0]?.message?.reasoning || null,
            tokens: data.usage?.total_tokens || 0,
          }
        }
        errors.push(`Agnes ${model}: ${resp.status}`)
      } catch (e) {
        errors.push(`Agnes ${model}: ${e instanceof Error ? e.message : 'unknown'}`)
      }
    }
  }

  // 2. Try Groq (fallback)
  if (groqKey) {
    try {
      const resp = await fetchWithTimeout(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: options.messages,
            temperature: options.temperature ?? 0.7,
            max_tokens: options.maxTokens ?? 2000,
          }),
        },
        30000
      )

      if (resp.ok) {
        const data = await resp.json()
        return {
          text: data.choices?.[0]?.message?.content || 'No response',
          reasoning: 'Processed via Groq (fallback)',
          tokens: data.usage?.total_tokens || 0,
        }
      }
      errors.push(`Groq: ${resp.status}`)
    } catch (e) {
      errors.push(`Groq: ${e instanceof Error ? e.message : 'unknown'}`)
    }
  }

  // 3. Ultimate fallback
  return {
    text: "I'm processing your request. Please give me a moment.",
    reasoning: `All providers failed: ${errors.join(', ')}`,
    tokens: 0,
  }
}

// ── 2. Image ──
export async function generateImage(options: ImageOptions): Promise<GenerationResult> {
  const agnesKey = getAgnesKey()
  const zhipuKey = getZhipuKey()

  if (agnesKey) {
    try {
      const body: Record<string, unknown> = {
        model: 'agnes-image-2.1-flash',
        prompt: options.prompt,
        size: options.size || '1K',
        ratio: options.ratio || '1:1',
        negative_prompt: options.negativePrompt || '',
      }
      if (options.image) body.image = options.image
      if (options.steps) body.steps = options.steps

      const resp = await fetchWithTimeout(
        `${AGNES_BASE_URL}/images/generations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${agnesKey}`,
          },
          body: JSON.stringify(body),
        },
        60000
      )

      if (resp.ok) {
        const data = await resp.json()
        const url = data.data?.[0]?.url || data.url
        if (url) return { url, provider: 'agnes-image-2.1-flash' }
      }
    } catch {}
  }

  if (zhipuKey) {
    try {
      const resp = await fetchWithTimeout(
        `${ZHIPU_BASE_URL}/generations`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${zhipuKey}`,
          },
          body: JSON.stringify({
            model: 'glm-image',
            prompt: options.prompt,
            size: options.size === '4K' ? '2048x2048' : '1024x1024',
          }),
        },
        60000
      )

      if (resp.ok) {
        const data = await resp.json()
        const url = data.output?.url || data.data?.[0]?.url
        if (url) return { url, provider: 'zhipu-glm-image' }
      }
    } catch {}
  }

  // Fallback
  return {
    url: `https://picsum.photos/seed/${Date.now()}/1024/768`,
    provider: 'fallback',
  }
}

// ── 3. Video ──
export async function generateVideo(options: VideoOptions): Promise<GenerationResult> {
  const agnesKey = getAgnesKey()

  if (agnesKey) {
    try {
      const body: Record<string, unknown> = {
        model: 'agnes-video-v2.0',
        prompt: options.prompt,
        height: 768,
        width: 1152,
        num_frames: options.numFrames || 121,
        frame_rate: options.frameRate || 24,
      }
      if (options.image) body.image = options.image

      const resp = await fetchWithTimeout(
        `${AGNES_BASE_URL}/videos`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${agnesKey}`,
          },
          body: JSON.stringify(body),
        },
        120000
      )

      if (resp.ok) {
        const data = await resp.json()
        const taskId = data.task_id || data.id
        if (taskId) {
          const result = await pollVideoResult(taskId, agnesKey)
          if (result) return { url: result, provider: 'agnes-video-v2.0' }
        }
        const url = data.url || data.video_url
        if (url) return { url, provider: 'agnes-video-v2.0' }
      }
    } catch {}
  }

  return {
    url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
    provider: 'fallback',
  }
}

async function pollVideoResult(
  taskId: string,
  apiKey: string,
  maxAttempts = 30,
  delayMs = 3000
): Promise<string | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const resp = await fetchWithTimeout(
        `${AGNES_BASE_URL}/videos/${taskId}`,
        {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${apiKey}` },
        },
        10000
      )
      if (resp.ok) {
        const data = await resp.json()
        if (data.status === 'completed') return data.url || data.video_url || null
        if (data.status === 'failed') return null
      }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, delayMs))
  }
  return null
}

// ── Legacy exports ──
export const generateImageLegacy = generateImage
export const generateVideoLegacy = generateVideo
