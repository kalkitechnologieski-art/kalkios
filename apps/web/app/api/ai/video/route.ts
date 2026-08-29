import { NextRequest, NextResponse } from 'next/server'
import { generateVideo } from '@/lib/ai/agnes'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, image, duration, resolution, motion } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const result = await generateVideo({
      prompt,
      image,
      duration,
      resolution,
      motion,
    })

    return NextResponse.json({ url: result.url, provider: result.provider })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Video generation failed' },
      { status: 500 }
    )
  }
}
