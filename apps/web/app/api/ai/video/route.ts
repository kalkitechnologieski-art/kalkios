import { NextRequest, NextResponse } from 'next/server'
import { generateVideo } from '@/lib/ai/agnes'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, image, duration, resolution, motion, numFrames, frameRate } = body
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    const result = await generateVideo({
      prompt,
      image,
      duration: duration || 5,
      resolution: resolution || '720p',
      motion: motion || 3,
      numFrames: numFrames || 121,
      frameRate: frameRate || 24,
    })

    return NextResponse.json({ url: result.url, provider: result.provider })
  } catch (error) {
    console.error('Video API error:', error)
    return NextResponse.json({ error: 'Video generation failed' }, { status: 500 })
  }
}
