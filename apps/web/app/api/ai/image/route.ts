import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/ai/agnes'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, image, resolution, negativePrompt, steps, guidance } = body

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    const result = await generateImage({
      prompt,
      image,
      resolution,
      negativePrompt,
      steps,
      guidance,
    })
    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Image generation failed' },
      { status: 500 }
    )
  }
}
