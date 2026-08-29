import { NextRequest, NextResponse } from 'next/server'
import { generateImage } from '@/lib/ai/agnes'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { prompt, image, size, ratio, negativePrompt } = body
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt required' }, { status: 400 })
    }

    const result = await generateImage({
      prompt,
      image,
      size: size || '1K',
      ratio: ratio || '1:1',
      negativePrompt,
    })

    return NextResponse.json({ url: result.url, provider: result.provider })
  } catch (error) {
    console.error('Image API error:', error)
    return NextResponse.json({ error: 'Image generation failed' }, { status: 500 })
  }
}
