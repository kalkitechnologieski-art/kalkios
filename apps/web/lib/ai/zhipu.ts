import { ChatMessage, ChatOptions, ChatResponse, SearchResult, ImageGenerationOptions, VideoGenerationOptions } from './types'
import { ensureString } from '@/lib/utils/string'

const ZHIPU_BASE = 'https://open.bigmodel.cn/api/paas/v4/'
const ZHIPU_API_KEY = process.env.ZHIPU_API_KEY

export async function generateChat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  if (!ZHIPU_API_KEY) throw new Error('ZHIPU_API_KEY is not set')

  const { temperature = 0.7, max_tokens = 2000, deep = false, reasoning_effort = 'max' } = options

  const body: any = {
    model: 'glm-5.3',
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
      ...(m.reasoning_content && { reasoning_content: m.reasoning_content }),
    })),
    temperature,
    max_tokens,
  }

  if (deep) {
    body.thinking = {
      type: 'enabled',
      clear_thinking: false,
    }
    body.reasoning_effort = reasoning_effort
  }

  const response = await fetch(`${ZHIPU_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ZHIPU_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    // Fallback to GLM-5.2 if available
    if (body.model === 'glm-5.3') {
      body.model = 'glm-5.2'
      const fallbackResponse = await fetch(`${ZHIPU_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ZHIPU_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json()
        return {
          content: ensureString(data.choices[0]?.message?.content, 'No response.'),
          reasoning: ensureString(data.choices[0]?.message?.reasoning_content, ''),
          tokens: typeof data.usage?.total_tokens === 'number' ? data.usage.total_tokens : 0,
          provider: 'zhipu-fallback',
        }
      }
    }
    const errorText = await response.text()
    throw new Error(`Zhipu chat failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  return {
    content: ensureString(data.choices[0]?.message?.content, 'No response.'),
    reasoning: ensureString(data.choices[0]?.message?.reasoning_content, ''),
    tokens: typeof data.usage?.total_tokens === 'number' ? data.usage.total_tokens : 0,
    provider: 'zhipu',
  }
}

export async function webSearch(query: string, count = 10): Promise<SearchResult[]> {
  if (!ZHIPU_API_KEY) throw new Error('ZHIPU_API_KEY is not set')

  const response = await fetch(`${ZHIPU_BASE}/web_search`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ZHIPU_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      search_query: query,
      search_engine: 'search_pro',
      count,
      search_recency_filter: 'noLimit',
      content_size: 'medium',
    }),
  })

  if (!response.ok) throw new Error(`Zhipu search failed: ${response.status}`)

  const data = await response.json()
  const results = data.search_result || []
  return results.map((r: any) => ({
    title: r.title || '',
    url: r.link || '',
    snippet: r.content || '',
    source: r.media || '',
    date: r.publish_date || '',
  }))
}

export async function generateImageZhipu(options: ImageGenerationOptions): Promise<string> {
  if (!ZHIPU_API_KEY) throw new Error('ZHIPU_API_KEY is not set')

  const { prompt, size = '1280x1280' } = options

  const body: any = {
    model: 'glm-image',
    prompt,
    size,
    quality: 'hd',
    watermark_enabled: false,
  }

  const response = await fetch(`${ZHIPU_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ZHIPU_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Zhipu image generation failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const url = data.data?.[0]?.url
  if (!url) throw new Error('No image URL returned from Zhipu')
  return ensureString(url, '')
}

export async function generateVideoZhipu(options: VideoGenerationOptions): Promise<string> {
  if (!ZHIPU_API_KEY) throw new Error('ZHIPU_API_KEY is not set')

  const { prompt, image, duration = 5 } = options

  const body: any = {
    model: 'cogvideox-3',
    prompt,
    quality: duration > 5 ? 'quality' : 'speed',
    duration,
    size: '1920x1080',
  }

  if (image) {
    body.image_url = image
  }

  const response = await fetch(`${ZHIPU_BASE}/videos/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ZHIPU_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Zhipu video task creation failed (${response.status}): ${errorText}`)
  }

  const task = await response.json()
  const taskId = task.id
  if (!taskId) throw new Error('No task ID returned from Zhipu')

  const maxAttempts = 40
  let delay = 2000

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, delay))

    const statusResponse = await fetch(`${ZHIPU_BASE}/async/result/${taskId}`, {
      headers: {
        'Authorization': `Bearer ${ZHIPU_API_KEY}`,
      },
    })

    if (!statusResponse.ok) continue

    const statusData = await statusResponse.json()

    if (statusData.task_status === 'SUCCESS') {
      const url = statusData.video_url
      if (!url) throw new Error('No video URL returned from Zhipu')
      return ensureString(url, '')
    }

    if (statusData.task_status === 'FAIL') {
      throw new Error('Zhipu video generation failed')
    }

    if (attempt % 5 === 0 && delay < 8000) {
      delay = Math.min(delay * 1.5, 8000)
    }
  }

  throw new Error('Zhipu video generation timed out')
}

export async function performOCR(file: File): Promise<string> {
  if (!ZHIPU_API_KEY) throw new Error('ZHIPU_API_KEY is not set')

  const formData = new FormData()
  formData.append('file', file)
  formData.append('tool_type', 'hand_write')

  const response = await fetch(`${ZHIPU_BASE}/files/ocr`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ZHIPU_API_KEY}`,
    },
    body: formData,
  })

  if (!response.ok) throw new Error(`Zhipu OCR failed: ${response.status}`)

  const data = await response.json()
  const words = data.words_result || []
  return words.map((w: any) => w.words).join('\n')
}

export async function generateLeads(query: string): Promise<any[]> {
  try {
    const results = await webSearch(query);
    return results.map((r: any) => ({
      name: r.title || null,
      email: null,
      phone: null,
      company: r.source || null,
      jobTitle: null,
      linkedinUrl: null,
      twitterUrl: null,
      city: null,
      country: null,
      verified: false,
      confidence: 0.5,
      source: 'zhipu-web-search',
    }));
  } catch {
    return [];
  }
}
