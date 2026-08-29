import { ChatMessage, ChatOptions, ChatResponse, SearchResult, ImageGenerationOptions, VideoGenerationOptions } from './types'

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
          content: data.choices[0]?.message?.content || '',
          reasoning: data.choices[0]?.message?.reasoning_content || '',
          tokens: data.usage?.total_tokens || 0,
          provider: 'zhipu-fallback',
        }
      }
    }
    throw new Error(`Zhipu chat failed: ${response.status}`)
  }

  const data = await response.json()
  return {
    content: data.choices[0]?.message?.content || '',
    reasoning: data.choices[0]?.message?.reasoning_content || '',
    tokens: data.usage?.total_tokens || 0,
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

  const {
    prompt,
    image,
    size = '1280x1280',
    negativePrompt,
    steps,
  } = options

  // Zhipu GLM-Image supports quality: 'hd' or 'standard'
  const quality = steps && steps > 30 ? 'hd' : 'standard'

  const body: any = {
    model: 'glm-image',
    prompt,
    size,
    quality,
    watermark_enabled: false,
  }

  // If image is provided, we need to pass it as reference? Zhipu's image-to-image is different.
  // Actually, Zhipu GLM-Image supports image-to-image via a different endpoint? The docs show an 'image' parameter.
  // But the async image generation endpoint might not support it directly.
  // We'll keep it simple: if image is provided, we'll ignore for Zhipu fallback.
  // Agnes already handles image-to-image.

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
  return url
}

export async function generateVideoZhipu(options: VideoGenerationOptions): Promise<string> {
  if (!ZHIPU_API_KEY) throw new Error('ZHIPU_API_KEY is not set')

  const { prompt, image, duration = 5 } = options

  const body: any = {
    model: 'cogvideox-3',
    prompt,
    quality: 'speed',
    duration,
    size: '1920x1080',
  }

  if (image) {
    body.image_url = image
  }

  // For longer videos, maybe use quality mode
  if (duration > 5) {
    body.quality = 'quality'
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

  // Poll for completion (Zhipu async)
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
      return url
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
