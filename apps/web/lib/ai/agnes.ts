import { ChatMessage, ChatOptions, ChatResponse, ImageGenerationOptions, VideoGenerationOptions } from './types'

const AGNES_BASE = 'https://apihub.agnes-ai.com/v1'
const AGNES_API_KEY = process.env.AGNES_API_KEY

// Agnes models
const CHAT_MODELS = ['agnes-2.5-flash', 'agnes-2.0-flash']
const IMAGE_MODEL = 'agnes-image-2.1-flash'
const VIDEO_MODEL = 'agnes-video-2.5-flash'

export async function generateChat(
  messages: ChatMessage[],
  options: ChatOptions = {}
): Promise<ChatResponse> {
  if (!AGNES_API_KEY) throw new Error('AGNES_API_KEY is not set')

  const { temperature = 0.7, max_tokens = 2000, stream = false } = options

  const body = {
    model: CHAT_MODELS[0],
    messages: messages.map(m => ({
      role: m.role,
      content: m.content,
      ...(m.reasoning_content && { reasoning_content: m.reasoning_content }),
    })),
    temperature,
    max_tokens,
    stream,
  }

  const response = await fetch(`${AGNES_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AGNES_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    if (CHAT_MODELS.length > 1) {
      const fallbackBody = { ...body, model: CHAT_MODELS[1] }
      const fallbackResponse = await fetch(`${AGNES_BASE}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AGNES_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fallbackBody),
      })
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json()
        return {
          content: data.choices[0]?.message?.content || '',
          reasoning: data.choices[0]?.message?.reasoning || '',
          tokens: data.usage?.total_tokens || 0,
          provider: 'agnes-fallback',
        }
      }
    }
    throw new Error(`Agnes chat failed: ${response.status}`)
  }

  const data = await response.json()
  return {
    content: data.choices[0]?.message?.content || '',
    reasoning: data.choices[0]?.message?.reasoning || '',
    tokens: data.usage?.total_tokens || 0,
    provider: 'agnes',
  }
}

export async function generateImage(options: ImageGenerationOptions): Promise<string> {
  if (!AGNES_API_KEY) throw new Error('AGNES_API_KEY is not set')

  const {
    prompt,
    image,
    size = '1K',
    ratio = '1:1',
    negativePrompt = '',
    steps,
  } = options

  const body: any = {
    model: IMAGE_MODEL,
    prompt,
    size,
    ratio,
    extra_body: {
      response_format: 'url',
    },
  }

  // Add optional parameters
  if (negativePrompt) body.extra_body.negative_prompt = negativePrompt
  if (steps) body.extra_body.steps = steps
  if (image) body.extra_body.image = [image]

  const response = await fetch(`${AGNES_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AGNES_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Agnes image generation failed (${response.status}): ${errorText}`)
  }

  const data = await response.json()
  const url = data.data?.[0]?.url
  if (!url) throw new Error('No image URL returned from Agnes')
  return url
}

export async function generateVideo(options: VideoGenerationOptions): Promise<string> {
  if (!AGNES_API_KEY) throw new Error('AGNES_API_KEY is not set')

  const {
    prompt,
    image,
    duration = 5,
    resolution = '720P',
    motion,
  } = options

  // Create task
  const taskBody: any = {
    model: VIDEO_MODEL,
    prompt,
    mode: image ? 'reference' : 'text',
    seconds: String(duration),
    size: resolution,
    aspect_ratio: '16:9',
  }

  if (image) {
    taskBody.images = [image]
  }

  if (motion) {
    taskBody.motion = motion
  }

  const taskResponse = await fetch(`${AGNES_BASE}/videos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AGNES_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(taskBody),
  })

  if (!taskResponse.ok) {
    const errorText = await taskResponse.text()
    throw new Error(`Agnes video task creation failed (${taskResponse.status}): ${errorText}`)
  }

  const taskData = await taskResponse.json()
  const videoId = taskData.video_id
  if (!videoId) throw new Error('No video_id returned from Agnes')

  // Poll for completion with exponential backoff
  const maxAttempts = 60
  let delay = 1500 // ms

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, delay))

    const statusResponse = await fetch(
      `${AGNES_BASE}/agnesapi?video_id=${videoId}&model_name=${VIDEO_MODEL}`,
      {
        headers: {
          'Authorization': `Bearer ${AGNES_API_KEY}`,
        },
      }
    )

    if (!statusResponse.ok) continue

    const statusData = await statusResponse.json()

    if (statusData.status === 'completed') {
      const url = statusData.metadata?.url
      if (!url) throw new Error('No video URL in completed response')
      return url
    }

    if (statusData.status === 'failed') {
      throw new Error(`Video generation failed: ${statusData.error?.message || 'Unknown error'}`)
    }

    // Exponential backoff: double delay up to 10s
    if (attempt % 5 === 0 && delay < 10000) {
      delay = Math.min(delay * 1.5, 10000)
    }
  }

  throw new Error('Video generation timed out after 60 attempts')
}
