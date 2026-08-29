/**
 * Agnes AI — Enterprise-grade Image & Video Generation
 * Documentation: platform.agnes-ai.com
 * No credit card required for free tier.
 */

const AGNES_API_URL = 'https://apihub.agnes-ai.com/v1'

export interface ImageGenerationOptions {
  prompt: string
  image?: string // base64 or URL for image-to-image
  resolution?: '1K' | '2K' | '4K'
  negativePrompt?: string
  steps?: number
  guidance?: number
}

export interface VideoGenerationOptions {
  prompt: string
  image?: string // base64 or URL for image-to-video
  duration?: 3 | 5 | 10 | 18
  resolution?: '480p' | '720p' | '1080p'
  fps?: number
  motion?: 1 | 2 | 3 | 4 | 5
}

const API_KEY = process.env.AGNES_API_KEY

/**
 * Generate an image using Agnes AI
 */
export async function generateImage(options: ImageGenerationOptions) {
  if (!API_KEY) {
    console.warn('AGNES_API_KEY not set. Using fallback mock.')
    return mockImageResponse(options)
  }

  const response = await fetch(`${AGNES_API_URL}/images/generations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'agnes-image-2.1-flash',
      prompt: options.prompt,
      image: options.image || null,
      resolution: options.resolution || '1K',
      negative_prompt: options.negativePrompt || '',
      steps: options.steps || 30,
      guidance_scale: options.guidance || 7.5,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Agnes AI error: ${response.status} ${error}`)
  }

  return response.json()
}

/**
 * Generate a video using Agnes AI
 */
export async function generateVideo(options: VideoGenerationOptions) {
  if (!API_KEY) {
    console.warn('AGNES_API_KEY not set. Using fallback mock.')
    return mockVideoResponse(options)
  }

  const response = await fetch(`${AGNES_API_URL}/videos`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'agnes-video-v2.0',
      prompt: options.prompt,
      image: options.image || null,
      duration: options.duration || 5,
      resolution: options.resolution || '720p',
      fps: options.fps || 24,
      motion: options.motion || 3,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Agnes AI error: ${response.status} ${error}`)
  }

  return response.json()
}

// ── Mock responses for development (no API key) ──
function mockImageResponse(options: ImageGenerationOptions) {
  return {
    data: [{
      url: `https://picsum.photos/seed/${Date.now()}/1024/768`,
      revised_prompt: options.prompt,
    }],
  }
}

function mockVideoResponse(options: VideoGenerationOptions) {
  return {
    data: {
      url: 'https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4',
      duration: options.duration || 5,
      resolution: options.resolution || '720p',
    },
  }
}
