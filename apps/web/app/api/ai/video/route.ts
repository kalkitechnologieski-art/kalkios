import { NextRequest, NextResponse } from 'next/server'
import { generateVideo } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, image, duration, resolution, motion } = body
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    const url = await generateVideo({
      prompt,
      image,
      duration: duration || 5,
      resolution: resolution || '720P',
      motion,
    })

    return NextResponse.json({ url, provider: 'agnes' })
  } catch (error: any) {
    console.error('Video API error:', error)
    return NextResponse.json({ error: error.message || 'Video generation failed' }, { status: 500 })
  }
}
