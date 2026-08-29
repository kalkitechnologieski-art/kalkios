import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/ai'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, image, size, ratio, negativePrompt, steps } = body
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    const url = await generateImage({
      prompt,
      image,
      size: size || '1K',
      ratio: ratio || '1:1',
      negativePrompt,
      steps,
    })

    return NextResponse.json({ url, provider: 'agnes' })
  } catch (error: any) {
    console.error('Image API error:', error)
    return NextResponse.json({ error: error.message || 'Image generation failed' }, { status: 500 })
  }
}
